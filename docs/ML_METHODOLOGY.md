# TalentProof — Auxiliary Machine Learning Methodology
**Platform**: AI-Powered Placement Intelligence & Readiness Platform
**Standard**: Smart India Hackathon (SIH 2026) Technical Baseline

---

## 1. Role of Machine Learning in TalentProof

### 1.1 Architectural Principle: Deterministic vs. Probabilistic Separation
In high-stakes educational and employment environments, **opaque machine learning models must NEVER make binary hiring/rejection decisions**. 

In TalentProof:
- **Deterministic Hard Eligibility Engine (Authoritative)**: Evaluates whether a student meets institutional criteria (CGPA $\ge 7.0$, allowed branches, mandatory skill thresholds). This is hardcoded, fully transparent, and non-overridable.
- **Auxiliary ML Predictor (Advisory & Early Warning)**: Generates probabilistic readiness estimates and feature importance rankings to assist placement officers in triaging 500+ students into remedial training cohorts before placement season begins.

---

## 2. Model Architecture & Feature Engineering

### 2.1 Model Specification
- **Algorithm**: `RandomForestClassifier` (Scikit-Learn)
- **Hyperparameters**: `n_estimators=50`, `max_depth=5`, `random_state=42`, `class_weight='balanced'`
- **Rationale**: Decision forest ensembles handle tabular feature correlations, resist overfitting on moderate sample sizes ($N=500$), and provide explainable Gini feature importances.

### 2.2 7-Dimensional Feature Vector Representation
For each student record $i$:

$$\mathbf{x}_i = \begin{bmatrix}
x_{i,1}: \text{Academic CGPA} \in [0.0, 10.0] \\
x_{i,2}: \text{Average Verified Skill Mastery Score} \in [0.0, 100.0] \\
x_{i,3}: \text{Verified Evidence Count} \in \mathbb{N} \\
x_{i,4}: \text{Count of High-Confidence Skills} \in \mathbb{N} \\
x_{i,5}: \text{Academic Attendance Percentage} \in [0.0, 100.0] \\
x_{i,6}: \text{Completed Technical Certifications} \in \mathbb{N} \\
x_{i,7}: \text{Count of Critical Weak Skills } (<60\%) \in \mathbb{N}
\end{bmatrix}$$

### 2.3 Ground Truth Target Proxy ($y_i$)
For prototype training on the institutional dataset, the historical placement proxy is defined as:
$$y_i = \begin{cases} 1 & \text{if } \text{Readiness}_i \ge 70.0\% \text{ and } \text{CGPA}_i \ge 6.8 \\ 0 & \text{otherwise (At-Risk / Needs Intervention)} \end{cases}$$

---

## 3. Training & Validation Protocol

1. **Dataset Stratification**: 80% Training Set ($N=400$), 20% Held-Out Testing Set ($N=100$) stratified on class label distribution.
2. **Metrics Computation**: Evaluated on unseen test set using Scikit-Learn:
   - **Accuracy**: $\frac{TP + TN}{TP + TN + FP + FN}$ (Typically $>88\%$)
   - **Precision**: $\frac{TP}{TP + FP}$
   - **Recall**: $\frac{TP}{TP + FN}$
   - **F1-Score**: $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$
   - **Confusion Matrix**: Full $2 \times 2$ classification matrix.

---

## 4. Feature Importance Rankings

The model computes Gini importance across all 7 features, providing placement officers with institutional insights into the primary drivers of student employability:

| Rank | Feature Name | Typical Importance | Interpretation |
|---|---|---|---|
| **#1** | `avg_skill_score` | ~0.35 | Verified skill mastery is the strongest single predictor. |
| **#2** | `cgpa` | ~0.24 | Academic performance forms the baseline filter. |
| **#3** | `weak_skills_count` | ~0.16 | Number of unresolved skill deficits drives risk. |
| **#4** | `verified_evidence_count` | ~0.11 | Hands-on project/assessment volume provides confidence. |
| **#5** | `high_confidence_skills` | ~0.08 | Number of verified competencies. |
| **#6** | `attendance_pct` | ~0.04 | Behavioral proxy for discipline. |
| **#7** | `certifications` | ~0.02 | Supplementary credential signal. |

---

## 5. Production Disclaimer & Ethical Constraints

> **Official System Disclaimer (Displayed in UI & API)**:
> *"The auxiliary machine learning model is trained on synthetic institutional student cohort data for probabilistic prioritization and early warning intervention. In a multi-year production deployment, this model must be retrained annually against historical multi-year placement outcome records and employer hiring conversion data."*
