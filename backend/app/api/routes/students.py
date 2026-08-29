from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import get_current_student
from app.models.models import (
    Student, StudentSkill, SkillEvidence, Skill, ReadinessScore, ReadinessHistory, SkillMasteryHistory,
    SkillGap, LearningRecommendation, PlacementApplication, PlacementDrive, AuditLog
)
from app.schemas.schemas import (
    StudentProfileResponse, StudentProfileUpdate, StudentSkillResponse, EvidenceResponse,
    EvidenceUploadRequest, SkillMasteryHistoryItem, ReadinessBlockersResponse,
    CareerSimulationRequest, CareerSimulationResponse, LearningRecommendationResponse
)
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import (
    calculate_student_skill_detailed, calculate_role_readiness_score,
    get_student_role_blockers, simulate_career_readiness
)
from app.services.prerequisite_engine import detect_hidden_prerequisite_gaps, order_learning_path_by_prerequisites
from app.services.gemini_service import generate_learning_recommendations_with_gemini

router = APIRouter(prefix="/students", tags=["Student Portal"])

@router.get("/me/profile", response_model=StudentProfileResponse)
def get_my_profile(student: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    ev_count = db.query(SkillEvidence).filter(SkillEvidence.student_id == student.id).count()
    
    return StudentProfileResponse(
        id=student.id,
        student_id=student.student_id,
        name=student.name,
        branch=student.branch,
        cgpa=student.cgpa,
        email=student.email,
        phone=student.phone,
        target_role=student.target_role,
        resume_url=student.resume_url,
        overall_readiness=student.overall_readiness or 0.0,
        readiness_status=student.readiness_status or "Needs Improvement",
        attendance_percent=student.attendance_percent or 80.0,
        certifications_count=student.certifications_count or 0,
        evidence_records_count=ev_count
    )

@router.put("/me/profile", response_model=StudentProfileResponse)
def update_my_profile(
    update_data: StudentProfileUpdate,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    if update_data.target_role:
        student.target_role = update_data.target_role
    if update_data.email:
        student.email = update_data.email
    if update_data.phone:
        student.phone = update_data.phone
    if update_data.resume_url:
        student.resume_url = update_data.resume_url

    db.commit()
    db.refresh(student)

    # Recalculate readiness for new target role
    calculate_role_readiness_score(db, student, student.target_role)

    return get_my_profile(student, db)


@router.get("/me/skills", response_model=List[StudentSkillResponse])
def get_my_skill_passport(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    skills_data = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()

    result = []
    for st_skill, skill in skills_data:
        detailed = calculate_student_skill_detailed(db, student.id, skill.id)
        score = detailed["mastery_score"]

        # Update persisted student_skill record if scores or states drifted
        if st_skill.mastery_score != score or st_skill.mastery_state != detailed["mastery_state"]:
            st_skill.mastery_score = score
            st_skill.mastery_state = detailed["mastery_state"]
            st_skill.confidence = detailed["confidence"]
            st_skill.evidence_count = detailed["evidence_count"]
            db.commit()

        if score >= 75:
            status_text = "Strong"
        elif score >= 60:
            status_text = "Medium Gap"
        elif score >= 45:
            status_text = "Gap"
        else:
            status_text = "Major Gap"

        result.append(StudentSkillResponse(
            id=st_skill.id,
            skill_name=skill.canonical_name,
            category=skill.category or "Technical",
            mastery_score=score,
            mastery_state=detailed["mastery_state"],
            confidence=detailed["confidence"],
            last_assessed_at=st_skill.last_assessed_at,
            last_verified_at=detailed["last_verified_at"],
            evidence_count=detailed["evidence_count"],
            status=status_text,
            recency_text=detailed["recency_text"],
            consistency_warning=detailed["consistency_warning"]
        ))

    return sorted(result, key=lambda x: x.mastery_score, reverse=True)


@router.get("/me/evidence", response_model=List[EvidenceResponse])
def get_my_evidence(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    evidences = db.query(SkillEvidence, Skill).join(Skill, SkillEvidence.skill_id == Skill.id).filter(
        SkillEvidence.student_id == student.id
    ).order_by(SkillEvidence.created_at.desc()).all()

    result = []
    for ev, skill in evidences:
        result.append(EvidenceResponse(
            id=ev.id,
            skill_name=skill.canonical_name,
            type=ev.type,
            source=ev.source,
            score=ev.score,
            verified=ev.verified,
            weight=ev.weight,
            description=ev.description,
            created_at=ev.created_at
        ))
    return result


@router.post("/me/evidence", response_model=EvidenceResponse)
def upload_my_evidence(
    request: EvidenceUploadRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Allows student to upload self-reported evidence (Projects, Certificates, GitHub links).
    Updates skill mastery score and recalculates target role readiness.
    """
    skill = get_or_create_skill(db, request.skill_name)
    
    is_verified = request.evidence_type in ["Coding Assessment", "Faculty Verification"]
    source = "VERIFIED" if is_verified else "SELF_REPORTED"
    
    ev = SkillEvidence(
        student_id=student.id,
        skill_id=skill.id,
        type=request.evidence_type,
        source=source,
        score=float(request.score),
        verified=is_verified,
        weight=1.0,
        description=request.description.strip(),
        created_at=datetime.utcnow()
    )
    db.add(ev)
    db.commit()

    # Recalculate skill mastery
    detailed = calculate_student_skill_detailed(db, student.id, skill.id)
    st_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student.id,
        StudentSkill.skill_id == skill.id
    ).first()

    old_score = st_skill.mastery_score if st_skill else 0.0
    new_score = detailed["mastery_score"]

    if not st_skill:
        st_skill = StudentSkill(
            student_id=student.id,
            skill_id=skill.id,
            mastery_score=new_score,
            mastery_state=detailed["mastery_state"],
            confidence=detailed["confidence"],
            evidence_count=detailed["evidence_count"],
            last_assessed_at=datetime.utcnow()
        )
        db.add(st_skill)
    else:
        st_skill.mastery_score = new_score
        st_skill.mastery_state = detailed["mastery_state"]
        st_skill.confidence = detailed["confidence"]
        st_skill.evidence_count = detailed["evidence_count"]
        st_skill.last_assessed_at = datetime.utcnow()

    # Record mastery history
    hist = SkillMasteryHistory(
        student_id=student.id,
        skill_id=skill.id,
        old_score=old_score,
        new_score=new_score,
        change_delta=round(new_score - old_score, 1),
        evidence_source=f"Evidence Upload: {request.evidence_type}",
        recorded_at=datetime.utcnow()
    )
    db.add(hist)

    # Recalculate readiness
    calculate_role_readiness_score(db, student, student.target_role)

    log = AuditLog(
        user_id=student.user_id,
        action="EVIDENCE_UPLOAD",
        target_resource=f"Skill: {skill.canonical_name}",
        details_json=f"Type: {request.evidence_type}, Score: {request.score}"
    )
    db.add(log)
    db.commit()

    return EvidenceResponse(
        id=ev.id,
        skill_name=skill.canonical_name,
        type=ev.type,
        source=ev.source,
        score=ev.score,
        verified=ev.verified,
        weight=ev.weight,
        description=ev.description,
        created_at=ev.created_at
    )


@router.get("/me/readiness")
def get_my_readiness_breakdown(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    role_info = calculate_role_readiness_score(db, student, student.target_role)

    history = db.query(ReadinessHistory).filter(
        ReadinessHistory.student_id == student.id,
        ReadinessHistory.job_role == student.target_role
    ).order_by(ReadinessHistory.recorded_at.desc()).all()

    history_data = [{"recorded_at": h.recorded_at, "score": h.score, "change_delta": h.change_delta, "source": h.source} for h in history]

    return {
        "target_role": student.target_role,
        "overall_readiness": student.overall_readiness or 0.0,
        "status": student.readiness_status or "Needs Improvement",
        "passed_skills": role_info.get("passed_skills", []),
        "failed_skills": role_info.get("failed_skills", []),
        "readiness_history": history_data
    }


@router.get("/me/blockers", response_model=ReadinessBlockersResponse)
def get_my_role_blockers(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    "Why Am I Not Ready?" Engine Endpoint:
    Provides concrete blockers, deficits, missing prerequisites, and targeted actions.
    """
    blockers_data = get_student_role_blockers(db, student, student.target_role)
    return blockers_data


@router.post("/me/simulate", response_model=CareerSimulationResponse)
def simulate_my_skill_improvements(
    request: CareerSimulationRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    "What If I Learn This?" Career Simulation Endpoint:
    Projects readiness across multiple roles without mutating database state.
    """
    return simulate_career_readiness(db, student, request.skill_improvements)


@router.get("/me/skill-history", response_model=List[SkillMasteryHistoryItem])
def get_my_skill_mastery_history(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    records = db.query(SkillMasteryHistory, Skill).join(Skill, SkillMasteryHistory.skill_id == Skill.id).filter(
        SkillMasteryHistory.student_id == student.id
    ).order_by(SkillMasteryHistory.recorded_at.desc()).all()

    result = []
    for h, sk in records:
        result.append(SkillMasteryHistoryItem(
            skill_name=sk.canonical_name,
            old_score=h.old_score,
            new_score=h.new_score,
            change_delta=h.change_delta,
            evidence_source=h.evidence_source,
            recorded_at=h.recorded_at
        ))
    return result


@router.get("/me/gaps")
def get_my_skill_gaps(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    skills_data = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()

    raw_gaps = []
    for st_skill, skill in skills_data:
        req_score = 65.0
        if (st_skill.mastery_score or 0.0) < req_score:
            gap_pts = round(req_score - (st_skill.mastery_score or 0.0), 1)
            priority = "HIGH" if gap_pts >= 25 else ("MEDIUM" if gap_pts >= 10 else "LOW")
            
            hidden_gaps = detect_hidden_prerequisite_gaps(db, student.id, skill.canonical_name)
            prereq_alert = hidden_gaps[0]["alert"] if hidden_gaps else None

            raw_gaps.append({
                "skill_name": skill.canonical_name,
                "current_score": st_skill.mastery_score or 0.0,
                "required_score": req_score,
                "gap_points": gap_pts,
                "priority": priority,
                "prerequisite_alert": prereq_alert,
                "reason": f"Required threshold for {student.target_role} is {req_score}%"
            })

    # Order gaps with prerequisite awareness
    ordered = order_learning_path_by_prerequisites(db, student.id, raw_gaps)
    return ordered


@router.get("/me/recommendations")
def get_my_learning_recommendations(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    skills_data = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()

    recommendations = []
    for st_skill, skill in skills_data:
        req_score = 65.0
        if (st_skill.mastery_score or 0.0) < req_score:
            hidden_gaps = detect_hidden_prerequisite_gaps(db, student.id, skill.canonical_name)
            prereq_alert = hidden_gaps[0]["alert"] if hidden_gaps else None

            modules = generate_learning_recommendations_with_gemini(
                skill.canonical_name, st_skill.mastery_score or 0.0, req_score
            )
            recommendations.append({
                "skill_name": skill.canonical_name,
                "current_score": st_skill.mastery_score or 0.0,
                "target_score": req_score,
                "prerequisite_alert": prereq_alert,
                "modules": modules
            })

    return recommendations


@router.post("/me/apply")
def apply_to_placement_drive(
    drive_id: str,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Student applies to a placement drive."""
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=404, detail="Placement drive not found")

    existing = db.query(PlacementApplication).filter(
        PlacementApplication.drive_id == drive_id,
        PlacementApplication.student_id == student.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this drive.")

    app = PlacementApplication(
        drive_id=drive_id,
        student_id=student.id,
        current_stage="Registration",
        status="Applied",
        applied_at=datetime.utcnow()
    )
    db.add(app)
    
    log = AuditLog(
        user_id=student.user_id,
        action="APPLICATION_SUBMITTED",
        target_resource=f"Drive: {drive_id}",
        details_json=f"Student {student.student_id} applied to drive {drive_id}"
    )
    db.add(log)
    db.commit()

    return {"message": "Application submitted successfully", "application_id": app.id}


@router.get("/me/applications")
def get_my_placement_applications(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    apps = db.query(PlacementApplication).filter(PlacementApplication.student_id == student.id).all()
    results = []
    for app in apps:
        drive = app.drive
        job = drive.job if drive else None
        results.append({
            "id": app.id,
            "company_name": job.company_name if job else "Enterprise Tech",
            "role_title": job.role_title if job else "Software Engineer",
            "package_lpa": job.package_lpa if job else 6.0,
            "current_stage": app.current_stage,
            "status": app.status,
            "interview_feedback": app.interview_feedback,
            "applied_at": app.applied_at
        })
    return results

