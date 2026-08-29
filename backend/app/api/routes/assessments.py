from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import get_current_student
from app.models.models import (
    Student, StudentSkill, Skill, SkillEvidence, Reassessment, ReadinessHistory, AuditLog
)
from app.schemas.schemas import ReassessmentSubmitRequest, ReassessmentResultResponse
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import calculate_role_readiness_score

router = APIRouter(prefix="/assessments", tags=["Reassessment & Skill Verification"])

@router.post("/reassess", response_model=ReassessmentResultResponse)
def submit_reassessment(
    request: ReassessmentSubmitRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Executes student reassessment for a target skill.
    Calculates new skill mastery score, inserts verified evidence, updates role readiness score,
    records readiness history boost delta, and returns progress summary.
    """
    skill = get_or_create_skill(db, request.skill_name)
    
    st_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student.id,
        StudentSkill.skill_id == skill.id
    ).first()

    old_skill_score = st_skill.mastery_score if st_skill else 32.0
    new_skill_score = round(float(request.assessment_score), 1)

    if not st_skill:
        st_skill = StudentSkill(
            student_id=student.id,
            skill_id=skill.id,
            mastery_score=new_skill_score,
            confidence="High",
            last_assessed_at=datetime.utcnow()
        )
        db.add(st_skill)
    else:
        st_skill.mastery_score = new_skill_score
        st_skill.confidence = "High"
        st_skill.last_assessed_at = datetime.utcnow()

    # Add verified evidence item
    ev = SkillEvidence(
        student_id=student.id,
        skill_id=skill.id,
        type="Coding Assessment",
        source="VERIFIED",
        score=new_skill_score,
        verified=True,
        weight=1.5,
        description=f"Reassessment practical coding test passed with {new_skill_score}% score."
    )
    db.add(ev)

    old_readiness = student.overall_readiness or 52.0

    # Recalculate readiness
    role_info = calculate_role_readiness_score(db, student, student.target_role)
    new_readiness = student.overall_readiness
    readiness_delta = round(new_readiness - old_readiness, 1)

    # Record reassessment history
    reassess_log = Reassessment(
        student_id=student.id,
        skill_id=skill.id,
        old_score=old_skill_score,
        new_score=new_skill_score,
        improvement=round(new_skill_score - old_skill_score, 1),
        completed_at=datetime.utcnow()
    )
    db.add(reassess_log)

    history_log = ReadinessHistory(
        student_id=student.id,
        job_role=student.target_role,
        score=new_readiness,
        change_delta=readiness_delta,
        source=f"Reassessment in {skill.canonical_name} ({old_skill_score}% -> {new_skill_score}%)"
    )
    db.add(history_log)

    audit = AuditLog(
        user_id=student.user_id,
        action="SKILL_REASSESSMENT",
        target_resource=f"Skill: {skill.canonical_name}",
        details_json=f"Score: {old_skill_score} -> {new_skill_score}. Readiness: {old_readiness}% -> {new_readiness}%"
    )
    db.add(audit)

    db.commit()

    message = f"Readiness improved by {readiness_delta} points! Overall readiness updated from {old_readiness}% to {new_readiness}%." if readiness_delta > 0 else "Skill mastery updated successfully."

    return ReassessmentResultResponse(
        skill_name=skill.canonical_name,
        old_skill_score=old_skill_score,
        new_skill_score=new_skill_score,
        old_readiness=old_readiness,
        new_readiness=new_readiness,
        improvement_delta=readiness_delta,
        message=message
    )
