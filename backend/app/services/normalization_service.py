from typing import Dict
from sqlalchemy.orm import Session
from app.models.models import Skill, SkillAlias

# Deterministic alias mapping dictionary
ALIAS_MAP: Dict[str, str] = {
    "JS": "JavaScript",
    "JAVASCRIPT": "JavaScript",
    "ECMASCRIPT": "JavaScript",
    "REST": "REST API",
    "RESTFUL": "REST API",
    "RESTFUL API": "REST API",
    "REST API": "REST API",
    "RESTFUL SERVICES": "REST API",
    "SPRING": "Spring Boot",
    "SPRING BOOT": "Spring Boot",
    "SPRING FRAMEWORK": "Spring Boot",
    "JAVA": "Java",
    "CORE JAVA": "Java",
    "JAVA 8": "Java",
    "DSA": "DSA",
    "DATA STRUCTURES": "DSA",
    "DATA STRUCTURES & ALGORITHMS": "DSA",
    "DATA STRUCTURES AND ALGORITHMS": "DSA",
    "SQL": "SQL",
    "MYSQL": "SQL",
    "POSTGRESQL": "SQL",
    "DATABASE": "SQL",
    "PYTHON": "Python",
    "PYTHON 3": "Python",
    "REACT": "React",
    "REACTJS": "React",
    "REACT.JS": "React",
    "ML": "Machine Learning",
    "MACHINE LEARNING": "Machine Learning",
    "COMMUNICATION": "Communication",
    "COMMUNICATION SKILLS": "Communication",
    "SOFT SKILLS": "Communication",
    "APTITUDE": "Aptitude",
    "QUANTITATIVE APTITUDE": "Aptitude",
    "CODING": "Coding",
    "CODING ASSESSMENTS": "Coding",
    "OOP": "Java",
    "OBJECT ORIENTED PROGRAMMING": "Java",
    "GIT": "REST API",
}

def normalize_skill_name(raw_name: str, db: Session = None) -> str:
    cleaned = raw_name.strip().upper()
    if cleaned in ALIAS_MAP:
        return ALIAS_MAP[cleaned]
    
    if db:
        alias_entry = db.query(SkillAlias).filter(SkillAlias.alias.ilike(raw_name.strip())).first()
        if alias_entry and alias_entry.skill:
            return alias_entry.skill.canonical_name
            
        skill_entry = db.query(Skill).filter(Skill.name.ilike(raw_name.strip())).first()
        if skill_entry:
            return skill_entry.canonical_name

    # Capitalize title case fallback
    return raw_name.strip().title()

def get_or_create_skill(db: Session, raw_name: str) -> Skill:
    canonical_name = normalize_skill_name(raw_name, db)
    skill = db.query(Skill).filter(Skill.canonical_name == canonical_name).first()
    if not skill:
        skill = Skill(name=canonical_name, canonical_name=canonical_name, category="Technical")
        db.add(skill)
        db.commit()
        db.refresh(skill)
    return skill
