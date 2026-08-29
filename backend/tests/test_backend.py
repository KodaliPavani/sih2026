import pytest
from datetime import datetime, timedelta
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.services.normalization_service import normalize_skill_name
from app.services.prerequisite_engine import (
    PREREQUISITE_GRAPH,
    detect_hidden_prerequisite_gaps,
    check_student_prerequisites_met,
    order_learning_path_by_prerequisites
)
from app.services.eligibility_engine import (
    compute_recency_multiplier,
    calculate_student_skill_detailed,
    evaluate_job_eligibility,
    get_student_role_blockers,
    simulate_career_readiness,
    calculate_role_readiness_score
)
from app.services.assessment_engine import get_assessment_questions_for_skill, grade_reassessment
from app.services.ml_readiness_predictor import ml_engine
from app.db.session import SessionLocal
from app.models.models import Student, User, Skill, StudentSkill, SkillEvidence, PlacementDrive, TrainingCohort

def test_password_hashing():
    raw_pass = "2300030042"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password("2300030042", hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_tokens():
    payload = {"sub": "2300030042", "role": "STUDENT"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "2300030042"
    assert decoded["role"] == "STUDENT"

def test_skill_normalization_aliases():
    assert normalize_skill_name("JS") == "JavaScript"
    assert normalize_skill_name("SPRING BOOT") == "Spring Boot"
    assert normalize_skill_name("RESTful API") == "REST API"
    assert normalize_skill_name("Core Java") == "Java"
    assert normalize_skill_name("Data Structures & Algorithms") == "DSA"
    assert normalize_skill_name("OOP") == "OOP"
    assert normalize_skill_name("Git") == "Git"
    assert normalize_skill_name("PostgreSQL") == "SQL"
    assert normalize_skill_name("Database Management") == "DBMS"

def test_prerequisite_dag_hidden_gaps():
    db = SessionLocal()
    try:
        student = db.query(Student).filter(Student.student_id == "2300030042").first()
        assert student is not None
        # Student 2300030042 has Spring Boot 32% (req Java 60%, and student has Java 86%)
        gaps = detect_hidden_prerequisite_gaps(db, student.id, "Spring Boot")
        # Since student has Java 86% (>60%), Java is not an unmet prerequisite gap
        assert isinstance(gaps, list)
    finally:
        db.close()

def test_prerequisite_learning_order():
    db = SessionLocal()
    try:
        # Find or create a student with low Java score (<60)
        low_student = db.query(Student).first()
        java_sk = db.query(Skill).filter(Skill.canonical_name == "Java").first()
        if low_student and java_sk:
            st_sk = db.query(StudentSkill).filter(
                StudentSkill.student_id == low_student.id,
                StudentSkill.skill_id == java_sk.id
            ).first()
            if st_sk:
                st_sk.mastery_score = 40.0
                db.commit()
        
        gaps = [
            {"skill_name": "Spring Boot", "gap_points": 30.0},
            {"skill_name": "DSA", "gap_points": 15.0}
        ]
        ordered = order_learning_path_by_prerequisites(db, low_student.id, gaps)
        skill_names = [g["skill_name"] for g in ordered]
        # Java was prepended as a primary prerequisite before Spring Boot
        assert "Java" in skill_names
        assert skill_names.index("Java") < skill_names.index("Spring Boot")
    finally:
        db.close()

def test_recency_decay_calculation():
    now = datetime.utcnow()
    mul, text = compute_recency_multiplier(now - timedelta(days=10))
    assert mul == 1.0
    mul, text = compute_recency_multiplier(now - timedelta(days=60))
    assert mul == 0.85
    mul, text = compute_recency_multiplier(now - timedelta(days=120))
    assert mul == 0.65
    mul, text = compute_recency_multiplier(now - timedelta(days=300))
    assert mul == 0.40

def test_evidence_engine_weighting():
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        skill = db.query(Skill).first()
        res = calculate_student_skill_detailed(db, student.id, skill.id)
        assert "mastery_score" in res
        assert "mastery_state" in res
        assert "confidence" in res
        assert res["mastery_state"] in ["CLAIMED", "SUPPORTED", "VERIFIED", "MASTERED"]
    finally:
        db.close()


def test_question_bank_and_evaluation():
    db = SessionLocal()
    try:
        skill, questions = get_assessment_questions_for_skill(db, "Spring Boot")
        assert len(questions) >= 5
        first_q = questions[0]
        
        # Correct answer submission
        answers = [{"question_id": first_q.id, "selected_option": first_q.correct_option}]
        final_score, total_mcqs, correct_count, breakdown = grade_reassessment(
            db=db,
            skill=skill,
            submitted_answers=answers,
            practical_code="@RestController\npublic class Controller { public String run() { return \"OK\"; } }"
        )
        assert correct_count == 1
        assert final_score >= 80.0
        assert "MCQ Score" in breakdown
    finally:
        db.close()


def test_career_simulation():
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None
        
        sim_result = simulate_career_readiness(
            db=db,
            student=student,
            skill_improvements={"Spring Boot": 90.0, "DSA": 85.0, "Java": 90.0}
        )
        assert sim_result["projected_overall_readiness"] >= sim_result["current_overall_readiness"]
        assert "disclaimer" in sim_result
        assert len(sim_result["role_impacts"]) > 0
    finally:
        db.close()

def test_blocker_diagnostics():
    db = SessionLocal()
    try:
        student = db.query(Student).first()
        assert student is not None
        
        blockers_result = get_student_role_blockers(
            db=db,
            student=student,
            role_title=student.target_role or "Java Backend Developer"
        )
        assert "hard_eligibility_passed" in blockers_result
        assert "blockers" in blockers_result
        assert "total_blockers_count" in blockers_result
    finally:
        db.close()

def test_auxiliary_ml_readiness_classifier():
    db = SessionLocal()
    try:
        metrics = ml_engine.train_on_cohort(db)
        assert "validation_metrics" in metrics
        assert "accuracy" in metrics["validation_metrics"]
        assert metrics["validation_metrics"]["accuracy"] > 0.60
        assert len(metrics["feature_importance_ranking"]) == 7
    finally:
        db.close()


def test_database_seed_integrity():
    db = SessionLocal()
    try:
        total_students = db.query(Student).count()
        assert total_students == 500
        
        total_drives = db.query(PlacementDrive).count()
        assert total_drives >= 1
        
        total_cohorts = db.query(TrainingCohort).count()
        assert total_cohorts >= 1
        
        # Verify student 2300030042 exists
        student_user = db.query(User).filter(User.username == "2300030042").first()
        assert student_user is not None
        assert student_user.role == "STUDENT"
        
        # Verify placement cell admin exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        assert admin_user is not None
        assert admin_user.role == "PLACEMENT_CELL"
    finally:
        db.close()

