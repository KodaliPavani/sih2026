import os
import random
import bcrypt
import pandas as pd
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.models import (
    User, Student, PlacementCellUser, Skill, SkillAlias, StudentSkill, SkillEvidence,
    JobDescription, JobRequirement, PlacementDrive, TrainingCohort
)
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import calculate_role_readiness_score

FIRST_NAMES = ["Aarav", "Ananya", "Aditya", "Bhavya", "Chetan", "Divya", "Eshan", "Farhan", "Gautam", "Harini", "Ishaan", "Jaya", "Karthik", "Kavya", "Lakshya", "Meera", "Nikhil", "Neha", "Omkar", "Pooja", "Rahul", "Riya", "Sai", "Sneha", "Tarun", "Tanvi", "Utkarsh", "Varun", "Yash", "Zoya"]
LAST_NAMES = ["Sharma", "Verma", "Kodali", "Rao", "Reddy", "Nair", "Patel", "Gupta", "Singh", "Kumar", "Chowdhury", "Joshi", "Deshmukh", "Pillai", "Iyer", "Kulkarni", "Aggarwal", "Mehta", "Bhat"]

ROLES = ["Java Backend Developer", "Full Stack Developer", "Data Analyst", "Python Developer"]

def generate_student_ids():
    students_meta = []
    
    # 1. CSE (120 students): 2300030001 to 2300030120
    for i in range(1, 121):
        s_id = f"230003{i:04d}"
        students_meta.append((s_id, "CSE"))
        
    # 2. Lateral and CSE (80 students): 2300039001 to 2300039080
    for i in range(1, 81):
        s_id = f"2300039{i:03d}"
        students_meta.append((s_id, "Lateral and CSE"))

    # 3. ECE (100 students): 2300040001 to 2300040100
    for i in range(1, 101):
        s_id = f"230004{i:04d}"
        students_meta.append((s_id, "ECE"))

    # 4. AI&DS (100 students): 2300080001 to 2300080100
    for i in range(1, 101):
        s_id = f"230008{i:04d}"
        students_meta.append((s_id, "AI&DS"))

    # 5. CSIT (100 students): 2300090001 to 2300090100
    for i in range(1, 101):
        s_id = f"230009{i:04d}"
        students_meta.append((s_id, "CSIT"))

    return students_meta


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    print("[Import] Initializing seed data & 500 student dataset...")

    # 1. Create Placement Admin Account
    admin_user = db.query(User).filter(User.username == settings.PLACEMENT_ADMIN_ID).first()
    if not admin_user:
        admin_user = User(
            username=settings.PLACEMENT_ADMIN_ID,
            role="PLACEMENT_CELL",
            password_hash=get_password_hash(settings.PLACEMENT_ADMIN_PASSWORD),
            first_login=False
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        pc_profile = PlacementCellUser(
            user_id=admin_user.id,
            name="Placement & Training Cell Admin",
            email="placement@university.edu",
            department="Placement Cell"
        )
        db.add(pc_profile)
        db.commit()

    # Seed Trainer / Faculty Accounts
    trainers_seed = [
        ("trainer", "trainer123", "Head Technical Trainer"),
        ("trainer_dsa", "trainer123", "Prof. K. Sharma (Placement Faculty)"),
        ("trainer_spring", "trainer123", "Er. V. Verma (Industry Mentor)"),
        ("trainer_sql", "trainer123", "Dr. P. Kodali (Database Lead)")
    ]
    for t_user, t_pass, t_name in trainers_seed:
        tr_obj = db.query(User).filter(User.username == t_user).first()
        if not tr_obj:
            tr_obj = User(
                username=t_user,
                role="TRAINER",
                password_hash=get_password_hash(t_pass),
                first_login=False
            )
            db.add(tr_obj)
    db.commit()

    # 2. Canonical Skills Creation
    skill_names = ["Java", "Python", "DSA", "SQL", "Spring Boot", "REST API", "React", "Machine Learning", "Communication", "Aptitude", "Coding"]
    skill_objs = {}
    for name in skill_names:
        skill_objs[name] = get_or_create_skill(db, name)


    # 3. Create Demo Job Descriptions
    abc_job = db.query(JobDescription).filter(JobDescription.company_name == "ABC Technologies").first()
    if not abc_job:
        abc_job = JobDescription(
            company_name="ABC Technologies",
            role_title="Java Backend Developer",
            location="Bangalore",
            package_lpa=8.5,
            min_cgpa=7.0,
            allowed_branches="CSE,ECE,AI&DS,CSIT,Lateral and CSE",
            raw_text="We are hiring Java Backend Developers proficient in Core Java, Spring Boot, REST APIs, SQL, and DSA.",
            created_by=admin_user.id
        )
        db.add(abc_job)
        db.commit()
        db.refresh(abc_job)

        reqs = [
            ("Java", "HIGH", 70.0),
            ("DSA", "HIGH", 65.0),
            ("SQL", "MEDIUM", 60.0),
            ("Spring Boot", "HIGH", 65.0),
            ("REST API", "MEDIUM", 60.0)
        ]
        for s_name, imp, min_s in reqs:
            jr = JobRequirement(job_id=abc_job.id, skill_id=skill_objs[s_name].id, importance=imp, min_score=min_s)
            db.add(jr)
        db.commit()

    # Seed Placement Drives
    if db.query(PlacementDrive).count() == 0:
        from datetime import date, timedelta
        jobs = db.query(JobDescription).all()
        for j in jobs:
            drive = PlacementDrive(
                job_id=j.id,
                title=f"{j.company_name} - {j.role_title} Campus Drive",
                drive_date=date.today() + timedelta(days=14),
                deadline=date.today() + timedelta(days=7),
                status="Active"
            )
            db.add(drive)
        db.commit()

    # Seed Initial Training Cohorts
    from app.models.models import TrainingCohort
    if db.query(TrainingCohort).count() == 0:
        c1 = TrainingCohort(
            skill_id=skill_objs["DSA"].id,
            title="DSA & Algorithmic Problem Solving Cohort",
            description="Intensive practical coding drills on Binary Trees, Dynamic Programming, and Graph algorithms.",
            target_role="Software Engineer",
            instructor="Prof. K. Sharma (Placement Faculty)",
            student_count=45,
            status="Active"
        )
        c2 = TrainingCohort(
            skill_id=skill_objs["Spring Boot"].id,
            title="Spring Boot & Enterprise Microservices Cohort",
            description="Hands-on backend development covering REST controllers, Spring Data JPA, and security.",
            target_role="Java Backend Developer",
            instructor="Er. V. Verma (Industry Mentor)",
            student_count=62,
            status="Active"
        )
        c3 = TrainingCohort(
            skill_id=skill_objs["SQL"].id,
            title="SQL Query Optimization & Database Design Cohort",
            description="Mastering complex JOINs, indexing strategies, and database transaction isolation levels.",
            target_role="Data Analyst",
            instructor="Dr. P. Kodali (Database Lead)",
            student_count=38,
            status="Active"
        )
        db.add_all([c1, c2, c3])
        db.commit()

    # Sync Assessment Questions for all skills
    from app.services.assessment_engine import sync_questions_to_db
    for sk in skill_objs.values():
        sync_questions_to_db(db, sk)


    # 4. Generate 500 Students Data
    students_meta = generate_student_ids()
    excel_records = []

    imported_count = 0

    for s_id, branch in students_meta:
        # Check if already imported
        existing_user = db.query(User).filter(User.username == s_id).first()
        if existing_user:
            continue

        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        email = f"{s_id.lower()}@student.univ.edu"
        cgpa = round(random.uniform(6.2, 9.8), 2)
        target_role = random.choice(ROLES)
        att_pct = round(random.uniform(75.0, 98.0), 1)
        certs = random.randint(1, 6)

        # Special configuration for demo scenario student 2300030042
        if s_id == "2300030042":
            name = "Pavani Kodali"
            cgpa = 8.2
            target_role = "Java Backend Developer"
            skill_scores = {
                "Java": 86.0,
                "SQL": 82.0,
                "DSA": 48.0,
                "Spring Boot": 32.0,
                "REST API": 51.0,
                "Python": 60.0,
                "React": 55.0,
                "Machine Learning": 40.0,
                "Communication": 78.0,
                "Aptitude": 80.0,
                "Coding": 68.0
            }
            overall_r = 52.0
            r_status = "Needs Improvement"
        else:
            skill_scores = {
                "Java": round(random.uniform(35.0, 95.0), 1),
                "Python": round(random.uniform(40.0, 92.0), 1),
                "DSA": round(random.uniform(30.0, 90.0), 1),
                "SQL": round(random.uniform(45.0, 95.0), 1),
                "Spring Boot": round(random.uniform(25.0, 85.0), 1),
                "REST API": round(random.uniform(35.0, 90.0), 1),
                "React": round(random.uniform(30.0, 88.0), 1),
                "Machine Learning": round(random.uniform(20.0, 85.0), 1),
                "Communication": round(random.uniform(60.0, 95.0), 1),
                "Aptitude": round(random.uniform(55.0, 95.0), 1),
                "Coding": round(random.uniform(40.0, 92.0), 1)
            }
            avg_val = sum(skill_scores.values()) / len(skill_scores)
            overall_r = round(avg_val, 1)
            r_status = "Ready" if overall_r >= 75 else ("Near Ready" if overall_r >= 60 else "Needs Improvement")

        # Fast hash default password (student_id) with 4 rounds for fast import
        salt = bcrypt.gensalt(rounds=4)
        pass_hash = bcrypt.hashpw(s_id.encode('utf-8'), salt).decode('utf-8')
        u = User(
            username=s_id,
            role="STUDENT",
            password_hash=pass_hash,
            first_login=True
        )
        db.add(u)
        db.flush()

        st = Student(
            user_id=u.id,
            student_id=s_id,
            name=name,
            branch=branch,
            cgpa=cgpa,
            email=email,
            phone=f"+91 98765{s_id[-5:]}",
            target_role=target_role,
            overall_readiness=overall_r,
            readiness_status=r_status,
            attendance_percent=att_pct,
            certifications_count=certs
        )
        db.add(st)
        db.flush()

        # Seed student_skills and skill_evidence
        for sk_name, score in skill_scores.items():
            sk_obj = skill_objs[sk_name]
            ss = StudentSkill(
                student_id=st.id,
                skill_id=sk_obj.id,
                mastery_score=score,
                confidence="High" if score >= 75 else ("Medium" if score >= 55 else "Low")
            )
            db.add(ss)

            # Verified coding assessment evidence
            ev1 = SkillEvidence(
                student_id=st.id,
                skill_id=sk_obj.id,
                type="Coding Assessment" if sk_name in ["Java", "DSA", "Spring Boot", "Coding"] else "Practical Task",
                source="VERIFIED",
                score=score,
                verified=True,
                weight=1.2,
                description=f"Verified score in {sk_name} assessment"
            )
            db.add(ev1)

        # Save to excel records list
        record = {
            "student_id": s_id,
            "branch": branch,
            "cgpa": cgpa,
            "target_role": target_role,
            "java_score": skill_scores["Java"],
            "python_score": skill_scores["Python"],
            "dsa_score": skill_scores["DSA"],
            "sql_score": skill_scores["SQL"],
            "spring_boot_score": skill_scores["Spring Boot"],
            "rest_api_score": skill_scores["REST API"],
            "react_score": skill_scores["React"],
            "ml_score": skill_scores["Machine Learning"],
            "communication_score": skill_scores["Communication"],
            "aptitude_score": skill_scores["Aptitude"],
            "coding_score": skill_scores["Coding"],
            "attendance_percent": att_pct,
            "certifications_count": certs,
            "overall_readiness": overall_r,
            "readiness_status": r_status
        }
        excel_records.append(record)

        imported_count += 1
        if imported_count % 50 == 0:
            db.commit()
            print(f"[Import] Imported {imported_count}/500 students...")

    db.commit()

    # Save to Excel file sih_placement_student_dataset_500_correct_ids.xlsx
    excel_file_path = "sih_placement_student_dataset_500_correct_ids.xlsx"
    if excel_records:
        df = pd.DataFrame(excel_records)
        df.to_excel(excel_file_path, index=False)
        print(f"[Import] Generated Excel file: {excel_file_path}")

    print("\n========================================================")
    print("IMPORT COMPLETE SUMMARY:")
    print(f"Total Imported Students: {imported_count}")
    print("Branch Breakdown:")
    print("  CSE: 120")
    print("  Lateral and CSE: 80")
    print("  ECE: 100")
    print("  AI&DS: 100")
    print("  CSIT: 100")
    print(f"Default Student Login: Username = 2300030042, Password = 2300030042 (First Login forces reset)")
    print(f"Placement Admin Login: Username = {settings.PLACEMENT_ADMIN_ID}, Password = {settings.PLACEMENT_ADMIN_PASSWORD}")
    print("========================================================\n")

if __name__ == "__main__":
    seed_database()
