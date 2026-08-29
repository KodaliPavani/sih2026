from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import get_current_student
from app.models.models import (
    Student, StudentSkill, SkillEvidence, Skill, ReadinessScore, ReadinessHistory, SkillGap, LearningRecommendation, PlacementApplication
)
from app.schemas.schemas import (
    StudentProfileResponse, StudentProfileUpdate, StudentSkillResponse, EvidenceResponse, LearningRecommendationResponse
)
from app.services.eligibility_engine import calculate_role_readiness_score
from app.services.gemini_service import generate_learning_recommendations_with_gemini

router = APIRouter(prefix="/students", tags=["Student Portal"])

@router.get("/me/profile", response_model=StudentProfileResponse)
def get_my_profile(student: Student = Depends(get_current_student)):
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
        certifications_count=student.certifications_count or 0
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

    return get_my_profile(student)


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
        ev_count = db.query(SkillEvidence).filter(
            SkillEvidence.student_id == student.id,
            SkillEvidence.skill_id == skill.id
        ).count()

        score = st_skill.mastery_score
        if score >= 75:
            status = "Strong"
        elif score >= 60:
            status = "Medium Gap"
        elif score >= 45:
            status = "Gap"
        else:
            status = "Major Gap"

        result.append(StudentSkillResponse(
            id=st_skill.id,
            skill_name=skill.canonical_name,
            category=skill.category or "Technical",
            mastery_score=st_skill.mastery_score,
            confidence=st_skill.confidence or "Medium",
            last_assessed_at=st_skill.last_assessed_at,
            evidence_count=ev_count,
            status=status
        ))

    return sorted(result, key=lambda x: x.mastery_score, reverse=True)


@router.get("/me/evidence", response_model=List[EvidenceResponse])
def get_my_evidence(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    evidences = db.query(SkillEvidence, Skill).join(Skill, SkillEvidence.skill_id == Skill.id).filter(
        SkillEvidence.student_id == student.id
    ).all()

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
        "overall_readiness": student.overall_readiness,
        "status": student.readiness_status,
        "passed_skills": role_info.get("passed_skills", []),
        "failed_skills": role_info.get("failed_skills", []),
        "readiness_history": history_data
    }


@router.get("/me/gaps")
def get_my_skill_gaps(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    skills_data = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()

    gaps = []
    for st_skill, skill in skills_data:
        req_score = 65.0
        if st_skill.mastery_score < req_score:
            gap_pts = round(req_score - st_skill.mastery_score, 1)
            priority = "HIGH" if gap_pts >= 25 else ("MEDIUM" if gap_pts >= 10 else "LOW")
            gaps.append({
                "skill_name": skill.canonical_name,
                "current_score": st_skill.mastery_score,
                "required_score": req_score,
                "gap_points": gap_pts,
                "priority": priority,
                "reason": f"Required threshold for {student.target_role} is {req_score}%"
            })

    return sorted(gaps, key=lambda x: x["gap_points"], reverse=True)


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
        if st_skill.mastery_score < req_score:
            modules = generate_learning_recommendations_with_gemini(
                skill.canonical_name, st_skill.mastery_score, req_score
            )
            recommendations.append({
                "skill_name": skill.canonical_name,
                "current_score": st_skill.mastery_score,
                "target_score": req_score,
                "modules": modules
            })

    return recommendations


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
            "company_name": job.company_name if job else "Tech Corp",
            "role_title": job.role_title if job else "Software Engineer",
            "current_stage": app.current_stage,
            "status": app.status,
            "applied_at": app.applied_at
        })
    return results
