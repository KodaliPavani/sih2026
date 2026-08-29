from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.deps import get_current_student
from app.models.models import (
    Student, StudentSkill, Skill, SkillEvidence, Reassessment, ReadinessHistory, SkillMasteryHistory, AuditLog
)
from app.schemas.schemas import (
    DynamicReassessmentSubmitRequest, ReassessmentResultResponse, QuestionItem
)
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import calculate_student_skill_detailed, calculate_role_readiness_score
from app.services.assessment_engine import get_assessment_questions_for_skill, grade_reassessment

router = APIRouter(prefix="/assessments", tags=["Reassessment & Skill Verification"])

@router.get("/questions", response_model=List[QuestionItem])
def get_skill_questions(
    skill_name: str = Query(..., description="Target skill name to fetch assessment questions for"),
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student)
):
    """
    Fetches real objective assessment questions from the verified question bank for a skill.
    """
    skill, questions = get_assessment_questions_for_skill(db, skill_name)
    
    return [
        QuestionItem(
            id=q.id,
            skill_name=skill.canonical_name,
            question_text=q.question_text,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            difficulty=q.difficulty
        )
        for q in questions
    ]


@router.post("/reassess", response_model=ReassessmentResultResponse)
def submit_reassessment(
    request: DynamicReassessmentSubmitRequest,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Executes student reassessment for a target skill.
    Grades submitted answers objectively, creates verified evidence, updates skill mastery,
    records per-skill mastery history, recalculates role readiness, and creates audit log.
    """
    skill = get_or_create_skill(db, request.skill_name)
    
    st_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student.id,
        StudentSkill.skill_id == skill.id
    ).first()

    old_skill_score = st_skill.mastery_score if st_skill else 0.0
    
    # Grade answers dynamically
    formatted_answers = [
        {"question_id": a.question_id, "selected_option": a.selected_option}
        for a in (request.answers or [])
    ]
    
    new_skill_score, total_mcqs, correct_mcqs, breakdown_msg = grade_reassessment(
        db=db,
        skill=skill,
        submitted_answers=formatted_answers,
        practical_code=request.practical_code,
        direct_score=request.assessment_score
    )

    # Insert verified evidence record
    ev = SkillEvidence(
        student_id=student.id,
        skill_id=skill.id,
        type="Coding Assessment",
        source="VERIFIED",
        score=new_skill_score,
        verified=True,
        weight=1.6,
        description=f"Verified Reassessment ({breakdown_msg})",
        created_at=datetime.utcnow()
    )
    db.add(ev)
    db.commit()

    # Recalculate skill details (mastery, confidence, state)
    detailed = calculate_student_skill_detailed(db, student.id, skill.id)
    final_mastery_score = detailed["mastery_score"]

    if not st_skill:
        st_skill = StudentSkill(
            student_id=student.id,
            skill_id=skill.id,
            mastery_score=final_mastery_score,
            mastery_state=detailed["mastery_state"],
            confidence=detailed["confidence"],
            evidence_count=detailed["evidence_count"],
            last_assessed_at=datetime.utcnow(),
            last_verified_at=datetime.utcnow()
        )
        db.add(st_skill)
    else:
        st_skill.mastery_score = final_mastery_score
        st_skill.mastery_state = detailed["mastery_state"]
        st_skill.confidence = detailed["confidence"]
        st_skill.evidence_count = detailed["evidence_count"]
        st_skill.last_assessed_at = datetime.utcnow()
        st_skill.last_verified_at = datetime.utcnow()

    # Record Skill Mastery History
    mastery_hist = SkillMasteryHistory(
        student_id=student.id,
        skill_id=skill.id,
        old_score=old_skill_score,
        new_score=final_mastery_score,
        change_delta=round(final_mastery_score - old_skill_score, 1),
        evidence_source="Coding Assessment Reassessment",
        recorded_at=datetime.utcnow()
    )
    db.add(mastery_hist)

    old_readiness = student.overall_readiness or 0.0

    # Recalculate readiness
    role_info = calculate_role_readiness_score(db, student, student.target_role)
    new_readiness = student.overall_readiness or 0.0
    readiness_delta = round(new_readiness - old_readiness, 1)

    # Record Reassessment Log
    reassess_log = Reassessment(
        student_id=student.id,
        skill_id=skill.id,
        old_score=old_skill_score,
        new_score=final_mastery_score,
        improvement=round(final_mastery_score - old_skill_score, 1),
        completed_at=datetime.utcnow()
    )
    db.add(reassess_log)

    history_log = ReadinessHistory(
        student_id=student.id,
        job_role=student.target_role,
        score=new_readiness,
        change_delta=readiness_delta,
        source=f"Reassessment in {skill.canonical_name} ({old_skill_score}% -> {final_mastery_score}%)"
    )
    db.add(history_log)

    audit = AuditLog(
        user_id=student.user_id,
        action="SKILL_REASSESSMENT",
        target_resource=f"Skill: {skill.canonical_name}",
        details_json=f"Score: {old_skill_score}% -> {final_mastery_score}%. Readiness: {old_readiness}% -> {new_readiness}%"
    )
    db.add(audit)
    db.commit()

    if readiness_delta > 0:
        message = f"Readiness improved by +{readiness_delta} points! Overall readiness increased from {old_readiness}% to {new_readiness}%."
    else:
        message = f"Skill mastery verified at {final_mastery_score}% ({detailed['mastery_state']})."

    return ReassessmentResultResponse(
        skill_name=skill.canonical_name,
        old_skill_score=old_skill_score,
        new_skill_score=final_mastery_score,
        old_readiness=old_readiness,
        new_readiness=new_readiness,
        improvement_delta=readiness_delta,
        evaluated_mcqs=total_mcqs,
        correct_mcqs=correct_mcqs,
        mastery_state=detailed["mastery_state"],
        confidence=detailed["confidence"],
        message=message
    )

