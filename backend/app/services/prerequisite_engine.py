"""
TalentProof Prerequisite & Skill Hierarchy Engine
Provides skill DAG relationships, hidden gap detection, and dependency-ordered learning pathways.
"""
from typing import Dict, List, Tuple, Any, Optional
from sqlalchemy.orm import Session
from app.models.models import Student, StudentSkill, Skill, SkillPrerequisite, SkillHierarchy
from app.services.normalization_service import normalize_skill_name, get_or_create_skill

# Static Canonical Prerequisite Graph Definition
# (Can also be synced/seeded to database tables `skill_prerequisites` and `skill_hierarchies`)
PREREQUISITE_GRAPH: Dict[str, List[Dict[str, Any]]] = {
    "Spring Boot": [
        {"skill": "Java", "min_score": 60.0, "strictness": "MANDATORY", "reason": "Spring Boot framework requires foundational Java OOP and language syntax."},
        {"skill": "REST API", "min_score": 55.0, "strictness": "RECOMMENDED", "reason": "Understanding HTTP verbs, status codes, and JSON serialization is essential for Spring REST controllers."},
        {"skill": "SQL", "min_score": 50.0, "strictness": "RECOMMENDED", "reason": "Spring Data JPA and Hibernate require underlying relational database knowledge."}
    ],
    "System Design": [
        {"skill": "SQL", "min_score": 65.0, "strictness": "MANDATORY", "reason": "Database schema modeling and indexing are core building blocks of scalable architecture."},
        {"skill": "Computer Networks", "min_score": 55.0, "strictness": "MANDATORY", "reason": "TCP/IP, load balancers, and CDN concepts depend on networking fundamentals."},
        {"skill": "REST API", "min_score": 60.0, "strictness": "MANDATORY", "reason": "Microservice communication protocols rely on clean API design."},
    ],
    "DSA": [
        {"skill": "Coding", "min_score": 55.0, "strictness": "MANDATORY", "reason": "Basic algorithmic thinking and programming fluency are required before complex data structures."},
        {"skill": "Java", "min_score": 50.0, "strictness": "RECOMMENDED", "reason": "Implementing data structures requires mastery of object references and memory structures."}
    ],
    "Machine Learning": [
        {"skill": "Python", "min_score": 65.0, "strictness": "MANDATORY", "reason": "NumPy, Pandas, and Scikit-Learn require solid Python programming fluency."},
        {"skill": "DSA", "min_score": 50.0, "strictness": "RECOMMENDED", "reason": "Vectorized computations and algorithm complexities require data structures intuition."}
    ],
    "React": [
        {"skill": "JavaScript", "min_score": 60.0, "strictness": "MANDATORY", "reason": "ES6+ syntax (destructuring, arrow functions, promises) is prerequisite to React hooks and JSX."}
    ],
    "REST API": [
        {"skill": "Coding", "min_score": 50.0, "strictness": "MANDATORY", "reason": "Implementing endpoints requires basic programming and web request understanding."}
    ]
}

SKILL_HIERARCHY_MAP: Dict[str, Dict[str, Any]] = {
    "Backend Development": {
        "category": "Domain",
        "children": ["Java", "Spring Boot", "REST API", "SQL", "Git"]
    },
    "Core CS Fundamentals": {
        "category": "Core CS",
        "children": ["DSA", "Operating Systems", "Computer Networks", "DBMS"]
    },
    "Frontend Development": {
        "category": "Domain",
        "children": ["JavaScript", "React"]
    },
    "Data & AI": {
        "category": "Domain",
        "children": ["Python", "Machine Learning", "SQL"]
    },
    "Professional Skills": {
        "category": "Soft Skill",
        "children": ["Communication", "Aptitude", "Coding"]
    }
}


def get_skill_prerequisites(skill_name: str) -> List[Dict[str, Any]]:
    """Returns canonical prerequisites for a target skill."""
    norm_name = normalize_skill_name(skill_name)
    return PREREQUISITE_GRAPH.get(norm_name, [])


def detect_hidden_prerequisite_gaps(
    db: Session,
    student_id: str,
    target_skill_name: str
) -> List[Dict[str, Any]]:
    """
    Checks if a student has prerequisite deficiencies behind a target skill gap.
    Returns list of unmet prerequisites with current score and required score.
    """
    prereqs = get_skill_prerequisites(target_skill_name)
    if not prereqs:
        return []

    hidden_gaps = []
    for req in prereqs:
        prereq_name = req["skill"]
        min_required = req["min_score"]

        # Look up student's score in prerequisite skill
        skill_obj = db.query(Skill).filter(Skill.canonical_name == prereq_name).first()
        current_score = 0.0
        if skill_obj:
            st_skill = db.query(StudentSkill).filter(
                StudentSkill.student_id == student_id,
                StudentSkill.skill_id == skill_obj.id
            ).first()
            if st_skill:
                current_score = st_skill.mastery_score or 0.0

        if current_score < min_required:
            hidden_gaps.append({
                "prerequisite_skill": prereq_name,
                "current_score": current_score,
                "required_score": min_required,
                "deficit": round(min_required - current_score, 1),
                "strictness": req["strictness"],
                "reason": req["reason"],
                "alert": f"You may struggle with {target_skill_name} because prerequisite skill '{prereq_name}' is currently {current_score}% (needs ≥{min_required}%)."
            })

    return hidden_gaps


def check_student_prerequisites_met(
    db: Session,
    student_id: str,
    target_skill_name: str
) -> Tuple[bool, List[str]]:
    """
    Checks whether all mandatory prerequisites for a target skill are satisfied.
    Returns (is_met, list_of_blocking_prerequisites).
    """
    hidden_gaps = detect_hidden_prerequisite_gaps(db, student_id, target_skill_name)
    mandatory_blockers = [
        f"{g['prerequisite_skill']} ({g['current_score']}% < {g['required_score']}%)"
        for g in hidden_gaps if g["strictness"] == "MANDATORY"
    ]
    return len(mandatory_blockers) == 0, mandatory_blockers


def order_learning_path_by_prerequisites(
    db: Session,
    student_id: str,
    skill_gaps: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Orders a list of skill gaps so that foundational prerequisites appear before dependent skills.
    e.g., If student lacks both Java and Spring Boot, Java is recommended first.
    """
    ordered = []
    seen_skills = set()

    for gap in skill_gaps:
        s_name = gap["skill_name"]
        hidden_gaps = detect_hidden_prerequisite_gaps(db, student_id, s_name)
        
        # Check if any prerequisite is itself a gap that hasn't been added yet
        for hg in hidden_gaps:
            pr_name = hg["prerequisite_skill"]
            if pr_name not in seen_skills:
                ordered.append({
                    "skill_name": pr_name,
                    "current_score": hg["current_score"],
                    "target_score": hg["required_score"],
                    "priority": "HIGH",
                    "is_prerequisite_for": s_name,
                    "reason": f"PRIMARY PREREQUISITE: Required to successfully master {s_name}."
                })
                seen_skills.add(pr_name)

        if s_name not in seen_skills:
            gap_item = dict(gap)
            if hidden_gaps:
                gap_item["prerequisite_warning"] = f"Recommended to complete {', '.join([h['prerequisite_skill'] for h in hidden_gaps])} first."
            ordered.append(gap_item)
            seen_skills.add(s_name)

    return ordered
