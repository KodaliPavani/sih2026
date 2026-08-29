# TalentProof — Smart India Hackathon (SIH 2026) Demo Flow
**Platform**: Evidence-Based Placement Intelligence and Skill Readiness Platform
**Presentation Time**: 7–10 Minutes

---

## 1. Demo Credentials & Environment

| Portal | URL | Username | Default Password | Role |
|---|---|---|---|---|
| **Student Portal** | `http://localhost:3000/login` | `2300030042` | `2300030042` | Student (Pavani Kodali, CSE) |
| **Placement Cell** | `http://localhost:3000/login` | `admin` | `placement123` | Placement Admin / TPO |

---

## 2. Student Experience Demo (4–5 Minutes)

### Step 1: Secure First-Time Login & Mandatory Password Reset
1. Open `http://localhost:3000/login`.
2. Enter `2300030042` and `2300030042`.
3. The platform intercepts the session due to `first_login: true` and displays the **Mandatory Password Reset** screen.
4. Set a secure password (e.g. `Student@2026`) and click **Update Password & Access Dashboard**.

### Step 2: Student Intelligence Dashboard
1. Point out the real student profile banner: **Pavani Kodali**, Target Role: **Java Backend Developer**, CGPA: **8.20 / 10.0**.
2. Point out the **Target Role Readiness Gauge**: Currently **52% (Needs Improvement)**.
3. Show the **Priority Skill Gaps Card**: Identifies deficits in `Spring Boot` (32%), `DSA` (48%), `REST API` (51%).

### Step 3: "Why Am I Not Ready?" Blocker Diagnostics
1. Click the amber **"Why Am I Not Ready?"** button in the dashboard or sidebar.
2. Highlight:
   - **Academic Hard Eligibility**: Passed (CGPA 8.2 $\ge$ 7.0 required).
   - **Competency Blockers**: `Spring Boot` (-33 pts deficit), `DSA` (-17 pts deficit).
   - **Hidden Prerequisite Warnings**: Explains underlying skill dependencies.
   - **Actionable Remediation**: Specific pathway for each gap.

### Step 4: "What-If I Learn This?" Career Readiness Simulation
1. Click **"Career Simulation"** in the sidebar.
2. Show the interactive sliders for each competency (`Spring Boot`, `DSA`, `SQL`, `Java`).
3. Drag the `Spring Boot` slider from **32% $\to$ 85%** and `DSA` from **48% $\to$ 75%**.
4. Observe **real-time recalculation**:
   - Projected Readiness boosts from **52% $\to$ 81% (+29 pts)**!
   - Shows **Multi-Role Placement Impact**: Unlocks `ABC Technologies - Java Backend Developer` and `TCS Digital - Full Stack Engineer`!
   - Highlight the **Official Simulation Disclaimer** clarifying this is a projection before verified assessment.

### Step 5: Evidence-Backed Skill Passport & Evidence Upload
1. Click **"Skill Passport"** in the sidebar.
2. Show the mastery state badges: `Java` is **VERIFIED (86%)**, while `Spring Boot` is **CLAIMED (32%)**.
3. Click **"Upload Evidence"** to demonstrate student submitting a self-reported GitHub project or certificate.

### Step 6: Objective Practical Skill Reassessment (Zero Fake Scores)
1. Click **"Reassessment"** in the sidebar.
2. Select `Spring Boot` from the dropdown.
3. Observe dynamic question bank loaded from database (5 verified technical MCQs).
4. Answer the MCQs and enter controller code in the practical challenge editor.
5. Click **"Submit Assessment & Recalculate Verified Readiness"**.
6. The system executes objective grading:
   - Evaluates correct MCQs ($N/5$).
   - Awards practical code bonus.
   - **Persists verified evidence and updates student mastery score and overall readiness on-the-fly!**

---

## 3. Placement Cell Experience Demo (4–5 Minutes)

### Step 1: Placement Officer Login
1. Log out from student portal and log in with `admin` / `placement123`.
2. Arrive at the **Placement Cell Intelligence Dashboard**.
3. Showcase:
   - Total Registered Students: **500 Candidates** across 5 engineering branches.
   - Live Readiness Distribution Pie: Categorized into Ready, Near Ready, and Needs Improvement.
   - Branch-wise Readiness Bar Chart: Comparing CSE, Lateral CSE, ECE, AI&DS, CSIT.

### Step 2: JD Upload & Automated Skill Extraction
1. Navigate to **"JD & Requirements"** (`/placement/jobs`).
2. Click **"Upload Job Description"**.
3. Paste a sample job posting or click prefill.
4. Observe automated skill extraction, importance weight assignment, and CGPA requirement extraction.

### Step 3: Placement Drive Management & Candidate Stage Progression
1. Click **"Placement Drives"** (`/placement/drives`).
2. View active recruitment drives (`ABC Technologies 8.5 LPA`, `Infosys 9.2 LPA`).
3. Click a drive to inspect registered student applicants with their verified readiness scores.
4. Change a candidate's status from **"Applied" $\to$ "Shortlisted" $\to$ "Selected"** in real-time.

### Step 4: At-Risk Early Warning & Auxiliary ML Metrics
1. Click **"At-Risk Students"** (`/placement/at-risk`).
2. Point out students flagged with multi-signal risk alerts (low attendance, critical weak competencies, CGPA near cutoff).
3. Point out the **Auxiliary ML Classifier Validation Banner**:
   - Model: `RandomForestClassifier` (n=50, max_depth=5).
   - Shows live Test Accuracy ($>88\%$), Precision, Recall, and F1-Score.
   - Shows top feature importance rankings (`avg_skill_score`, `cgpa`, `weak_skills_count`).
   - Highlight the production disclaimer.

### Step 5: Remedial Training Cohorts Creation
1. Click **"Training Cohorts"** (`/placement/training`).
2. Point out **AI-Recommended Deficit Programs** generated from aggregated campus skill gaps.
3. Click **"Create New Cohort"**, select `Spring Boot`, name the bootcamp, assign an instructor, and launch the program!
