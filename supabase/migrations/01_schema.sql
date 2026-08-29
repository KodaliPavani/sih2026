-- SQL Schema Migration for Placement Intelligence & Skill Readiness Platform
-- Supabase / PostgreSQL compatible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('STUDENT', 'PLACEMENT_CELL')),
    password_hash VARCHAR(255) NOT NULL,
    first_login BOOLEAN DEFAULT TRUE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    cgpa NUMERIC(4,2) NOT NULL CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
    email VARCHAR(150),
    phone VARCHAR(20),
    target_role VARCHAR(100) DEFAULT 'Java Backend Developer',
    resume_url TEXT,
    overall_readiness NUMERIC(5,2) DEFAULT 0.0,
    readiness_status VARCHAR(50) DEFAULT 'Needs Improvement',
    attendance_percent NUMERIC(5,2) DEFAULT 80.0,
    certifications_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PLACEMENT CELL USERS TABLE
CREATE TABLE IF NOT EXISTS placement_cell_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    department VARCHAR(100) DEFAULT 'Placement & Training Cell',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SKILLS CANONICAL TABLE
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    canonical_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Technical',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SKILL ALIASES TABLE
CREATE TABLE IF NOT EXISTS skill_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    alias VARCHAR(100) UNIQUE NOT NULL
);

-- 6. STUDENT SKILLS TABLE
CREATE TABLE IF NOT EXISTS student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (mastery_score >= 0.0 AND mastery_score <= 100.0),
    confidence VARCHAR(20) DEFAULT 'Medium',
    last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, skill_id)
);

-- 7. SKILL EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS skill_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- Coding Assessment, Aptitude, Project, Certification, Mock Interview
    source VARCHAR(100) NOT NULL, -- VERIFIED or SELF_REPORTED
    score NUMERIC(5,2) DEFAULT 0.0,
    verified BOOLEAN DEFAULT FALSE,
    weight NUMERIC(3,2) DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. JOB DESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    location VARCHAR(100) DEFAULT 'Pan India',
    package_lpa NUMERIC(5,2) DEFAULT 6.0,
    min_cgpa NUMERIC(4,2) DEFAULT 6.0,
    allowed_branches TEXT DEFAULT 'CSE,ECE,AI&DS,CSIT',
    raw_text TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 9. JOB REQUIREMENTS TABLE
CREATE TABLE IF NOT EXISTS job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    importance VARCHAR(20) DEFAULT 'HIGH', -- HIGH, MEDIUM, LOW
    min_score NUMERIC(5,2) DEFAULT 60.0,
    UNIQUE(job_id, skill_id)
);

-- 10. ELIGIBILITY RESULTS TABLE
CREATE TABLE IF NOT EXISTS eligibility_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- ELIGIBLE, NEAR_READY, NOT_ELIGIBLE
    eligibility_score NUMERIC(5,2) DEFAULT 0.0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, student_id)
);

-- 11. READINESS SCORES TABLE
CREATE TABLE IF NOT EXISTS readiness_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_role VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'Needs Improvement',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, job_role)
);

-- 12. READINESS HISTORY TABLE
CREATE TABLE IF NOT EXISTS readiness_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_role VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    change_delta NUMERIC(5,2) DEFAULT 0.0,
    source VARCHAR(100) DEFAULT 'Reassessment Boost',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. SKILL GAPS TABLE
CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    current_score NUMERIC(5,2) DEFAULT 0.0,
    required_score NUMERIC(5,2) DEFAULT 60.0,
    gap_points NUMERIC(5,2) DEFAULT 0.0,
    priority VARCHAR(20) DEFAULT 'HIGH'
);

-- 14. LEARNING RESOURCES & RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'Intermediate',
    estimated_effort VARCHAR(50) DEFAULT '2 Hours',
    resource_type VARCHAR(50) DEFAULT 'Practice Task',
    url TEXT,
    outcome VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS learning_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. REASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS reassessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    old_score NUMERIC(5,2) NOT NULL,
    new_score NUMERIC(5,2) NOT NULL,
    improvement NUMERIC(5,2) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. PLACEMENT DRIVES TABLE
CREATE TABLE IF NOT EXISTS placement_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
    drive_date DATE NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. PLACEMENT APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS placement_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    current_stage VARCHAR(100) DEFAULT 'Registration',
    status VARCHAR(50) DEFAULT 'Applied',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drive_id, student_id)
);

-- 18. TRAINING COHORTS & ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS training_cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    student_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_id UUID REFERENCES training_cohorts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Assigned',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_resource VARCHAR(100),
    details_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch);
CREATE INDEX IF NOT EXISTS idx_students_target_role ON students(target_role);
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_student ON skill_evidence(student_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_job ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_job ON eligibility_results(job_id);
