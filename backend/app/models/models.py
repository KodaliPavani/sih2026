import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Float, Integer, Text, Date, DateTime, ForeignKey, Table, Numeric, Enum
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False) # STUDENT, PLACEMENT_CELL
    password_hash = Column(String(255), nullable=False)
    first_login = Column(Boolean, default=True)
    password_changed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student_profile = relationship("Student", back_populates="user", uselist=False)
    placement_profile = relationship("PlacementCellUser", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    branch = Column(String(50), nullable=False, index=True) # CSE, ECE, AI&DS, CSIT, Lateral and CSE
    cgpa = Column(Float, nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    target_role = Column(String(100), default="Java Backend Developer", index=True)
    resume_url = Column(Text, nullable=True)
    overall_readiness = Column(Float, default=0.0)
    readiness_status = Column(String(50), default="Needs Improvement") # Ready, Near Ready, Needs Improvement, At Risk
    attendance_percent = Column(Float, default=80.0)
    certifications_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    skills = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    evidence = relationship("SkillEvidence", back_populates="student", cascade="all, delete-orphan")
    readiness_scores = relationship("ReadinessScore", back_populates="student", cascade="all, delete-orphan")
    readiness_history = relationship("ReadinessHistory", back_populates="student", cascade="all, delete-orphan")
    mastery_history = relationship("SkillMasteryHistory", back_populates="student", cascade="all, delete-orphan")
    reassessments = relationship("Reassessment", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("PlacementApplication", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("TrainingEnrollment", back_populates="student", cascade="all, delete-orphan")


class PlacementCellUser(Base):
    __tablename__ = "placement_cell_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    department = Column(String(100), default="Placement & Training Cell")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="placement_profile")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    canonical_name = Column(String(100), nullable=False)
    category = Column(String(50), default="Technical") # Technical, Domain, Soft Skill, Core CS
    parent_category = Column(String(100), nullable=True) # e.g., Backend Development, Programming Languages, CS Fundamentals
    description = Column(Text, nullable=True)

    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")
    questions = relationship("AssessmentQuestion", back_populates="skill", cascade="all, delete-orphan")


class SkillHierarchy(Base):
    __tablename__ = "skill_hierarchies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    parent_skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    child_skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), default="SUBCATEGORY") # SUBCATEGORY, COMPONENT, SPECIALIZATION

    parent_skill = relationship("Skill", foreign_keys=[parent_skill_id])
    child_skill = relationship("Skill", foreign_keys=[child_skill_id])


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    strictness = Column(String(20), default="MANDATORY") # MANDATORY, RECOMMENDED
    min_required_score = Column(Float, default=60.0)

    skill = relationship("Skill", foreign_keys=[skill_id])
    prerequisite = relationship("Skill", foreign_keys=[prerequisite_skill_id])


class SkillAlias(Base):
    __tablename__ = "skill_aliases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    alias = Column(String(100), unique=True, nullable=False, index=True)

    skill = relationship("Skill", back_populates="aliases")


class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0) # 0-100
    mastery_state = Column(String(30), default="CLAIMED") # CLAIMED, SUPPORTED, VERIFIED, MASTERED
    confidence = Column(String(20), default="Medium") # LOW, MEDIUM, HIGH, VERY_HIGH
    evidence_count = Column(Integer, default=0)
    last_assessed_at = Column(DateTime, default=datetime.utcnow)
    last_verified_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="skills")
    skill = relationship("Skill")


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False) # Resume Claim, Certificate, Self-reported Project, Coding Assessment, Practical Task, Technical Interview, Faculty Verification, Verified GitHub Project
    source = Column(String(100), nullable=False, default="VERIFIED") # VERIFIED, SELF_REPORTED
    score = Column(Float, default=0.0)
    verified = Column(Boolean, default=True)
    weight = Column(Float, default=1.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="evidence")
    skill = relationship("Skill")


class SkillMasteryHistory(Base):
    __tablename__ = "skill_mastery_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    old_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)
    change_delta = Column(Float, default=0.0)
    evidence_source = Column(String(100), default="Assessment")
    assessment_id = Column(String(36), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="mastery_history")
    skill = relationship("Skill")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_option = Column(String(5), nullable=False) # 'a', 'b', 'c', 'd'
    difficulty = Column(String(20), default="Intermediate") # Beginner, Intermediate, Advanced
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill", back_populates="questions")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_name = Column(String(150), nullable=False)
    role_title = Column(String(150), nullable=False)
    location = Column(String(100), default="Pan India")
    package_lpa = Column(Float, default=6.0)
    min_cgpa = Column(Float, default=6.0)
    allowed_branches = Column(Text, default="CSE,ECE,AI&DS,CSIT,Lateral and CSE")
    raw_text = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    requirements = relationship("JobRequirement", back_populates="job", cascade="all, delete-orphan")
    drives = relationship("PlacementDrive", back_populates="job", cascade="all, delete-orphan")


class JobRequirement(Base):
    __tablename__ = "job_requirements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    importance = Column(String(20), default="HIGH") # HIGH, MEDIUM, LOW
    min_score = Column(Float, default=60.0)

    job = relationship("JobDescription", back_populates="requirements")
    skill = relationship("Skill")


class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False) # ELIGIBLE, NEAR_READY, NOT_ELIGIBLE
    eligibility_score = Column(Float, default=0.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobDescription")
    student = relationship("Student")


class ReadinessScore(Base):
    __tablename__ = "readiness_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_role = Column(String(100), nullable=False)
    score = Column(Float, default=0.0)
    status = Column(String(50), default="Needs Improvement")
    calculated_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="readiness_scores")


class ReadinessHistory(Base):
    __tablename__ = "readiness_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_role = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    change_delta = Column(Float, default=0.0)
    source = Column(String(100), default="Reassessment Boost")
    recorded_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="readiness_history")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    current_score = Column(Float, default=0.0)
    required_score = Column(Float, default=60.0)
    gap_points = Column(Float, default=0.0)
    priority = Column(String(20), default="HIGH")

    skill = relationship("Skill")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    topic = Column(String(150), nullable=False)
    difficulty = Column(String(20), default="Intermediate")
    estimated_effort = Column(String(50), default="2 Hours")
    resource_type = Column(String(50), default="Practice Task")
    url = Column(Text, nullable=True)
    outcome = Column(String(255), nullable=True)

    skill = relationship("Skill")


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(String(36), ForeignKey("learning_resources.id", ondelete="CASCADE"), nullable=True)
    status = Column(String(50), default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)


class Reassessment(Base):
    __tablename__ = "reassessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    old_score = Column(Float, nullable=False)
    new_score = Column(Float, nullable=False)
    improvement = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="reassessments")
    skill = relationship("Skill")


class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=True)
    drive_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=False)
    status = Column(String(50), default="Active") # Upcoming, Active, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobDescription", back_populates="drives")
    applications = relationship("PlacementApplication", back_populates="drive", cascade="all, delete-orphan")


class PlacementApplication(Base):
    __tablename__ = "placement_applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    drive_id = Column(String(36), ForeignKey("placement_drives.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    current_stage = Column(String(100), default="Registration")
    status = Column(String(50), default="Applied") # Applied, Shortlisted, Technical Assessment, Interview, Selected, Rejected
    stage_history_json = Column(Text, nullable=True)
    interview_feedback = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    drive = relationship("PlacementDrive", back_populates="applications")
    student = relationship("Student", back_populates="applications")


class TrainingCohort(Base):
    __tablename__ = "training_cohorts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=True)
    instructor = Column(String(100), default="Placement Training Faculty")
    student_count = Column(Integer, default=0)
    status = Column(String(50), default="Active") # Scheduled, Active, Completed
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    skill = relationship("Skill")
    enrollments = relationship("TrainingEnrollment", back_populates="cohort", cascade="all, delete-orphan")


class TrainingEnrollment(Base):
    __tablename__ = "training_enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cohort_id = Column(String(36), ForeignKey("training_cohorts.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="Enrolled") # Enrolled, In Progress, Completed, Dropped
    attendance_pct = Column(Float, default=100.0)
    completion_pct = Column(Float, default=0.0)
    pre_training_score = Column(Float, nullable=True)
    post_training_score = Column(Float, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    cohort = relationship("TrainingCohort", back_populates="enrollments")
    student = relationship("Student", back_populates="enrollments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    target_resource = Column(String(100), nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

