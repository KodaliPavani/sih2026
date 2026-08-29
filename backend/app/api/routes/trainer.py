import random
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import require_role, get_current_user
from app.models.models import (
    User, Student, StudentSkill, Skill, SkillEvidence, TrainingCohort,
    TrainingEnrollment, SkillMasteryHistory, AuditLog
)
from app.services.eligibility_engine import calculate_student_skill_detailed

router = APIRouter(prefix="/trainer", tags=["Trainer & Faculty Portal"])


# Schemas
class StudentProgressUpdateRequest(BaseModel):
    attendance_pct: Optional[float] = None
    completion_pct: Optional[float] = None
    status: Optional[str] = None # Enrolled, In Progress, Completed, Dropped


class StudentEvaluationRequest(BaseModel):
    student_id: str
    post_training_score: float
    feedback: Optional[str] = "Satisfactory completion of practical upskilling modules and lab assessments."


class BulkEvaluationItem(BaseModel):
    student_id: str
    post_training_score: float
    feedback: Optional[str] = None


class BulkEvaluationRequest(BaseModel):
    evaluations: List[BulkEvaluationItem]


class TrainingSessionLogRequest(BaseModel):
    topic: str
    session_date: Optional[str] = None
    duration_hours: float = 2.0
    notes: Optional[str] = None
    attendees_count: Optional[int] = None


def get_trainer_name_from_user(user: User) -> str:
    username = user.username.lower()
    if "dsa" in username:
        return "Prof. K. Sharma (Placement Faculty)"
    elif "spring" in username:
        return "Er. V. Verma (Industry Mentor)"
    elif "sql" in username:
        return "Dr. P. Kodali (Database Lead)"
    elif username == "trainer":
        return "Head Technical Trainer (Faculty Lead)"
    return user.username.replace("_", " ").title()


def get_trainer_cohorts_query(db: Session, current_user: User):
    """
    Returns query for cohorts assigned to this trainer or all if master trainer.
    """
    username = current_user.username.lower()
    query = db.query(TrainingCohort)

    if username == "trainer_dsa":
        query = query.filter(or_(TrainingCohort.instructor.ilike("%Sharma%"), TrainingCohort.title.ilike("%DSA%")))
    elif username == "trainer_spring":
        query = query.filter(or_(TrainingCohort.instructor.ilike("%Verma%"), TrainingCohort.title.ilike("%Spring%")))
    elif username == "trainer_sql":
        query = query.filter(or_(TrainingCohort.instructor.ilike("%Kodali%"), TrainingCohort.title.ilike("%SQL%")))
    # If "trainer" or "admin", returns all cohorts

    return query.order_by(TrainingCohort.created_at.desc())


@router.get("/dashboard")
def get_trainer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Returns high-level overview metrics for the instructor dashboard.
    """
    trainer_name = get_trainer_name_from_user(current_user)
    cohorts = get_trainer_cohorts_query(db, current_user).all()

    cohort_ids = [c.id for c in cohorts]
    
    # Ensure enrollments are populated for these cohorts if empty
    for c in cohorts:
        enr_count = db.query(TrainingEnrollment).filter(TrainingEnrollment.cohort_id == c.id).count()
        if enr_count == 0 and c.skill_id:
            limit_target = c.student_count if (c.student_count and c.student_count > 0) else 45
            low_students = db.query(StudentSkill, Student).join(
                Student, StudentSkill.student_id == Student.id
            ).filter(
                StudentSkill.skill_id == c.skill_id,
                StudentSkill.mastery_score < 60.0
            ).order_by(StudentSkill.mastery_score.asc()).limit(limit_target).all()

            for sk_item, st in low_students:
                enr = TrainingEnrollment(
                    cohort_id=c.id,
                    student_id=st.id,
                    status="Enrolled",
                    attendance_pct=round(random.uniform(85.0, 98.0), 1),
                    completion_pct=round(random.uniform(40.0, 75.0), 1),
                    pre_training_score=sk_item.mastery_score,
                    joined_at=datetime.utcnow()
                )
                db.add(enr)
            db.commit()
            c.student_count = len(low_students)
            db.commit()

    total_enrolled = db.query(TrainingEnrollment).filter(TrainingEnrollment.cohort_id.in_(cohort_ids)).count() if cohort_ids else 0
    avg_attendance = db.query(func.avg(TrainingEnrollment.attendance_pct)).filter(TrainingEnrollment.cohort_id.in_(cohort_ids)).scalar() if cohort_ids else 90.0
    avg_completion = db.query(func.avg(TrainingEnrollment.completion_pct)).filter(TrainingEnrollment.cohort_id.in_(cohort_ids)).scalar() if cohort_ids else 60.0
    
    completed_evals = db.query(TrainingEnrollment).filter(
        TrainingEnrollment.cohort_id.in_(cohort_ids),
        TrainingEnrollment.post_training_score.isnot(None)
    ).count() if cohort_ids else 0

    cohorts_summary = []
    for c in cohorts:
        enrolled_count = db.query(TrainingEnrollment).filter(TrainingEnrollment.cohort_id == c.id).count()
        c_avg_att = db.query(func.avg(TrainingEnrollment.attendance_pct)).filter(TrainingEnrollment.cohort_id == c.id).scalar() or 92.0
        c_avg_comp = db.query(func.avg(TrainingEnrollment.completion_pct)).filter(TrainingEnrollment.cohort_id == c.id).scalar() or 65.0
        evaluated_count = db.query(TrainingEnrollment).filter(
            TrainingEnrollment.cohort_id == c.id,
            TrainingEnrollment.post_training_score.isnot(None)
        ).count()

        cohorts_summary.append({
            "id": c.id,
            "title": c.title,
            "skill_name": c.skill.canonical_name if c.skill else "General CS",
            "instructor": c.instructor,
            "student_count": enrolled_count,
            "status": c.status,
            "avg_attendance": round(c_avg_att, 1),
            "avg_completion": round(c_avg_comp, 1),
            "evaluated_count": evaluated_count,
            "pending_count": max(0, enrolled_count - evaluated_count),
            "created_at": c.created_at
        })

    return {
        "trainer": {
            "username": current_user.username,
            "name": trainer_name,
            "role": current_user.role
        },
        "metrics": {
            "assigned_cohorts": len(cohorts),
            "total_students": total_enrolled,
            "avg_attendance_pct": round(avg_attendance or 90.0, 1),
            "avg_completion_pct": round(avg_completion or 60.0, 1),
            "evaluated_count": completed_evals,
            "pending_evaluations": max(0, total_enrolled - completed_evals)
        },
        "cohorts": cohorts_summary
    }


@router.get("/cohorts")
def list_trainer_cohorts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Returns list of cohorts assigned to this trainer.
    """
    cohorts = get_trainer_cohorts_query(db, current_user).all()
    results = []
    for c in cohorts:
        enrolled_count = db.query(TrainingEnrollment).filter(TrainingEnrollment.cohort_id == c.id).count()
        results.append({
            "id": c.id,
            "title": c.title,
            "skill_name": c.skill.canonical_name if c.skill else "General CS",
            "instructor": c.instructor,
            "student_count": enrolled_count or c.student_count,
            "status": c.status,
            "description": c.description,
            "target_role": c.target_role,
            "created_at": c.created_at
        })
    return results


@router.get("/cohorts/{cohort_id}")
def get_trainer_cohort_details(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Returns full cohort information with complete assigned/enrolled student list.
    """
    cohort = db.query(TrainingCohort).filter(TrainingCohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    skill = cohort.skill
    skill_id = skill.id if skill else None

    # Retrieve all enrollments
    enrollments = db.query(TrainingEnrollment, Student).join(
        Student, TrainingEnrollment.student_id == Student.id
    ).filter(TrainingEnrollment.cohort_id == cohort_id).all()

    # If empty, auto-populate from low mastery students
    if not enrollments and skill_id:
        limit_target = cohort.student_count if (cohort.student_count and cohort.student_count > 0) else 45
        st_skills = db.query(StudentSkill, Student).join(
            Student, StudentSkill.student_id == Student.id
        ).filter(
            StudentSkill.skill_id == skill_id,
            StudentSkill.mastery_score < 60.0
        ).order_by(StudentSkill.mastery_score.asc()).limit(limit_target).all()

        for sk_item, st in st_skills:
            enr = TrainingEnrollment(
                cohort_id=cohort.id,
                student_id=st.id,
                status="Enrolled",
                attendance_pct=round(random.uniform(85.0, 98.0), 1),
                completion_pct=round(random.uniform(40.0, 70.0), 1),
                pre_training_score=sk_item.mastery_score,
                joined_at=datetime.utcnow()
            )
            db.add(enr)
        db.commit()
        cohort.student_count = len(st_skills)
        db.commit()

        enrollments = db.query(TrainingEnrollment, Student).join(
            Student, TrainingEnrollment.student_id == Student.id
        ).filter(TrainingEnrollment.cohort_id == cohort_id).all()

    student_roster = []
    for enr, st in enrollments:
        st_sk = None
        if skill_id:
            st_sk = db.query(StudentSkill).filter(
                StudentSkill.student_id == st.id,
                StudentSkill.skill_id == skill_id
            ).first()

        current_score = st_sk.mastery_score if st_sk else round(random.uniform(32.0, 58.0), 1)

        # Check if faculty verified evidence exists for this skill
        faculty_ev = None
        if skill_id:
            faculty_ev = db.query(SkillEvidence).filter(
                SkillEvidence.student_id == st.id,
                SkillEvidence.skill_id == skill_id,
                SkillEvidence.type == "Faculty Verification"
            ).first()

        student_roster.append({
            "enrollment_id": enr.id,
            "student_id": st.student_id,
            "name": st.name,
            "branch": st.branch,
            "cgpa": st.cgpa,
            "email": st.email,
            "target_role": st.target_role,
            "overall_readiness": st.overall_readiness,
            "pre_training_score": enr.pre_training_score or (round(current_score - 15.0, 1) if current_score > 20 else current_score),
            "current_mastery_score": current_score,
            "post_training_score": enr.post_training_score,
            "attendance_pct": enr.attendance_pct or 90.0,
            "completion_pct": enr.completion_pct or 50.0,
            "status": enr.status or "Enrolled",
            "faculty_verified": faculty_ev is not None,
            "joined_at": enr.joined_at
        })

    return {
        "cohort": {
            "id": cohort.id,
            "title": cohort.title,
            "skill_name": skill.canonical_name if skill else "General CS",
            "instructor": cohort.instructor,
            "target_role": cohort.target_role,
            "description": cohort.description,
            "status": cohort.status,
            "total_students": len(student_roster)
        },
        "students": sorted(student_roster, key=lambda x: x["current_mastery_score"])
    }


@router.put("/enrollments/{enrollment_id}/progress")
def update_student_progress(
    enrollment_id: str,
    request: StudentProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Updates attendance, completion percentage, and enrollment status for an individual student.
    """
    enr = db.query(TrainingEnrollment).filter(TrainingEnrollment.id == enrollment_id).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    if request.attendance_pct is not None:
        enr.attendance_pct = max(0.0, min(100.0, request.attendance_pct))
    if request.completion_pct is not None:
        enr.completion_pct = max(0.0, min(100.0, request.completion_pct))
    if request.status is not None:
        enr.status = request.status

    db.commit()
    db.refresh(enr)

    return {
        "message": "Student training progress updated successfully",
        "enrollment_id": enr.id,
        "attendance_pct": enr.attendance_pct,
        "completion_pct": enr.completion_pct,
        "status": enr.status
    }


@router.post("/cohorts/{cohort_id}/evaluate-student")
def evaluate_student_performance(
    cohort_id: str,
    request: StudentEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Grades an enrolled student's post-training assessment:
    1. Records post_training_score in TrainingEnrollment.
    2. Issues verified Faculty Endorsement Evidence (Weight = 1.8).
    3. Recomputes student's skill mastery score & overall role readiness dynamically.
    4. Logs mastery history.
    """
    cohort = db.query(TrainingCohort).filter(TrainingCohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    st = db.query(Student).filter(
        or_(Student.id == request.student_id, Student.student_id == request.student_id)
    ).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    enr = db.query(TrainingEnrollment).filter(
        TrainingEnrollment.cohort_id == cohort.id,
        TrainingEnrollment.student_id == st.id
    ).first()
    if not enr:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this cohort")

    score = max(0.0, min(100.0, request.post_training_score))
    enr.post_training_score = score
    enr.completion_pct = 100.0
    enr.status = "Completed"
    db.commit()

    skill = cohort.skill
    if skill:
        st_sk = db.query(StudentSkill).filter(
            StudentSkill.student_id == st.id,
            StudentSkill.skill_id == skill.id
        ).first()

        old_score = st_sk.mastery_score if st_sk else 40.0

        # Log Faculty Verification Evidence (Highest weight: 1.8)
        evidence = SkillEvidence(
            student_id=st.id,
            skill_id=skill.id,
            type="Faculty Verification",
            source=f"{cohort.title} ({cohort.instructor})",
            score=score,
            weight=1.8,
            verified=True,
            description=request.feedback or f"Completed cohort training modules with post-assessment score of {score}%"
        )
        db.add(evidence)
        db.commit()

        # Recalculate deterministic skill mastery
        detailed = calculate_student_skill_detailed(db, st.id, skill.id)
        new_mastery = detailed["mastery_score"]

        if st_sk:
            st_sk.mastery_score = new_mastery
            st_sk.mastery_state = detailed["mastery_state"]
            st_sk.confidence = detailed["confidence"]
            st_sk.last_assessed_at = datetime.utcnow()
        else:
            st_sk = StudentSkill(
                student_id=st.id,
                skill_id=skill.id,
                mastery_score=new_mastery,
                mastery_state=detailed["mastery_state"],
                confidence=detailed["confidence"]
            )
            db.add(st_sk)

        # Log to mastery history
        history = SkillMasteryHistory(
            student_id=st.id,
            skill_id=skill.id,
            old_score=old_score,
            new_score=new_mastery,
            change_delta=round(new_mastery - old_score, 1),
            evidence_source=f"Faculty Verification: {cohort.title}"
        )
        db.add(history)

        # Recalculate overall student readiness
        avg_score = db.query(func.avg(StudentSkill.mastery_score)).filter(StudentSkill.student_id == st.id).scalar() or new_mastery
        st.overall_readiness = round(avg_score, 1)
        if st.overall_readiness >= 75.0:
            st.readiness_status = "Ready"
        elif st.overall_readiness >= 60.0:
            st.readiness_status = "Near Ready"
        else:
            st.readiness_status = "Needs Improvement"

        db.commit()

        log = AuditLog(
            user_id=current_user.id,
            action="TRAINER_EVALUATION_COMPLETED",
            target_resource=f"Student: {st.student_id}, Skill: {skill.canonical_name}",
            details_json=f"Post-training score: {score}%, New Mastery: {new_mastery}%"
        )
        db.add(log)
        db.commit()

        return {
            "message": "Student evaluation recorded and verified evidence issued",
            "student_id": st.student_id,
            "student_name": st.name,
            "skill": skill.canonical_name,
            "post_training_score": score,
            "old_mastery": old_score,
            "new_mastery": new_mastery,
            "mastery_state": detailed["mastery_state"],
            "new_overall_readiness": st.overall_readiness
        }

    return {"message": "Evaluation recorded", "post_training_score": score}


@router.post("/cohorts/{cohort_id}/bulk-endorse")
def bulk_endorse_cohort_students(
    cohort_id: str,
    request: BulkEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["TRAINER", "PLACEMENT_CELL"]))
):
    """
    Batch evaluates and endorses multiple students in the cohort.
    """
    cohort = db.query(TrainingCohort).filter(TrainingCohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    skill = cohort.skill
    evaluated_count = 0

    for item in request.evaluations:
        st = db.query(Student).filter(
            or_(Student.id == item.student_id, Student.student_id == item.student_id)
        ).first()
        if not st:
            continue

        enr = db.query(TrainingEnrollment).filter(
            TrainingEnrollment.cohort_id == cohort.id,
            TrainingEnrollment.student_id == st.id
        ).first()
        if not enr:
            continue

        score = max(0.0, min(100.0, item.post_training_score))
        enr.post_training_score = score
        enr.completion_pct = 100.0
        enr.status = "Completed"

        if skill:
            st_sk = db.query(StudentSkill).filter(
                StudentSkill.student_id == st.id,
                StudentSkill.skill_id == skill.id
            ).first()
            old_score = st_sk.mastery_score if st_sk else 40.0

            evidence = SkillEvidence(
                student_id=st.id,
                skill_id=skill.id,
                type="Faculty Verification",
                source=f"{cohort.title} ({cohort.instructor})",
                score=score,
                weight=1.8,
                verified=True,
                description=item.feedback or f"Batch endorsement on successful cohort completion ({score}%)"
            )
            db.add(evidence)
            db.commit()

            detailed = calculate_student_skill_detailed(db, st.id, skill.id)
            new_mastery = detailed["mastery_score"]

            if st_sk:
                st_sk.mastery_score = new_mastery
                st_sk.mastery_state = detailed["mastery_state"]
                st_sk.confidence = detailed["confidence"]
                st_sk.last_assessed_at = datetime.utcnow()

            history = SkillMasteryHistory(
                student_id=st.id,
                skill_id=skill.id,
                old_score=old_score,
                new_score=new_mastery,
                change_delta=round(new_mastery - old_score, 1),
                evidence_source=f"Batch Faculty Verification: {cohort.title}"
            )
            db.add(history)

            avg_score = db.query(func.avg(StudentSkill.mastery_score)).filter(StudentSkill.student_id == st.id).scalar() or new_mastery
            st.overall_readiness = round(avg_score, 1)

        evaluated_count += 1

    db.commit()
    return {"message": f"Successfully evaluated and endorsed {evaluated_count} students"}
