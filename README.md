# AI-Powered Placement Intelligence and Skill Readiness Platform

**Smart India Hackathon (SIH 2026) Project**

> *"Instead of simply tracking placement applications, our platform converts fragmented student information into evidence-backed skills, compares those skills against real job requirements, identifies eligible candidates and skill gaps, recommends targeted learning, and continuously measures improvement through reassessment."*

---

## 🚀 Key Features & Core Innovations

1. **Evidence-Backed Skill Passport**: Aggregates verified coding assessments, aptitude scores, projects, certifications, and mock interviews into dynamic competency levels. Distinguishes `VERIFIED` evidence from `SELF_REPORTED` claims with weighted multipliers.
2. **Google Gemini AI Job Description Intelligence**: Extracts role title, minimum CGPA, and skill importance thresholds from uploaded PDF/DOCX or pasted raw JDs.
3. **Deterministic Skill Normalization & Rule-Based Eligibility Engine**: Canonical alias mapping (`JS` -> `JavaScript`, `Spring` -> `Spring Boot`, `REST` -> `REST API`). Explainable candidate eligibility matching (ELIGIBLE, NEAR READY, NOT ELIGIBLE).
4. **Role-Specific Weighted Readiness Engine**: Computes role readiness percentages dynamically based on target role requirements rather than a single static global score.
5. **Skill Gap & Targeted AI Learning Recommendation Engine**: Pinpoints exact deficit points and priority levels per skill gap and generates step-by-step learning modules via Gemini AI.
6. **Reassessment & Readiness History Engine**: Interactive practical coding and MCQ tests that update skill mastery, record verified evidence, boost role readiness scores (e.g. 52% → 81%, "+29 Pts!"), and maintain a historical audit trail.
7. **Institutional Placement Cell Console**: Candidate matching list with CSV Export, early warning At-Risk student intervention, and aggregate training cohorts.
8. **Security & Authentication**: Bcrypt password hashing, JWT token authentication, forced password reset on first login, role-based route guards, and zero secret leakage to the frontend.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router DOM.
- **Backend**: Python 3.12, FastAPI, Pydantic V2, SQLAlchemy, PyJWT, Native Bcrypt, PyPDF2, python-docx.
- **AI Integration**: Google Gemini API (`gemini-1.5-flash`), strictly invoked backend-only.
- **Database**: Supabase PostgreSQL / Local SQLite fallback with complete migrations.

---

## 📦 Project Directory Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/        # AuthContext for token & user state
│   │   ├── layouts/        # Student & Placement Cell Sidebars
│   │   ├── pages/          # Student & Placement Portal Pages
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx         # Routes & Role-based Guards
│   │   ├── index.css       # Tailwind CSS & Glassmorphism Design
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/routes/     # Auth, Students, Jobs, Placement, Assessments
│   │   ├── core/           # Config & Bcrypt/JWT Security
│   │   ├── db/             # SQLAlchemy Engine & Session
│   │   ├── models/         # ORM Models
│   │   ├── schemas/        # Pydantic Request/Response Models
│   │   ├── services/       # Gemini AI, Eligibility & Normalization Engines
│   │   └── main.py         # FastAPI Entry Point
│   ├── scripts/
│   │   └── import_students.py  # 500 Student Dataset Seeder & Excel Generator
│   ├── tests/              # Pytest Unit Tests
│   ├── .env.example
│   └── requirements.txt
├── supabase/
│   └── migrations/
│       └── 01_schema.sql   # PostgreSQL Schema DDL & RLS Policies
├── sih_placement_student_dataset_500_correct_ids.xlsx
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Backend Setup (FastAPI & Database Import)

```powershell
cd backend

# 1. Install Dependencies
python -m pip install -r requirements.txt

# 2. Run Pytest Verification Tests
python -m pytest tests/test_backend.py

# 3. Import 500 Student Records into Database
python -m scripts.import_students

# 4. Start FastAPI Backend Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

FastAPI Interactive Swagger API Documentation will be live at:
👉 `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup (React + Vite)

```powershell
cd frontend

# 1. Install Node Dependencies
npm install

# 2. Start Vite Development Server
npm run dev
```

Frontend Portal will be live at:
👉 `http://localhost:3000`

---

## 🔐 Credentials for SIH Presentation Demo

### 1. Student Portal Demo Account
- **Student ID (Username)**: `2300030042`
- **Default Password**: `2300030042`
- **First Login Behavior**: Authenticates with default password, forces **Password Reset**, hashes new password using bcrypt, sets `first_login = false`, and unlocks the Student Dashboard. Old default password stops working!

### 2. Placement Cell Admin Demo Account
- **Username**: `admin`
- **Password**: `placement123`
- **Portal Access**: Full access to institutional dashboard, JD upload with Gemini extraction, candidate matching, and CSV export.

---

## 🎯 Step-by-Step SIH Demo Scenario

1. **Log in as Placement Admin** (`admin` / `placement123`).
2. **Upload / Paste Java Backend Developer JD**:
   - Company: `ABC Technologies`
   - Role: `Java Backend Developer`
   - Trigger Gemini AI to extract required skills: `Java`, `DSA`, `SQL`, `Spring Boot`, `REST API`.
3. **Execute Candidate Eligibility Matching**: View real-time matching across all 500 students in the database grouped into `ELIGIBLE`, `NEAR READY`, and `NOT ELIGIBLE`. Click **Export to CSV**.
4. **Log in as First-Time Student** (`2300030042` / `2300030042`).
5. **Forced Password Reset**: Enter new password. Observe default password disabled and student dashboard unlocked.
6. **Inspect Skill Passport & Gaps**: Student `2300030042` has initial readiness **52%** with major gaps in **Spring Boot (32%)** and **DSA (48%)**.
7. **View AI Learning Plan**: See step-by-step Gemini recommendations for Spring Boot.
8. **Run Reassessment Test**: Complete Spring Boot assessment with score boost to **76%**.
9. **Observe Instant Readiness Increase**: Overall readiness increases from **52% → 81% (+29 Pts)**! Student moves from `Needs Improvement` to `Ready / Eligible` for ABC Technologies!
10. **Test Logout**: Click Sign Out to clear token and verify back navigation is blocked.
