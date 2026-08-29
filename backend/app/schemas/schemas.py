from datetime import datetime, date
from typing import Optional, List
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
    confidence: str
    last_assessed_at: Optional[datetime] = None
    evidence_count: int = 0
    status: str # Strong, Medium Gap, Major Gap, etc.

class EvidenceResponse(BaseModel):
    id: str
    skill_name: str
    type: str
    source: str # VERIFIED, SELF_REPORTED
    score: float
    verified: bool
    weight: float
    description: Optional[str] = None
    created_at: datetime

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
    role: str
    skills: List[JobRequirementItem]
    education: List[str] = ["B.Tech", "B.E."]
    minimum_cgpa: float = 6.0
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

# REASSESSMENT SCHEMAS
class ReassessmentSubmitRequest(BaseModel):
    skill_name: str
    assessment_score: float # 0 to 100

class ReassessmentResultResponse(BaseModel):
    skill_name: str
    old_skill_score: float
    new_skill_score: float
    old_readiness: float
    new_readiness: float
    improvement_delta: float
    message: str

# LEARNING RECOMMENDATION SCHEMAS
class LearningRecommendationResponse(BaseModel):
    id: str
    skill_name: str
    topic: str
    difficulty: str
    estimated_effort: str
    resource_type: str
    outcome: str
