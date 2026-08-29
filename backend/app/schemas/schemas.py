from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# AUTH SCHEMAS
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    first_login: bool
    user_id: str
    student_id: Optional[str] = None
    name: str

class ResetPasswordRequest(BaseModel):
    new_password: str
    confirm_password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    first_login: bool
    password_changed_at: Optional[datetime] = None

# SKILL & EVIDENCE SCHEMAS
class SkillSchema(BaseModel):
    id: str
    name: str
    canonical_name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class StudentSkillResponse(BaseModel):
    id: str
    skill_name: str
    category: str
    mastery_score: float
    mastery_state: str # CLAIMED, SUPPORTED, VERIFIED, MASTERED
    confidence: str # LOW, MEDIUM, HIGH, VERY_HIGH
    last_assessed_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None
    evidence_count: int = 0
    status: str # Strong, Medium Gap, Major Gap, etc.
    recency_text: Optional[str] = "Recently assessed"
    consistency_warning: Optional[str] = None

class EvidenceResponse(BaseModel):
    id: str
    skill_name: str
    type: str # Coding Assessment, Practical Task, etc.
    source: str # VERIFIED, SELF_REPORTED
    score: float
    verified: bool
    weight: float
    description: Optional[str] = None
    created_at: datetime

class EvidenceUploadRequest(BaseModel):
    skill_name: str
    evidence_type: str = "Self-reported Project" # Resume Claim, Certificate, Self-reported Project, Verified GitHub Project, Coding Assessment
    score: float = Field(..., ge=0.0, le=100.0)
    description: str

class SkillMasteryHistoryItem(BaseModel):
    skill_name: str
    old_score: float
    new_score: float
    change_delta: float
    evidence_source: str
    recorded_at: datetime

# STUDENT PROFILE SCHEMAS
class StudentProfileResponse(BaseModel):
    id: str
    student_id: str
    name: str
    branch: str
    cgpa: float
    email: Optional[str] = None
    phone: Optional[str] = None
    target_role: str
    resume_url: Optional[str] = None
    overall_readiness: float
    readiness_status: str
    attendance_percent: float
    certifications_count: int
    evidence_records_count: int = 0

class StudentProfileUpdate(BaseModel):
    target_role: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None

# JOB DESCRIPTION & ELIGIBILITY SCHEMAS
class JobRequirementItem(BaseModel):
    name: str
    importance: str = "HIGH" # HIGH, MEDIUM, LOW
    minimum_score: float = 60.0

class GeminiJDParseResult(BaseModel):
    company: Optional[str] = None
    role: str
    location: Optional[str] = "Pan India"
    package_lpa: Optional[float] = 6.5
    skills: List[JobRequirementItem]
    preferred_skills: Optional[List[str]] = []
    soft_skills: Optional[List[str]] = []
    education: List[str] = ["B.Tech", "B.E."]
    minimum_cgpa: float = 6.0
    allowed_branches: Optional[str] = "CSE,ECE,AI&DS,CSIT,Lateral and CSE"
    experience: Optional[str] = "0-2 years"

class JobCreateRequest(BaseModel):
    company_name: str
    role_title: str
    location: str = "Pan India"
    package_lpa: float = 6.0
    min_cgpa: float = 6.0
    allowed_branches: str = "CSE,ECE,AI&DS,CSIT,Lateral and CSE"
    raw_text: str
    skills: List[JobRequirementItem]

class JobResponse(BaseModel):
    id: str
    company_name: str
    role_title: str
    location: str
    package_lpa: float
    min_cgpa: float
    allowed_branches: str
    skills_count: int
    created_at: datetime

class CandidateEligibilityItem(BaseModel):
    student_id: str
    name: str
    branch: str
    cgpa: float
    overall_readiness: float
    eligibility_status: str # ELIGIBLE, NEAR_READY, NOT_ELIGIBLE
    eligibility_score: float
    failed_skills: List[str] = []
    passed_skills: List[str] = []

# "WHY AM I NOT READY?" BLOCKER SCHEMAS
class BlockerItem(BaseModel):
    skill_name: str
    current_score: float
    required_score: float
    deficit: float
    importance: str
    mastery_state: str
    evidence_summary: str
    prerequisite_blocker: Optional[str] = None
    prerequisites_met: bool = True
    recommended_action: str

class ReadinessBlockersResponse(BaseModel):
    target_role: str
    overall_readiness: float
    passing_threshold: float = 70.0
    status: str
    hard_eligibility_passed: bool
    hard_eligibility_reason: str
    total_blockers_count: int
    blockers: List[BlockerItem]
    hidden_prerequisite_gaps: List[str] = []

# "WHAT IF I LEARN THIS?" CAREER SIMULATION
class CareerSimulationRequest(BaseModel):
    skill_improvements: Dict[str, float] # e.g. {"Spring Boot": 75.0, "DSA": 80.0}

class SimulatedRoleImpact(BaseModel):
    role_title: str
    current_readiness: float
    projected_readiness: float
    improvement_delta: float
    status_before: str
    status_after: str
    unlocked: bool

class CareerSimulationResponse(BaseModel):
    disclaimer: str = "PROJECTED / ESTIMATED — Projections simulate score improvement and do not guarantee placement outcomes."
    simulated_skills: Dict[str, float]
    target_role: str
    current_overall_readiness: float
    projected_overall_readiness: float
    overall_delta: float
    projected_status: str
    role_impacts: List[SimulatedRoleImpact]

# ASSESSMENT & REASSESSMENT SCHEMAS
class QuestionItem(BaseModel):
    id: str
    skill_name: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str

class QuestionSubmitAnswer(BaseModel):
    question_id: str
    selected_option: str # 'a', 'b', 'c', 'd'

class DynamicReassessmentSubmitRequest(BaseModel):
    skill_name: str
    answers: Optional[List[QuestionSubmitAnswer]] = []
    practical_code: Optional[str] = None
    assessment_score: Optional[float] = None # Direct verified score if submitted via proctored assessment tool

class ReassessmentResultResponse(BaseModel):
    skill_name: str
    old_skill_score: float
    new_skill_score: float
    old_readiness: float
    new_readiness: float
    improvement_delta: float
    evaluated_mcqs: int = 0
    correct_mcqs: int = 0
    mastery_state: str
    confidence: str
    message: str

# LEARNING RECOMMENDATION SCHEMAS
class LearningRecommendationResponse(BaseModel):
    id: Optional[str] = None
    skill_name: str
    current_score: float
    target_score: float
    prerequisite_alert: Optional[str] = None
    modules: List[Dict[str, Any]]

# PLACEMENT DRIVE & APPLICATION SCHEMAS
class PlacementDriveCreateRequest(BaseModel):
    job_id: str
    title: Optional[str] = None
    drive_date: date
    deadline: date
    status: str = "Active"

class PlacementDriveResponse(BaseModel):
    id: str
    job_id: str
    company_name: str
    role_title: str
    package_lpa: float
    title: Optional[str] = None
    drive_date: date
    deadline: date
    status: str
    applications_count: int = 0
    created_at: datetime

class ApplicationSubmitRequest(BaseModel):
    drive_id: str

class ApplicationStatusUpdateRequest(BaseModel):
    status: str # Applied, Shortlisted, Technical Assessment, Interview, Selected, Rejected
    current_stage: Optional[str] = None
    interview_feedback: Optional[str] = None

# TRAINING COHORT SCHEMAS
class TrainingCohortCreateRequest(BaseModel):
    skill_name: str
    title: str
    description: Optional[str] = None
    target_role: Optional[str] = None
    instructor: Optional[str] = "Placement Training Faculty"
    student_ids: Optional[List[str]] = [] # Auto-enroll student IDs

class TrainingCohortResponse(BaseModel):
    id: str
    skill_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    instructor: str
    student_count: int
    status: str
    created_at: datetime

