# TalentProof — Evidence Scoring Methodology & Mathematical Formulation
**Platform**: Evidence-Based Placement Intelligence Engine
**Document Version**: 2.0 (SIH 2026 Production Baseline)

---

## 1. The Evidence Problem

Traditional placement systems rely on one of two flawed extremes:
1. **Unverified Self-Reporting**: Students claim "Expert in Spring Boot" on resumes without proof.
2. **One-Off Test Scores**: A single bad test day permanently categorizes a capable student as unqualified.

TalentProof solves this with **Multi-Source Corroboration with Time-Decay Weighting**. A student's competency score is an aggregated function of diverse evidence artifacts (proctored coding exams, GitHub projects, practical tasks, faculty sign-offs, and resume claims) continuously refreshed over time.

---

## 2. Evidence Type Weights & Credibility Matrix

Each evidence artifact $k$ is assigned an intrinsic credibility weight $W_k$:

| Evidence Type | Weight ($W_k$) | Verification Requirement | Description |
|---|---|---|---|
| **Technical Interview** | **1.8** | Proctored Interview / Viva | Direct technical questioning with faculty or industry mentor. |
| **Faculty Verification** | **1.8** | Academic Endorsement | Department lab instructor sign-off on practical assignment. |
| **Coding Assessment** | **1.6** | Proctored Platform Test | Automated test execution passing hidden test cases. |
| **Practical Task** | **1.4** | Code Review & Compilation | Practical project module implementation. |
| **Verified GitHub Project** | **1.2** | Public Repository / Commit Log | Codebase with meaningful commit history and architecture. |
| **Certificate** | **0.7** | Certificate URL / Credential ID | Course completion certificate (NPTEL, Coursera, HackerRank). |
| **Self-reported Project** | **0.6** | Student Description | Unverified project claimed in student portfolio. |
| **Resume Claim** | **0.3** | Raw Resume Text | Unverified text keyword listed on resume. |

---

## 3. Time-Decay Recency Multiplier $R(t)$

Technical skills decay if not practiced or reassessed. The recency multiplier $R(t_k)$ adjusts evidence weight based on days $t_k$ since verification:

$$R(t_k) = \begin{cases}
1.00 & \text{if } t_k \le 30 \text{ days (Fresh)} \\
0.85 & \text{if } 30 < t_k \le 90 \text{ days (Active)} \\
0.65 & \text{if } 90 < t_k \le 180 \text{ days (Moderate)} \\
0.40 & \text{if } t_k > 180 \text{ days (Stale / Needs Reassessment)}
\end{cases}$$

---

## 4. Mastery Score Calculation

For a skill $S$ with $N$ evidence items, the final deterministic mastery score $M(S)$ is computed as:

$$M(S) = \frac{\sum_{k=1}^{N} \Big( \text{Score}_k \cdot W_k \cdot R(t_k) \Big)}{\sum_{k=1}^{N} \Big( W_k \cdot R(t_k) \Big)}$$

If no evidence exists, $M(S)$ defaults to the baseline self-reported claim.

---

## 5. Mastery States & Confidence Tiers

### 5.1 Mastery State State Machine
Every student skill exists in one of four mutually exclusive mastery states:
- **`CLAIMED`**: Only unverified resume or self-reported claims exist ($W_k \le 0.6$).
- **`SUPPORTED`**: Supported by 1 verified source or score is below 65%.
- **`VERIFIED`**: Score $\ge 65.0\%$ with at least 1 verified proctored or practical source ($W_k \ge 1.2$).
- **`MASTERED`**: Score $\ge 80.0\%$ backed by $\ge 2$ independent strong verified sources ($W_k \ge 1.4$).

### 5.2 Confidence Levels
The system assigns confidence levels based on cumulative effective weight:
$$\text{Total Effective Weight } \Omega = \sum_{k=1}^{N} \Big( W_k \cdot R(t_k) \Big)$$
- **`VERY_HIGH`**: $\Omega \ge 3.5$ with verified assessment.
- **`HIGH`**: $\Omega \ge 2.0$.
- **`MEDIUM`**: $\Omega \ge 1.0$.
- **`LOW`**: $\Omega < 1.0$.

---

## 6. Discrepancy & Contradiction Detection Heuristic

The evidence engine continuously checks for contradictions between subjective self-claims and objective assessments:

$$\text{Discrepancy} = \text{Score}_{\text{Resume/Self}} - \text{Score}_{\text{Verified Assessment}}$$

If $\text{Discrepancy} > 25.0\%$, the system flags a **Consistency Warning**:
> *"Discrepancy detected: Claimed proficiency (90%) exceeds verified coding assessment performance (42%). Reassessment recommended."*

The verified proctored assessment score heavily outweighs the resume claim in the mathematical weighted average.
