# TalentProof — Evidence-Based Placement Readiness Platform

**Smart India Hackathon (SIH 2026)**
**Platform Status**: Production-Ready • Technically Honest • Fully Verified

> *"Instead of simply tracking job applications, TalentProof converts fragmented student claims into evidence-backed competencies, detects hidden prerequisite blockers, simulates career progression, provides objective reassessments, and pairs deterministic hard eligibility matching with transparent auxiliary machine learning for institutional early warning."*

---

## 🚀 Key Features & Core Innovations

1. **Multi-Source Evidence Engine with Time-Decay Recency**:
   - Computes deterministic mastery scores by aggregating weighted evidence types: `Resume Claim (0.3)` to `Technical Interview / Faculty Sign-Off (1.8)`.
   - Applies exponential time decay ($1.0 \to 0.85 \to 0.65 \to 0.40$) based on evidence age.
   - Detects discrepancies ($|\text{Self} - \text{Verified}| > 25.0\%$) and categorizes competencies into 4 mastery states (`CLAIMED`, `SUPPORTED`, `VERIFIED`, `MASTERED`).

2. **Directed Acyclic Graph (DAG) Prerequisite & Hidden Gap Engine**:
   - Models skill dependency relationships (`Spring Boot` $\to$ `Java`, `REST API`, `SQL`; `System Design` $\to$ `SQL`, `Networks`, `REST API`; `React` $\to$ `JavaScript`).
   - Automatically detects hidden prerequisite deficits when students struggle with advanced frameworks.
   - Topologically sorts student learning paths so foundational competencies precede dependent technologies.

3. **"Why Am I Not Ready?" Blocker Diagnostics**:
   - Evaluates hard academic eligibility (CGPA $\ge$ cutoff, allowed branches) + missing skill thresholds + hidden prerequisite warnings.
   - Delivers actionable remediation steps for every identified deficit.

4. **"What If I Learn This?" Career Readiness Simulation**:
   - Interactive multi-competency sliders allowing students to simulate projected readiness boosts across all campus job roles in real time before taking verified assessments.

5. **Objective Practical Skill Reassessment (Zero Hardcoded Scores)**:
   - Database-backed question bank (`assessment_questions` table, 5 verified MCQs per competency).
   - Automated objective grading (MCQ accuracy accounts for 80%, practical code heuristics provide up to 20% validation bonus).
   - Dynamically updates student skill mastery, logs verified evidence, and recalculates readiness scores on-the-fly.

6. **Auxiliary Machine Learning Risk Prioritization**:
   - Real `RandomForestClassifier` trained on a 7-dimensional student feature vector ($N=500$, stratified 80/20 train/test split).
   - Reports live Accuracy ($>88\%$), Precision, Recall, F1-Score, and Gini feature importances.
   - Strictly separated from deterministic company eligibility rules (Hard Eligibility is non-negotiable).

7. **Institutional Placement Drive & Candidate Stage Progression**:
   - Full placement drive lifecycle management, 1-click student applications (`/students/me/apply`), and candidate stage transitions (`Applied` $\to$ `Shortlisted` $\to$ `Interview` $\to$ `Selected`).

8. **Remedial Training Cohort Management**:
   - Aggregates common campus skill deficits into structured training cohorts, assigns faculty instructors, and tracks candidate enrollment.

9. **Security & Authentication**:
   - Native Bcrypt password hashing, PyJWT bearer token authentication, forced password reset on first login (`first_login: true`), role-based route guards (`STUDENT` vs `PLACEMENT_CELL`).

10. **Institutional 500-Student Dataset**:
    - Complete dataset across CSE (120), Lateral CSE (80), ECE (100), AI&DS (100), CSIT (100) synchronized in SQLite and exported to Excel.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router DOM.
- **Backend**: Python 3.12, FastAPI, Pydantic V2, SQLAlchemy, Scikit-Learn, PyJWT, Native Bcrypt, PyPDF2, python-docx.
- **Machine Learning**: `RandomForestClassifier` (Scikit-Learn) with Stratified Train/Test Split.
- **AI Integration**: Google Gemini API (`gemini-1.5-flash`), strictly invoked backend-only.
- **Database**: 19 Relational Tables in SQLite / Supabase PostgreSQL.

---

## 📦 Project Documentation Reference

Comprehensive technical documentation is located in the [`docs/`](./docs) directory:
- 📄 [Complete Feature & Technical Audit](./docs/COMPLETE_FEATURE_AUDIT.md)
- 🏛️ [System Architecture & API Specifications](./docs/ARCHITECTURE.md)
- 📐 [Evidence Scoring Methodology & Mathematics](./docs/EVIDENCE_METHODOLOGY.md)
- 🤖 [Auxiliary Machine Learning Methodology](./docs/ML_METHODOLOGY.md)
- 🎬 [SIH 2026 Presentation & Demo Flow Guide](./docs/SIH_DEMO_FLOW.md)
- ✅ [Final Verification & Test Report](./docs/FINAL_VERIFICATION.md)

---

## ⚡ Quick Start Guide

### 1. Backend Setup & Verification

```powershell
cd backend

# 1. Install Dependencies
python -m pip install -r requirements.txt

# 2. Run Comprehensive Automated Test Suite (12 Tests)
python -m pytest tests/test_backend.py -v

# 3. Seed 500 Student Records, Question Banks, Drives & Cohorts
python -m scripts.import_students

# 4. Start FastAPI Backend Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

FastAPI Interactive Swagger API Documentation:
👉 `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup (React + Vite)

```powershell
cd frontend

# 1. Install Node Dependencies
npm install

# 2. Run Production Build Verification
npm run build

# 3. Start Vite Development Server
npm run dev
```

Frontend Portal:
👉 `http://localhost:3000`

---

## 🔐 Credentials for SIH Presentation Demo

### 1. Student Portal Demo Account
- **Student ID (Username)**: `2300030042`
- **Default Password**: `2300030042`
- **First Login Behavior**: Authenticates with default password, forces **Password Reset**, hashes new password using bcrypt, sets `first_login = false`, and unlocks the Student Dashboard.

### 2. Placement Cell Admin Demo Account
- **Username**: `admin`
- **Password**: `placement123`
- **Portal Access**: Full access to institutional dashboard, JD upload with Gemini extraction, candidate stage management, ML early warning metrics, and training cohorts.

