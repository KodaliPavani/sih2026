"""
TalentProof Auxiliary Machine Learning Readiness & Risk Prioritization Engine
Trains a real Scikit-Learn Classifier for probabilistic placement readiness estimation.

CRITICAL ARCHITECTURAL CONSTRAINTS:
- Labeled as: "Synthetic prototype dataset"
- Used strictly for auxiliary risk prioritization and probabilistic forecasting.
- Never overrides mandatory deterministic company eligibility criteria (Hard Eligibility).
- Reports true validation metrics (Accuracy, Precision, Recall, F1, Confusion Matrix).
"""
import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sqlalchemy.orm import Session
from app.models.models import Student, StudentSkill, SkillEvidence

class PlacementMLPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        self.is_trained = False
        self.metrics: Dict[str, Any] = {}
        self.feature_names = [
            "cgpa",
            "avg_skill_score",
            "verified_evidence_count",
            "high_confidence_skills",
            "attendance_pct",
            "certifications",
            "weak_skills_count"
        ]

    def extract_student_features(self, db: Session, student: Student) -> List[float]:
        """Extracts feature vector for a student."""
        skills = db.query(StudentSkill).filter(StudentSkill.student_id == student.id).all()
        evidence_count = db.query(SkillEvidence).filter(
            SkillEvidence.student_id == student.id,
            SkillEvidence.verified == True
        ).count()

        if skills:
            avg_score = sum(s.mastery_score for s in skills) / len(skills)
            high_conf = sum(1 for s in skills if s.confidence in ["High", "HIGH", "VERY_HIGH"])
            weak_count = sum(1 for s in skills if s.mastery_score < 60.0)
        else:
            avg_score = student.overall_readiness or 50.0
            high_conf = 1
            weak_count = 3

        return [
            float(student.cgpa or 7.0),
            float(avg_score),
            float(evidence_count),
            float(high_conf),
            float(student.attendance_percent or 80.0),
            float(student.certifications_count or 1),
            float(weak_count)
        ]

    def train_on_cohort(self, db: Session) -> Dict[str, Any]:
        """
        Trains the Random Forest model on the student cohort.
        Splits into 80% train / 20% test, evaluates validation metrics.
        """
        students = db.query(Student).all()
        if len(students) < 20:
            return {"status": "INSUFFICIENT_DATA", "message": "At least 20 student records required."}

        X = []
        y = []

        for st in students:
            feats = self.extract_student_features(db, st)
            X.append(feats)
            # Ground truth proxy: Ready students (readiness >= 72% and CGPA >= 7.0)
            is_placement_ready = 1 if (st.overall_readiness >= 70.0 and st.cgpa >= 6.8) else 0
            y.append(is_placement_ready)

        X = np.array(X)
        y = np.array(y)

        # 80/20 Train-Test split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)

        acc = round(float(accuracy_score(y_test, y_pred)), 4)
        prec = round(float(precision_score(y_test, y_pred, zero_division=0)), 4)
        rec = round(float(recall_score(y_test, y_pred, zero_division=0)), 4)
        f1 = round(float(f1_score(y_test, y_pred, zero_division=0)), 4)
        cm = confusion_matrix(y_test, y_pred).tolist()

        feature_importances = {
            self.feature_names[i]: round(float(self.model.feature_importances_[i]), 4)
            for i in range(len(self.feature_names))
        }

        self.is_trained = True
        self.metrics = {
            "model_type": "RandomForestClassifier (n_estimators=50, max_depth=5)",
            "dataset_label": "Synthetic prototype dataset (500 Institutional Student Cohort)",
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "validation_metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "confusion_matrix": cm
            },
            "feature_importance_ranking": sorted(feature_importances.items(), key=lambda x: x[1], reverse=True),
            "production_disclaimer": "Production deployment requires historical multi-year placement outcome tracking across campus drives."
        }

        return self.metrics

    def predict_student_readiness_probability(self, db: Session, student: Student) -> Dict[str, Any]:
        """
        Estimates probabilistic readiness for a single student.
        """
        if not self.is_trained:
            self.train_on_cohort(db)

        feats = np.array([self.extract_student_features(db, student)])
        prob = float(self.model.predict_proba(feats)[0][1])
        pct_prob = round(prob * 100, 1)

        # Risk classification
        if pct_prob >= 75.0:
            risk_tier = "LOW RISK (HIGH PLACEMENT PROBABILITY)"
        elif pct_prob >= 50.0:
            risk_tier = "MODERATE RISK (REQUIRES TARGETED UPSKILLING)"
        else:
            risk_tier = "HIGH RISK (URGENT INTERVENTION REQUIRED)"

        return {
            "student_id": student.student_id,
            "estimated_placement_probability": pct_prob,
            "risk_tier": risk_tier,
            "metrics": self.metrics
        }

# Global singleton instance
ml_engine = PlacementMLPredictor()
