from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import require_role, get_current_user
from app.models.models import (
    Student, StudentSkill, Skill, SkillEvidence, JobDescription, PlacementApplication,
    PlacementDrive, TrainingCohort, TrainingEnrollment, SkillMasteryHistory, AuditLog
)
from app.schemas.schemas import (
    PlacementDriveCreateRequest, PlacementDriveResponse, ApplicationStatusUpdateRequest,
    TrainingCohortCreateRequest, TrainingCohortResponse
)
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import calculate_student_skill_detailed
from app.services.ml_readiness_predictor import ml_engine

router = APIRouter(prefix="/placement", tags=["Placement Cell Portal"])

@router.get("/dashboard")
def get_placement_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    total_students = db.query(Student).count()
    ready_count = db.query(Student).filter(Student.overall_readiness >= 75.0).count()
    near_ready_count = db.query(Student).filter(Student.overall_readiness >= 60.0, Student.overall_readiness < 75.0).count()
    needs_imp_count = db.query(Student).filter(Student.overall_readiness < 60.0).count()

    placed_count = db.query(PlacementApplication).filter(PlacementApplication.status == "Selected").count()
    unplaced_count = total_students - placed_count

    # Branch-wise readiness distribution
    branches = db.query(Student.branch, func.avg(Student.overall_readiness), func.count(Student.id)).group_by(Student.branch).all()
    branch_analytics = [
        {"branch": b[0], "avg_readiness": round(b[1] or 0.0, 1), "student_count": b[2]}
        for b in branches
    ]

    # Aggregate Skill Gap Trends
    skill_gaps_agg = db.query(
        Skill.canonical_name,
        func.avg(StudentSkill.mastery_score),
        func.count(StudentSkill.id)
    ).join(Skill, StudentSkill.skill_id == Skill.id).group_by(Skill.canonical_name).all()

    skill_analytics = [
        {
            "skill": s[0],
            "avg_mastery": round(s[1] or 0.0, 1),
            "gap_rate": round(max(0.0, 65.0 - (s[1] or 0.0)), 1),
            "student_count": s[2]
        }
        for s in skill_gaps_agg
    ]

    active_drives_count = db.query(PlacementDrive).filter(PlacementDrive.status == "Active").count()
    total_applications = db.query(PlacementApplication).count()

    return {
        "metrics": {
            "total_students": total_students,
            "ready": ready_count,
            "near_ready": near_ready_count,
            "needs_improvement": needs_imp_count,
            "placed": placed_count,
            "unplaced": unplaced_count,
            "active_drives": active_drives_count or db.query(JobDescription).count(),
            "total_applications": total_applications
        },
        "readiness_distribution": [
            {"name": "Ready (>= 75%)", "value": ready_count, "color": "#10B981"},
            {"name": "Near Ready (60-74%)", "value": near_ready_count, "color": "#F59E0B"},
            {"name": "Needs Improvement (< 60%)", "value": needs_imp_count, "color": "#EF4444"}
        ],
        "branch_analytics": branch_analytics,
        "skill_analytics": sorted(skill_analytics, key=lambda x: x["gap_rate"], reverse=True)
    }


@router.get("/students")
def search_students(
    search: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    min_cgpa: Optional[float] = Query(None),
    readiness_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    query = db.query(Student)

    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(Student.student_id.ilike(pattern), Student.name.ilike(pattern), Student.target_role.ilike(pattern)))
    if branch and branch != "ALL":
        query = query.filter(Student.branch == branch)
    if min_cgpa:
        query = query.filter(Student.cgpa >= min_cgpa)
    if readiness_status and readiness_status != "ALL":
        query = query.filter(Student.readiness_status == readiness_status)

    students = query.order_by(Student.student_id.asc()).all()

    results = []
    for s in students:
        results.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "cgpa": s.cgpa,
            "target_role": s.target_role,
            "overall_readiness": s.overall_readiness,
            "readiness_status": s.readiness_status,
            "certifications_count": s.certifications_count
        })
    return results


@router.get("/students/{student_id}")
def get_student_details_for_placement(
    student_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    skills = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()

    skill_list = []
    for st_skill, skill in skills:
        detailed = calculate_student_skill_detailed(db, student.id, skill.id)
        skill_list.append({
            "skill_name": skill.canonical_name,
            "category": skill.category,
            "mastery_score": detailed["mastery_score"],
            "mastery_state": detailed["mastery_state"],
            "confidence": detailed["confidence"],
            "recency": detailed["recency_text"]
        })

    evidences = db.query(SkillEvidence, Skill).join(Skill, SkillEvidence.skill_id == Skill.id).filter(
        SkillEvidence.student_id == student.id
    ).order_by(SkillEvidence.created_at.desc()).all()

    evidence_list = []
    for ev, skill in evidences:
        evidence_list.append({
            "skill_name": skill.canonical_name,
            "type": ev.type,
            "source": ev.source,
            "score": ev.score,
            "verified": ev.verified,
            "description": ev.description,
            "created_at": ev.created_at
        })

    history = db.query(SkillMasteryHistory, Skill).join(Skill, SkillMasteryHistory.skill_id == Skill.id).filter(
        SkillMasteryHistory.student_id == student.id
    ).order_by(SkillMasteryHistory.recorded_at.desc()).all()

    history_list = [
        {
            "skill_name": sk.canonical_name,
            "old_score": h.old_score,
            "new_score": h.new_score,
            "change_delta": h.change_delta,
            "evidence_source": h.evidence_source,
            "recorded_at": h.recorded_at
        }
        for h, sk in history
    ]

    return {
        "profile": {
            "id": student.id,
            "student_id": student.student_id,
            "name": student.name,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "email": student.email,
            "phone": student.phone,
            "target_role": student.target_role,
            "overall_readiness": student.overall_readiness,
            "readiness_status": student.readiness_status,
            "attendance_percent": student.attendance_percent
        },
        "skills": skill_list,
        "evidence": evidence_list,
        "mastery_history": history_list
    }


@router.get("/at-risk")
def get_at_risk_students(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    """
    Placement Cell Intervention Intelligence:
    Categorizes and ranks at-risk students using multi-signal logic (readiness < 55%, CGPA < 6.5, weak mandatory skills).
    """
    students = db.query(Student).filter(
        or_(Student.overall_readiness < 55.0, Student.cgpa < 6.5)
    ).order_by(Student.overall_readiness.asc()).all()

    at_risk_list = []
    for s in students:
        weak_skills = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
            StudentSkill.student_id == s.id,
            StudentSkill.mastery_score < 50.0
        ).all()

        gap_names = [sk.canonical_name for _, sk in weak_skills]

        # Determine signal reason
        reasons = []
        if s.overall_readiness < 50.0:
            reasons.append(f"Critical readiness deficit ({s.overall_readiness}%)")
        if s.cgpa < 6.5:
            reasons.append(f"CGPA below baseline threshold ({s.cgpa})")
        if len(gap_names) >= 2:
            reasons.append(f"Deficits in core competencies: {', '.join(gap_names[:3])}")

        at_risk_list.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "cgpa": s.cgpa,
            "target_role": s.target_role,
            "readiness": s.overall_readiness,
            "status": "AT RISK",
            "signals": reasons,
            "major_gaps": gap_names,
            "recommended_action": f"Assign to {gap_names[0] if gap_names else 'Core CS'} Remedial Upskilling Cohort"
        })

    return at_risk_list


# PLACEMENT DRIVES LIFECYCLE ENDPOINTS
@router.get("/drives", response_model=List[PlacementDriveResponse])
def list_placement_drives(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    drives = db.query(PlacementDrive).order_by(PlacementDrive.drive_date.asc()).all()
    results = []
    for d in drives:
        app_count = db.query(PlacementApplication).filter(PlacementApplication.drive_id == d.id).count()
        job = d.job
        results.append(PlacementDriveResponse(
            id=d.id,
            job_id=d.job_id,
            company_name=job.company_name if job else "Enterprise Tech",
            role_title=job.role_title if job else "Software Engineer",
            package_lpa=job.package_lpa if job else 6.0,
            title=d.title or f"{job.company_name if job else 'Campus'} Recruitment Drive",
            drive_date=d.drive_date,
            deadline=d.deadline,
            status=d.status,
            applications_count=app_count,
            created_at=d.created_at
        ))
    return results


@router.post("/drives", response_model=PlacementDriveResponse)
def create_placement_drive(
    request: PlacementDriveCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    job = db.query(JobDescription).filter(JobDescription.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    drive = PlacementDrive(
        job_id=request.job_id,
        title=request.title or f"{job.company_name} - {job.role_title} Placement Drive",
        drive_date=request.drive_date,
        deadline=request.deadline,
        status=request.status,
        created_at=datetime.utcnow()
    )
    db.add(drive)
    
    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_PLACEMENT_DRIVE",
        target_resource=f"Job: {job.company_name}",
        details_json=f"Drive created for {job.role_title} on {request.drive_date}"
    )
    db.add(log)
    db.commit()
    db.refresh(drive)

    return PlacementDriveResponse(
        id=drive.id,
        job_id=drive.job_id,
        company_name=job.company_name,
        role_title=job.role_title,
        package_lpa=job.package_lpa,
        title=drive.title,
        drive_date=drive.drive_date,
        deadline=drive.deadline,
        status=drive.status,
        applications_count=0,
        created_at=drive.created_at
    )


@router.get("/drives/{drive_id}/applications")
def get_drive_applications(
    drive_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    apps = db.query(PlacementApplication).filter(PlacementApplication.drive_id == drive_id).all()
    results = []
    for a in apps:
        st = a.student
        results.append({
            "id": a.id,
            "student_id": st.student_id,
            "name": st.name,
            "branch": st.branch,
            "cgpa": st.cgpa,
            "readiness": st.overall_readiness,
            "current_stage": a.current_stage,
            "status": a.status,
            "interview_feedback": a.interview_feedback,
            "applied_at": a.applied_at
        })
    return results


@router.put("/applications/{application_id}/status")
def update_application_status(
    application_id: str,
    request: ApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    app = db.query(PlacementApplication).filter(PlacementApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = request.status
    if request.current_stage:
        app.current_stage = request.current_stage
    if request.interview_feedback:
        app.interview_feedback = request.interview_feedback
    app.updated_at = datetime.utcnow()

    log = AuditLog(
        user_id=current_user.id,
        action="APPLICATION_STATUS_UPDATE",
        target_resource=f"App: {application_id}",
        details_json=f"Updated status to {request.status}, Stage: {request.current_stage}"
    )
    db.add(log)
    db.commit()

    return {"message": "Application status updated successfully", "status": app.status, "stage": app.current_stage}


# TRAINING COHORTS CRUD ENDPOINTS
@router.get("/training")
def get_training_modules_and_cohorts(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    cohorts_db = db.query(TrainingCohort).order_by(TrainingCohort.created_at.desc()).all()
    
    # Also get aggregated skill gap stats
    skills_agg = db.query(
        Skill.canonical_name,
        func.avg(StudentSkill.mastery_score),
        func.count(StudentSkill.id)
    ).join(Skill, StudentSkill.skill_id == Skill.id).group_by(Skill.canonical_name).all()

    suggestions = []
    for s_name, avg_score, total in skills_agg:
        gap_count = db.query(StudentSkill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
            Skill.canonical_name == s_name,
            StudentSkill.mastery_score < 60.0
        ).count()

        suggestions.append({
            "skill_name": s_name,
            "avg_mastery": round(avg_score or 0.0, 1),
            "students_needing_training": gap_count,
            "status": "Active" if gap_count > 10 else "Scheduled"
        })

    cohorts_list = []
    for c in cohorts_db:
        enrolled_count = db.query(TrainingEnrollment).filter(TrainingEnrollment.cohort_id == c.id).count()
        cohorts_list.append({
            "id": c.id,
            "title": c.title,
            "skill_name": c.skill.canonical_name if c.skill else "General CS",
            "instructor": c.instructor,
            "student_count": enrolled_count or c.student_count,
            "status": c.status,
            "created_at": c.created_at
        })

    return {
        "active_cohorts": cohorts_list,
        "recommended_cohorts": sorted(suggestions, key=lambda x: x["students_needing_training"], reverse=True)
    }


@router.post("/training", response_model=TrainingCohortResponse)
def create_training_cohort(
    request: TrainingCohortCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    skill = get_or_create_skill(db, request.skill_name)

    cohort = TrainingCohort(
        skill_id=skill.id,
        title=request.title,
        description=request.description or f"Intensive upskilling cohort for {skill.canonical_name}",
        target_role=request.target_role,
        instructor=request.instructor or "Placement Training Faculty",
        student_count=len(request.student_ids or []),
        status="Active",
        created_at=datetime.utcnow()
    )
    db.add(cohort)
    db.commit()
    db.refresh(cohort)

    # Auto-enroll specified student IDs or students with gaps
    if request.student_ids:
        for s_id in request.student_ids:
            st = db.query(Student).filter(Student.student_id == s_id).first()
            if st:
                enr = TrainingEnrollment(
                    cohort_id=cohort.id,
                    student_id=st.id,
                    status="Enrolled",
                    joined_at=datetime.utcnow()
                )
                db.add(enr)
        db.commit()

    log = AuditLog(
        user_id=current_user.id,
        action="CREATE_TRAINING_COHORT",
        target_resource=f"Skill: {skill.canonical_name}",
        details_json=f"Cohort: {cohort.title}, Enrolled: {len(request.student_ids or [])}"
    )
    db.add(log)
    db.commit()

    return TrainingCohortResponse(
        id=cohort.id,
        skill_name=skill.canonical_name,
        title=cohort.title,
        description=cohort.description,
        instructor=cohort.instructor,
        student_count=len(request.student_ids or []),
        status=cohort.status,
        created_at=cohort.created_at
    )


# ML EVALUATION ENDPOINT
@router.get("/ml-model/metrics")
def get_ml_model_metrics(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    """
    Returns authentic Scikit-Learn Model Evaluation Metrics on the cohort dataset.
    """
    metrics = ml_engine.train_on_cohort(db)
    return metrics

