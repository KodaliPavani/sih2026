import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Student, StudentSkill, SkillEvidence, JobDescription, JobRequirement, Skill,
    ReadinessScore, ReadinessHistory, SkillGap, EligibilityResult
)
from app.services.prerequisite_engine import detect_hidden_prerequisite_gaps, check_student_prerequisites_met


IMPORTANCE_WEIGHTS = {
    "HIGH": 3.0,
    "MEDIUM": 2.0,
    "LOW": 1.0
}

EVIDENCE_TYPE_WEIGHTS = {
    "Resume Claim": 0.3,
    "Self-reported Project": 0.6,
    "Certificate": 0.7,
    "Verified GitHub Project": 1.2,
    "Practical Task": 1.4,
    "Coding Assessment": 1.6,
    "Technical Interview": 1.8,
    "Faculty Verification": 1.8,
}

def compute_recency_multiplier(created_at: Optional[datetime]) -> Tuple[float, str]:
    """
    Computes time-decay multiplier and human-readable recency indicator.
    """
    if not created_at:
        return 0.8, "Assessed recently"

    days_old = (datetime.utcnow() - created_at).days
    if days_old <= 30:
        return 1.0, f"Verified {max(1, days_old)} days ago"
    elif days_old <= 90:
        return 0.85, f"Verified {days_old} days ago"
    elif days_old <= 180:
        return 0.65, f"Verified {days_old // 30} months ago (Moderate influence)"
    else:
        return 0.40, f"Stale ({days_old // 30} months ago) — Reassessment recommended"


def calculate_student_skill_detailed(
    db: Session,
    student_id: str,
    skill_id: str
) -> Dict[str, Any]:
    """
    Core Evidence Engine:
    Calculates skill mastery score, evidence confidence, recency, consistency warning, and mastery state.
    """
    evidences = db.query(SkillEvidence).filter(
        SkillEvidence.student_id == student_id,
        SkillEvidence.skill_id == skill_id
    ).order_by(SkillEvidence.created_at.desc()).all()

    student_skill = db.query(StudentSkill).filter(
        StudentSkill.student_id == student_id,
        StudentSkill.skill_id == skill_id
    ).first()

    if not evidences:
        base_score = student_skill.mastery_score if student_skill else 0.0
        return {
            "mastery_score": round(base_score, 1),
            "evidence_count": 0,
            "has_verified": False,
            "confidence": "LOW",
            "mastery_state": "CLAIMED" if base_score > 0 else "UNASSESSED",
            "recency_text": "No evidence records",
            "consistency_warning": None,
            "last_verified_at": None
        }

    total_weight = 0.0
    weighted_sum = 0.0
    verified_count = 0
    strong_sources_count = 0
    latest_verified_date = None
    
    self_reported_scores = []
    verified_scores = []

    for ev in evidences:
        type_weight = EVIDENCE_TYPE_WEIGHTS.get(ev.type, 1.0)
        is_ver = ev.verified or ev.source == "VERIFIED"
        ver_multiplier = 1.5 if is_ver else 0.7
        
        recency_mult, _ = compute_recency_multiplier(ev.created_at)
        
        item_effective_weight = type_weight * ver_multiplier * recency_mult
        weighted_sum += (ev.score or 0.0) * item_effective_weight
        total_weight += item_effective_weight

        if is_ver:
            verified_count += 1
            verified_scores.append(ev.score)
            if not latest_verified_date or (ev.created_at and ev.created_at > latest_verified_date):
                latest_verified_date = ev.created_at
            if type_weight >= 1.4:
                strong_sources_count += 1
        else:
            self_reported_scores.append(ev.score)

    computed_score = round(weighted_sum / total_weight, 1) if total_weight > 0 else 0.0
    
    # Consistency Check
    consistency_warning = None
    if self_reported_scores and verified_scores:
        avg_self = sum(self_reported_scores) / len(self_reported_scores)
        avg_ver = sum(verified_scores) / len(verified_scores)
        if avg_self - avg_ver >= 20.0:
            consistency_warning = f"Self-reported proficiency ({round(avg_self)}%) is significantly higher than verified assessment evidence ({round(avg_ver)}%)."

    # Derive Mastery State: CLAIMED -> SUPPORTED -> VERIFIED -> MASTERED
    if verified_count == 0:
        mastery_state = "CLAIMED"
    elif strong_sources_count >= 2 and computed_score >= 80.0:
        mastery_state = "MASTERED"
    elif verified_count >= 1 and computed_score >= 65.0:
        mastery_state = "VERIFIED"
    else:
        mastery_state = "SUPPORTED"

    # Derive Evidence Confidence: LOW, MEDIUM, HIGH, VERY_HIGH
    if verified_count == 0 or consistency_warning:
        confidence = "LOW"
    elif strong_sources_count >= 2 and len(evidences) >= 3:
        confidence = "VERY_HIGH"
    elif strong_sources_count >= 1 and verified_count >= 1:
        confidence = "HIGH"
    else:
        confidence = "MEDIUM"

    _, recency_text = compute_recency_multiplier(latest_verified_date or (evidences[0].created_at if evidences else None))

    return {
        "mastery_score": computed_score,
        "evidence_count": len(evidences),
        "has_verified": verified_count > 0,
        "confidence": confidence,
        "mastery_state": mastery_state,
        "recency_text": recency_text,
        "consistency_warning": consistency_warning,
        "last_verified_at": latest_verified_date
    }


def evaluate_job_eligibility(db: Session, student: Student, job: JobDescription) -> dict:
    """
    Deterministic Explainable Matching Engine:
    Separates Hard Eligibility (CGPA, Branch), Skill Thresholds, Evidence Confidence, and Role Readiness.
    """
    failed_skills = []
    passed_skills = []
    gap_details = []
    
    # 1. Hard Academic Eligibility
    allowed_branches = [b.strip().upper() for b in (job.allowed_branches or "").split(",") if b.strip()]
    student_branch = (student.branch or "").strip().upper()
    
    branch_pass = not allowed_branches or student_branch in allowed_branches or "ALL" in allowed_branches
    cgpa_pass = student.cgpa >= job.min_cgpa

    # 2. Skill Requirements Evaluation
    requirements = db.query(JobRequirement).filter(JobRequirement.job_id == job.id).all()
    
    total_importance_weight = 0.0
    weighted_achievement_sum = 0.0

    for req in requirements:
        skill = db.query(Skill).filter(Skill.id == req.skill_id).first()
        skill_name = skill.canonical_name if skill else "Unknown Skill"
        
        detail = calculate_student_skill_detailed(db, student.id, req.skill_id)
        score = detail["mastery_score"]
        
        importance = (req.importance or "HIGH").upper()
        weight = IMPORTANCE_WEIGHTS.get(importance, 2.0)
        
        total_importance_weight += weight
        # Normalized achievement capped at 100%
        achievement = min((score / req.min_score * 100) if req.min_score > 0 else 100.0, 100.0)
        weighted_achievement_sum += achievement * weight

        # Hidden prerequisite analysis for failed skills
        prereqs_met, blockers = check_student_prerequisites_met(db, student.id, skill_name)

        if score >= req.min_score:
            passed_skills.append({
                "skill": skill_name,
                "student_score": score,
                "required_score": req.min_score,
                "importance": importance,
                "mastery_state": detail["mastery_state"],
                "confidence": detail["confidence"],
                "evidence_count": detail["evidence_count"]
            })
        else:
            gap_points = round(req.min_score - score, 1)
            failed_skills.append({
                "skill": skill_name,
                "student_score": score,
                "required_score": req.min_score,
                "importance": importance,
                "gap_points": gap_points,
                "mastery_state": detail["mastery_state"],
                "confidence": detail["confidence"],
                "prerequisites_met": prereqs_met,
                "prerequisite_blockers": blockers,
                "evidence_count": detail["evidence_count"]
            })
            gap_details.append({
                "skill_id": req.skill_id,
                "skill_name": skill_name,
                "current_score": score,
                "required_score": req.min_score,
                "gap_points": gap_points,
                "priority": "HIGH" if importance == "HIGH" else "MEDIUM"
            })

    readiness_percentage = round(weighted_achievement_sum / total_importance_weight, 1) if total_importance_weight > 0 else 0.0

    # Categorization Logic:
    # ELIGIBLE: CGPA pass AND Branch pass AND 0 failed high-importance skills AND readiness >= 70%
    # NEAR_READY: CGPA pass AND Branch pass AND <= 2 skill gaps AND readiness >= 50%
    # NOT_ELIGIBLE: CGPA fail OR Branch fail OR major skill gaps
    if not branch_pass or not cgpa_pass:
        status = "NOT_ELIGIBLE"
        reason = f"Academic requirement not met (Min CGPA: {job.min_cgpa}, Allowed Branches: {job.allowed_branches})"
    elif len(failed_skills) == 0 and readiness_percentage >= 70.0:
        status = "ELIGIBLE"
        reason = "All academic criteria and verified skill requirements satisfied."
    elif len(failed_skills) <= 2 and readiness_percentage >= 50.0:
        status = "NEAR_READY"
        reason = f"Near ready with minor gaps in: {', '.join([s['skill'] for s in failed_skills])}"
    else:
        status = "NOT_ELIGIBLE"
        reason = f"Skill deficit in core requirements: {', '.join([s['skill'] for s in failed_skills])}"

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
    Updates student.overall_readiness and records ReadinessScore in DB.
    """
    jobs = db.query(JobDescription).filter(JobDescription.role_title.ilike(f"%{role_title}%")).all()
    
    if not jobs:
        # Calculate from student's skills
        student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student.id).all()
        if student_skills:
            avg_score = sum(s.mastery_score for s in student_skills) / len(student_skills)
        else:
            avg_score = 0.0
            
        readiness = round(avg_score, 1)
        status = "Ready" if readiness >= 75.0 else ("Near Ready" if readiness >= 60.0 else "Needs Improvement")
        
        student.overall_readiness = readiness
        student.readiness_status = status
        db.commit()
        
        return {
            "role": role_title,
            "score": readiness,
            "status": status,
            "passed_skills": [],
            "failed_skills": []
        }

    job = jobs[0]
    result = evaluate_job_eligibility(db, student, job)
    
    r_score = db.query(ReadinessScore).filter(
        ReadinessScore.student_id == student.id,
        ReadinessScore.job_role == role_title
    ).first()
    
    status = "Ready" if result["eligibility_score"] >= 75.0 else ("Near Ready" if result["eligibility_score"] >= 55.0 else "Needs Improvement")

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


def get_student_role_blockers(db: Session, student: Student, role_title: str) -> dict:
    """
    "Why Am I Not Ready?" Engine:
    Exposes concrete blockers, missing thresholds, hidden prerequisites, and actionable next steps.
    """
    jobs = db.query(JobDescription).filter(JobDescription.role_title.ilike(f"%{role_title}%")).all()
    job = jobs[0] if jobs else None

    if not job:
        return {
            "target_role": role_title,
            "overall_readiness": student.overall_readiness or 0.0,
            "passing_threshold": 70.0,
            "status": student.readiness_status or "Needs Improvement",
            "hard_eligibility_passed": True,
            "hard_eligibility_reason": "Academic eligibility confirmed.",
            "total_blockers_count": 0,
            "blockers": [],
            "hidden_prerequisite_gaps": []
        }

    eval_result = evaluate_job_eligibility(db, student, job)
    
    cgpa_pass = student.cgpa >= job.min_cgpa
    allowed_branches = [b.strip().upper() for b in (job.allowed_branches or "").split(",") if b.strip()]
    branch_pass = not allowed_branches or student.branch.strip().upper() in allowed_branches

    hard_pass = cgpa_pass and branch_pass
    hard_reason = "Academic eligibility satisfied." if hard_pass else f"Academic failure: CGPA requires {job.min_cgpa}, student has {student.cgpa}."

    blocker_items = []
    all_hidden_gaps = []

    for f in eval_result["failed_skills"]:
        s_name = f["skill"]
        hidden = detect_hidden_prerequisite_gaps(db, student.id, s_name)
        
        prereq_blocker_text = None
        if hidden:
            prereq_blocker_text = f"Hidden gap: Lacks prerequisite {hidden[0]['prerequisite_skill']} ({hidden[0]['current_score']}%)"
            all_hidden_gaps.append(hidden[0]["alert"])

        rec_action = f"Complete AI practice module for {s_name} and take practical reassessment."
        if hidden:
            rec_action = f"First strengthen prerequisite '{hidden[0]['prerequisite_skill']}', then attempt {s_name} reassessment."

        blocker_items.append({
            "skill_name": s_name,
            "current_score": f["student_score"],
            "required_score": f["required_score"],
            "deficit": f["gap_points"],
            "importance": f["importance"],
            "mastery_state": f.get("mastery_state", "CLAIMED"),
            "evidence_summary": f"{f.get('evidence_count', 0)} verified evidence records",
            "prerequisite_blocker": prereq_blocker_text,
            "prerequisites_met": len(hidden) == 0,
            "recommended_action": rec_action
        })

    return {
        "target_role": role_title,
        "overall_readiness": eval_result["eligibility_score"],
        "passing_threshold": 70.0,
        "status": eval_result["status"],
        "hard_eligibility_passed": hard_pass,
        "hard_eligibility_reason": hard_reason,
        "total_blockers_count": len(blocker_items),
        "blockers": sorted(blocker_items, key=lambda x: x["deficit"], reverse=True),
        "hidden_prerequisite_gaps": all_hidden_gaps
    }


def simulate_career_readiness(
    db: Session,
    student: Student,
    skill_improvements: Dict[str, float]
) -> dict:
    """
    "What If I Learn This?" Career Simulation:
    Recalculates projected readiness across roles without mutating persisted database state.
    """
    all_jobs = db.query(JobDescription).all()
    current_readiness = student.overall_readiness or 0.0

    # Build simulated skill lookup
    student_skills = db.query(StudentSkill, Skill).join(Skill, StudentSkill.skill_id == Skill.id).filter(
        StudentSkill.student_id == student.id
    ).all()
    
    current_skills_map = {sk.canonical_name: st_sk.mastery_score for st_sk, sk in student_skills}
    simulated_map = dict(current_skills_map)
    
    for sk_name, boosted_score in skill_improvements.items():
        simulated_map[sk_name] = max(simulated_map.get(sk_name, 0.0), float(boosted_score))

    role_impacts = []
    
    for job in all_jobs:
        reqs = db.query(JobRequirement).filter(JobRequirement.job_id == job.id).all()
        
        # Calculate current vs projected for this job
        total_w = 0.0
        cur_sum = 0.0
        proj_sum = 0.0
        
        for req in reqs:
            sk = db.query(Skill).filter(Skill.id == req.skill_id).first()
            sk_name = sk.canonical_name if sk else "Unknown"
            w = IMPORTANCE_WEIGHTS.get(req.importance, 2.0)
            total_w += w
            
            c_score = current_skills_map.get(sk_name, 0.0)
            p_score = simulated_map.get(sk_name, c_score)
            
            c_ach = min((c_score / req.min_score * 100) if req.min_score > 0 else 100.0, 100.0)
            p_ach = min((p_score / req.min_score * 100) if req.min_score > 0 else 100.0, 100.0)
            
            cur_sum += c_ach * w
            proj_sum += p_ach * w

        cur_pct = round(cur_sum / total_w, 1) if total_w > 0 else 0.0
        proj_pct = round(proj_sum / total_w, 1) if total_w > 0 else 0.0
        
        status_before = "Ready" if cur_pct >= 70.0 else ("Near Ready" if cur_pct >= 50.0 else "Needs Improvement")
        status_after = "Ready" if proj_pct >= 70.0 else ("Near Ready" if proj_pct >= 50.0 else "Needs Improvement")
        
        role_impacts.append({
            "role_title": f"{job.company_name} - {job.role_title}",
            "current_readiness": cur_pct,
            "projected_readiness": proj_pct,
            "improvement_delta": round(proj_pct - cur_pct, 1),
            "status_before": status_before,
            "status_after": status_after,
            "unlocked": status_before != "Ready" and status_after == "Ready"
        })

    target_impact = next((r for r in role_impacts if student.target_role in r["role_title"]), None)
    projected_overall = target_impact["projected_readiness"] if target_impact else round(current_readiness + 15.0, 1)
    delta = round(projected_overall - current_readiness, 1)
    proj_status = "Ready" if projected_overall >= 75.0 else ("Near Ready" if projected_overall >= 60.0 else "Needs Improvement")

    return {
        "disclaimer": "PROJECTED / ESTIMATED — Projections simulate score improvement and do not guarantee placement outcomes.",
        "simulated_skills": skill_improvements,
        "target_role": student.target_role,
        "current_overall_readiness": current_readiness,
        "projected_overall_readiness": projected_overall,
        "overall_delta": delta,
        "projected_status": proj_status,
        "role_impacts": sorted(role_impacts, key=lambda x: x["improvement_delta"], reverse=True)
    }


def sync_student_readiness_and_eligibility(db: Session, student: Student, reason: str = "Faculty Verification Endorsement") -> dict:
    """
    Comprehensive State Synchronization Engine:
    Whenever a student is evaluated/graded by a trainer or completes a reassessment:
    1. Recalculates all student skill scores and updates StudentSkill mastery states.
    2. Recalculates student overall_readiness and readiness_status ('Ready', 'Near Ready', 'Needs Improvement').
    3. Updates or creates ReadinessScore and ReadinessHistory records for student target_role.
    4. Cleans up or updates SkillGap records for all skills where student now meets required thresholds.
    5. Re-evaluates EligibilityResult against all active JobDescription records (updating NOT_ELIGIBLE -> ELIGIBLE).
    6. Commits changes to the database.
    """
    # 1. Recalculate all student skills
    student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == student.id).all()
    all_scores = []
    
    for st_sk in student_skills:
        detailed = calculate_student_skill_detailed(db, student.id, st_sk.skill_id)
        st_sk.mastery_score = detailed["mastery_score"]
        st_sk.mastery_state = detailed["mastery_state"]
        st_sk.confidence = detailed["confidence"]
        st_sk.last_assessed_at = datetime.utcnow()
        all_scores.append(st_sk.mastery_score)

    # 2. Recalculate overall readiness
    new_overall = round(sum(all_scores) / len(all_scores), 1) if all_scores else student.overall_readiness
    old_readiness = student.overall_readiness
    delta = round(new_overall - old_readiness, 1)

    student.overall_readiness = new_overall
    if new_overall >= 75.0:
        student.readiness_status = "Ready"
    elif new_overall >= 60.0:
        student.readiness_status = "Near Ready"
    else:
        student.readiness_status = "Needs Improvement"

    # 3. Update ReadinessScore for target role
    target_role = student.target_role or "Java Backend Developer"
    rs = db.query(ReadinessScore).filter(
        ReadinessScore.student_id == student.id,
        ReadinessScore.job_role == target_role
    ).first()
    if rs:
        rs.score = new_overall
        rs.status = student.readiness_status
        rs.calculated_at = datetime.utcnow()
    else:
        rs = ReadinessScore(
            student_id=student.id,
            job_role=target_role,
            score=new_overall,
            status=student.readiness_status,
            calculated_at=datetime.utcnow()
        )
        db.add(rs)

    # 4. Log Readiness History
    history_entry = ReadinessHistory(
        student_id=student.id,
        job_role=target_role,
        score=new_overall,
        change_delta=delta,
        source=reason,
        recorded_at=datetime.utcnow()
    )
    db.add(history_entry)

    # 5. Re-evaluate and persist EligibilityResult for ALL active Jobs
    jobs = db.query(JobDescription).all()
    unlocked_jobs = []

    for job in jobs:
        eval_res = evaluate_job_eligibility(db, student, job)
        elig_status = eval_res.get("eligibility_status", "NOT_ELIGIBLE")
        elig_score = eval_res.get("role_readiness_score", 0.0)

        # Update or insert into eligibility_results table
        el_record = db.query(EligibilityResult).filter(
            EligibilityResult.job_id == job.id,
            EligibilityResult.student_id == student.id
        ).first()

        old_status = el_record.status if el_record else "NOT_ELIGIBLE"

        if el_record:
            el_record.status = elig_status
            el_record.eligibility_score = elig_score
            el_record.calculated_at = datetime.utcnow()
        else:
            el_record = EligibilityResult(
                job_id=job.id,
                student_id=student.id,
                status=elig_status,
                eligibility_score=elig_score,
                calculated_at=datetime.utcnow()
            )
            db.add(el_record)

        if old_status != "ELIGIBLE" and elig_status == "ELIGIBLE":
            unlocked_jobs.append(f"{job.company_name} - {job.role_title}")

    # 6. Re-evaluate SkillGap table
    # For target role job requirements, update or delete gaps
    target_job = db.query(JobDescription).filter(JobDescription.role_title == target_role).first()
    if target_job:
        requirements = db.query(JobRequirement).filter(JobRequirement.job_id == target_job.id).all()
        for req in requirements:
            sk_detail = calculate_student_skill_detailed(db, student.id, req.skill_id)
            current_sc = sk_detail["mastery_score"]
            gap_item = db.query(SkillGap).filter(
                SkillGap.student_id == student.id,
                SkillGap.skill_id == req.skill_id
            ).first()

            if current_sc >= req.min_score:
                if gap_item:
                    db.delete(gap_item)
            else:
                gap_pts = round(req.min_score - current_sc, 1)
                if gap_item:
                    gap_item.current_score = current_sc
                    gap_item.gap_points = gap_pts
                    gap_item.priority = "HIGH" if gap_pts > 20 else "MEDIUM"
                else:
                    gap_item = SkillGap(
                        student_id=student.id,
                        job_id=target_job.id,
                        skill_id=req.skill_id,
                        current_score=current_sc,
                        required_score=req.min_score,
                        gap_points=gap_pts,
                        priority="HIGH" if gap_pts > 20 else "MEDIUM"
                    )
                    db.add(gap_item)

    db.commit()

    return {
        "student_id": student.student_id,
        "name": student.name,
        "old_readiness": old_readiness,
        "new_readiness": new_overall,
        "readiness_delta": delta,
        "readiness_status": student.readiness_status,
        "unlocked_jobs": unlocked_jobs
    }


