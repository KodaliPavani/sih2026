from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import require_role, get_current_user
from app.models.models import (
    Student, StudentSkill, Skill, SkillEvidence, JobDescription, PlacementApplication, TrainingCohort, TrainingEnrollment
)

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

    return {
        "metrics": {
            "total_students": total_students,
            "ready": ready_count,
            "near_ready": near_ready_count,
            "needs_improvement": needs_imp_count,
            "placed": placed_count,
            "unplaced": unplaced_count,
            "active_drives": db.query(JobDescription).count()
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
        skill_list.append({
            "skill_name": skill.canonical_name,
            "category": skill.category,
            "mastery_score": st_skill.mastery_score,
            "confidence": st_skill.confidence
        })

    evidences = db.query(SkillEvidence, Skill).join(Skill, SkillEvidence.skill_id == Skill.id).filter(
        SkillEvidence.student_id == student.id
    ).all()

    evidence_list = []
    for ev, skill in evidences:
        evidence_list.append({
            "skill_name": skill.canonical_name,
            "type": ev.type,
            "source": ev.source,
            "score": ev.score,
            "verified": ev.verified,
            "description": ev.description
        })

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
        "evidence": evidence_list
    }


@router.get("/at-risk")
def get_at_risk_students(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    """
    Section 25: Auto-detect students with low readiness (<55%), major skill gaps, or low CGPA.
    """
    students = db.query(Student).filter(
        or_(Student.overall_readiness < 55.0, Student.cgpa < 6.5)
    ).order_by(Student.overall_readiness.asc()).all()

    at_risk_list = []
    for s in students:
        # Find major skill gaps
        weak_skills = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
            StudentSkill.student_id == s.id,
            StudentSkill.mastery_score < 50.0
        ).all()

        gap_names = [sk.canonical_name for _, sk in weak_skills]

        at_risk_list.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "branch": s.branch,
            "cgpa": s.cgpa,
            "target_role": s.target_role,
            "readiness": s.overall_readiness,
            "status": "AT RISK",
            "major_gaps": gap_names if gap_names else ["DSA", "Spring Boot"],
            "recommended_action": "Enroll in Urgent Training Cohort"
        })

    return at_risk_list


@router.get("/training")
def get_training_modules_and_cohorts(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["PLACEMENT_CELL"]))
):
    # Common skill gap aggregates
    skills_agg = db.query(
        Skill.canonical_name,
        func.avg(StudentSkill.mastery_score),
        func.count(StudentSkill.id)
    ).join(Skill, StudentSkill.skill_id == Skill.id).group_by(Skill.canonical_name).all()

    cohorts = []
    for s_name, avg_score, total in skills_agg:
        gap_count = db.query(StudentSkill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
            Skill.canonical_name == s_name,
            StudentSkill.mastery_score < 60.0
        ).count()

        cohorts.append({
            "skill_name": s_name,
            "avg_mastery": round(avg_score or 0.0, 1),
            "students_needing_training": gap_count,
            "status": "Active Cohort" if gap_count > 10 else "Scheduled"
        })

    return sorted(cohorts, key=lambda x: x["students_needing_training"], reverse=True)
