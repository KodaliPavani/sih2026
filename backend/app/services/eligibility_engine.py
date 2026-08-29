from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from app.models.models import Student, StudentSkill, SkillEvidence, JobDescription, JobRequirement, Skill, ReadinessScore

IMPORTANCE_WEIGHTS = {
    "HIGH": 3.0,
    "MEDIUM": 2.0,
    "LOW": 1.0
}

def calculate_student_skill_score(db: Session, student_id: str, skill_id: str) -> Tuple[float, int, bool]:
    """
    Calculates weighted skill mastery score considering evidence reliability (VERIFIED vs SELF_REPORTED).
    Returns (mastery_score, evidence_count, has_verified_evidence).
    """
    evidences = db.query(SkillEvidence).filter(
        SkillEvidence.student_id == student_id,
        SkillEvidence.skill_id == skill_id
    ).all()

    if not evidences:
        student_skill = db.query(StudentSkill).filter(
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill_id
        ).first()
        score = student_skill.mastery_score if student_skill else 0.0
        return score, 0, False

    total_weight = 0.0
    weighted_score_sum = 0.0
    has_verified = False

    for ev in evidences:
        # Verified evidence gets higher multiplier (1.5x) than self reported (0.8x)
        reliability_multiplier = 1.5 if ev.verified or ev.source == "VERIFIED" else 0.8
        if ev.verified or ev.source == "VERIFIED":
            has_verified = True
        
        item_weight = ev.weight * reliability_multiplier
        weighted_score_sum += ev.score * item_weight
        total_weight += item_weight

    computed_score = round(weighted_score_sum / total_weight, 2) if total_weight > 0 else 0.0
    return computed_score, len(evidences), has_verified


def evaluate_job_eligibility(db: Session, student: Student, job: JobDescription) -> dict:
    """
    Deterministic explainable eligibility engine.
    Checks CGPA, Branch, and Required Skill thresholds.
    Categorizes student into: ELIGIBLE, NEAR_READY, NOT_ELIGIBLE.
    """
    failed_skills = []
    passed_skills = []
    gap_details = []
    
    # 1. Academic Checks
    allowed_branches = [b.strip().upper() for b in (job.allowed_branches or "").split(",")]
    student_branch = (student.branch or "").strip().upper()
    
    branch_pass = not allowed_branches or student_branch in allowed_branches or "ALL" in allowed_branches
    cgpa_pass = student.cgpa >= job.min_cgpa

    # 2. Skill Requirements Checks
    requirements = db.query(JobRequirement).filter(JobRequirement.job_id == job.id).all()
    
    total_importance_weight = 0.0
    weighted_achievement_sum = 0.0

    for req in requirements:
        skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
        skill_name = skill.canonical_name if skill else "Unknown Skill"
        
        score, ev_count, is_verified = calculate_student_skill_score(db, student.id, req.skill_id)
        
        importance = (req.importance or "HIGH").upper()
        weight = IMPORTANCE_WEIGHTS.get(importance, 2.0)
        
        total_importance_weight += weight
        # Normalized achievement capped at 100%
        achievement = min((score / req.min_score * 100) if req.min_score > 0 else 100.0, 100.0)
        weighted_achievement_sum += achievement * weight

        if score >= req.min_score:
            passed_skills.append({
                "skill": skill_name,
                "student_score": score,
                "required_score": req.min_score,
                "importance": importance,
                "evidence_count": ev_count
            })
        else:
            gap_points = round(req.min_score - score, 2)
            failed_skills.append({
                "skill": skill_name,
                "student_score": score,
                "required_score": req.min_score,
                "importance": importance,
                "gap_points": gap_points,
                "evidence_count": ev_count
            })
            gap_details.append({
                "skill_id": req.skill_id,
                "skill_name": skill_name,
                "current_score": score,
                "required_score": req.min_score,
                "gap_points": gap_points,
                "priority": "HIGH" if importance == "HIGH" else "MEDIUM"
            })

    readiness_percentage = round(weighted_achievement_sum / total_importance_weight, 2) if total_importance_weight > 0 else 80.0

    # Categorization logic:
    # ELIGIBLE: CGPA ok, Branch ok, 0 failed high-importance skills, readiness >= 75%
    # NEAR_READY: CGPA ok, Branch ok, max 2 skill gaps, readiness >= 55%
    # NOT_ELIGIBLE: CGPA fail OR Branch fail OR major gaps
    if not branch_pass or not cgpa_pass:
        status = "NOT_ELIGIBLE"
        reason = f"Academic criteria fail (CGPA min: {job.min_cgpa}, Branch allowed: {job.allowed_branches})"
    elif len(failed_skills) == 0 and readiness_percentage >= 70.0:
        status = "ELIGIBLE"
        reason = "All academic and skill threshold requirements satisfied."
    elif len(failed_skills) <= 2 and readiness_percentage >= 50.0:
        status = "NEAR_READY"
        reason = f"Minor skill gaps in: {', '.join([s['skill'] for s in failed_skills])}"
    else:
        status = "NOT_ELIGIBLE"
        reason = f"Significant skill gaps in: {', '.join([s['skill'] for s in failed_skills])}"

    return {
        "student_id": student.student_id,
        "name": student.name,
        "branch": student.branch,
        "cgpa": student.cgpa,
        "status": status,
        "eligibility_score": readiness_percentage,
        "reason": reason,
        "passed_skills": passed_skills,
        "failed_skills": failed_skills,
        "gap_details": gap_details
    }


def calculate_role_readiness_score(db: Session, student: Student, role_title: str) -> dict:
    """
    Calculates role-specific readiness score based on target role requirements.
    Updates or creates ReadinessScore entry in DB.
    """
    # Find matching job descriptions for role
    jobs = db.query(JobDescription).filter(JobDescription.role_title.ilike(f"%{role_title}%")).all()
    
    if not jobs:
        # Fallback to general skill average if no explicit job description uploaded yet
        student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student.id).all()
        if student_skills:
            avg_score = sum(s.mastery_score for s in student_skills) / len(student_skills)
        else:
            avg_score = student.overall_readiness or 50.0
            
        readiness = round(avg_score, 2)
        status = "Ready" if readiness >= 75 else ("Near Ready" if readiness >= 60 else "Needs Improvement")
        return {"role": role_title, "score": readiness, "status": status, "explanation": "Calculated from aggregate student skill evidence."}

    # Evaluate against the primary job description matching the role
    job = jobs[0]
    result = evaluate_job_eligibility(db, student, job)
    
    # Save or update readiness score
    r_score = db.query(ReadinessScore).filter(
        ReadinessScore.student_id == student.id,
        ReadinessScore.job_role == role_title
    ).first()
    
    status = "Ready" if result["eligibility_score"] >= 75 else ("Near Ready" if result["eligibility_score"] >= 55 else "Needs Improvement")

    if not r_score:
        r_score = ReadinessScore(
            student_id=student.id,
            job_role=role_title,
            score=result["eligibility_score"],
            status=status
        )
        db.add(r_score)
    else:
        r_score.score = result["eligibility_score"]
        r_score.status = status
    
    student.overall_readiness = result["eligibility_score"]
    student.readiness_status = status
    db.commit()

    return {
        "role": role_title,
        "score": result["eligibility_score"],
        "status": status,
        "passed_skills": result["passed_skills"],
        "failed_skills": result["failed_skills"]
    }
