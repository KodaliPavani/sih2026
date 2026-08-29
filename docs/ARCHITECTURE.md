# TalentProof — System Architecture & Technical Specifications
**Platform**: AI-Powered Placement Intelligence & Skill Readiness Platform
**Standard**: Smart India Hackathon (SIH 2026) Technical Baseline

---

## 1. Architectural Philosophy

TalentProof follows a **strictly layered, deterministic-first architecture**:
1. **Core Placement Decisions are Deterministic**: Hard eligibility rules (CGPA $\ge$ minimum, eligible branches) and required skill thresholds are computed mathematically and cannot be overridden by statistical models.
2. **Auxiliary Machine Learning is Probabilistic & Transparent**: Machine learning (Scikit-Learn Random Forest) is used strictly for early-warning risk prioritization and trend forecasting, and reports real validation metrics with an explicit prototype disclaimer.
3. **Evidence is Multi-Source & Time-Decayed**: Skill mastery is calculated through weighted multi-signal aggregation (coding tests, GitHub projects, certifications) adjusted by exponential recency decay.
4. **Skills are Dependency-Aware**: Skills exist in a Directed Acyclic Graph (DAG) that enforces foundational competencies before advanced frameworks.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-------------------------------------+  +------------------------------------+  |
|  |     Student Portal (React + Vite)   |  |   Placement Cell Portal (React)    |  |
|  |  • Skill Passport & Evidence Upload |  |  • Institutional Intelligence       |  |
|  |  • "Why Am I Not Ready?" Blockers   |  |  • JD Upload & Skill Extraction    |  |
|  |  • What-If Career Simulation        |  |  • Drive Lifecycle & Candidates    |  |
|  |  • Objective Dynamic Reassessment   |  |  • At-Risk Early Warning (ML)      |  |
|  +-------------------------------------+  +------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JWT Bearer Auth)
                                           v
+-----------------------------------------------------------------------------------+
|                                 APPLICATION LAYER                                 |
|                                (FastAPI / Python 3.12)                            |
|                                                                                   |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | Normalization Engine |  |  Prerequisite DAG   |  |  Evidence & Eligibility  |  |
|  | (Aliases & Taxonomy) |  | (Hidden Gap Engine) |  |   (Weights & Recency)    |  |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  |  Assessment Engine   |  |  Auxiliary ML Model |  | Placement Drive Service  |  |
|  | (MCQ Bank & Grading) |  | (Scikit-Learn RF)   |  | (Stage Tracking & Cohort)|  |
|  +----------------------+  +---------------------+  +--------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | SQLAlchemy ORM
                                           v
+-----------------------------------------------------------------------------------+
|                                PERSISTENCE LAYER                                  |
|                               (SQLite / PostgreSQL)                               |
|                                                                                   |
|  19 Relational Tables:                                                            |
|  • users, students, placement_cell_users, skills, skill_aliases                    |
|  • student_skills, skill_evidences, skill_hierarchies, skill_prerequisites         |
|  • skill_mastery_history, assessment_questions, reassessment_requests             |
|  • job_descriptions, job_requirements, readiness_scores, skill_gaps               |
|  • placement_drives, placement_applications, training_cohorts                     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Engine Specifications

### 3.1 Normalization Engine (`normalization_service.py`)
- Maps non-standard student resume keywords and JD terms to canonical technical skill entities.
- Solves alias fragmentation: `JS` $\to$ `JavaScript`, `SPRING BOOT` $\to$ `Spring Boot`, `OOPS` $\to$ `OOP`, `POSTGRES` $\to$ `SQL`, `GIT` $\to$ `Git`.
- Fallbacks gracefully to title-cased creation if an unrecognized technical skill is submitted.

### 3.2 Prerequisite & Hierarchy DAG Engine (`prerequisite_engine.py`)
- Models skill dependency relationships using a Directed Acyclic Graph.
- Detects hidden prerequisite gaps when a student struggles with advanced technologies (e.g., student fails `Spring Boot` because `Java` is $<60\%$).
- Orders learning pathways topographically so foundational skills precede dependent frameworks.

### 3.3 Evidence-Based Eligibility Engine (`eligibility_engine.py`)
- Evaluates student readiness scores against JD requirements:
  $$\text{Role Readiness} = \frac{\sum (w_i \cdot \text{Achievement}_i)}{\sum w_i}$$
  $$\text{Achievement}_i = \min\left(100.0, \frac{\text{Student Mastery}_i}{\text{Required Score}_i} \times 100\right)$$
- Computes time-decay multiplier $R(t)$ based on evidence age $t$ (days):
  $$R(t) = \begin{cases} 1.00 & t \le 30 \\ 0.85 & 30 < t \le 90 \\ 0.65 & 90 < t \le 180 \\ 0.40 & t > 180 \end{cases}$$
- Computes discrepancy warnings when self-reported claims deviate from verified coding assessments:
  $$\text{Discrepancy} = |\text{Score}_{\text{Self}} - \text{Score}_{\text{Verified}}| > 25.0$$

### 3.4 Objective Assessment & Grading Engine (`assessment_engine.py`)
- Stores verified, 5-question multi-choice question banks per technical competency in `assessment_questions`.
- Provides objective automated grading: MCQs account for 80% of assessment weight, and practical code implementation heuristics provide up to 20% validation bonus.
- Zero hardcoded demo scores; all reassessment evaluations are calculated on-the-fly and persisted to `skill_mastery_history` and `student_skills`.

### 3.5 Auxiliary Machine Learning Engine (`ml_readiness_predictor.py`)
- Uses a `RandomForestClassifier` ($n=50, \text{max\_depth}=5$) trained on 7 student features:
  1. `cgpa`
  2. `avg_skill_score`
  3. `verified_evidence_count`
  4. `high_confidence_skills`
  5. `attendance_pct`
  6. `certifications`
  7. `weak_skills_count`
- Employs an 80/20 train-test split stratified on historical placement outcome proxies.
- Reports live accuracy, precision, recall, F1, and feature importance rankings to placement officers.

---

## 4. API Endpoints & Contract Reference

### Authentication Routes (`/api/auth`)
- `POST /login`: Authenticates username and password; returns JWT token, user role, and `firstLogin` status.
- `POST /reset-password`: Mandatory password reset for first-time login or security updates.

### Student Portal Routes (`/api/students`)
- `GET /me/profile`: Returns student academic record, CGPA, target role, and overall readiness.
- `GET /me/skills`: Returns all tracked skills with mastery score, mastery state, confidence, and recency.
- `POST /me/evidence`: Submits new skill evidence with evidence type and description.
- `GET /me/readiness`: Returns current role readiness calculation and breakdown.
- `GET /me/gaps`: Returns identified priority deficits against target role.
- `GET /me/blockers`: Returns "Why Am I Not Ready?" diagnostic breakdown and hidden prerequisite alerts.
- `POST /me/simulate`: Runs "What If I Learn This?" career simulation across all campus roles.
- `GET /me/applications`: Returns student's recruitment drive applications and interview stages.
- `POST /me/apply`: Applies for a campus placement drive.

### Assessment Routes (`/api/assessments`)
- `GET /questions?skill_name=...`: Fetches verified question bank for the selected competency.
- `POST /reassess`: Evaluates submitted objective answers and practical code; updates student skill mastery.

### Placement Cell Routes (`/api/placement`)
- `GET /dashboard`: Returns total students, readiness categorization, and branch analytics.
- `GET /drives`: Returns all active campus placement drives.
- `POST /drives`: Schedules a new placement drive for a job description.
- `GET /drives/{id}/applications`: Returns candidate applicants and their interview stages.
- `PUT /applications/{id}/status`: Advances candidate stage (Applied $\to$ Shortlisted $\to$ Selected).
- `GET /at-risk`: Returns at-risk students flagged by multi-signal heuristics.
- `GET /training`: Returns active training cohorts and AI-recommended deficit programs.
- `POST /training`: Creates a new remedial training cohort.
- `GET /ml-model/metrics`: Returns Scikit-Learn auxiliary model validation metrics and feature importances.
