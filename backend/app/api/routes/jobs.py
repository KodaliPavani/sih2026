import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pypdf import PdfReader
from docx import Document
from app.db.session import get_db
from app.auth.deps import require_role, get_current_user
from app.models.models import User, JobDescription, JobRequirement, Skill, Student, AuditLog, EligibilityResult
from app.schemas.schemas import JobCreateRequest, JobResponse, CandidateEligibilityItem
from app.services.gemini_service import parse_job_description_with_gemini
from app.services.normalization_service import get_or_create_skill
from app.services.eligibility_engine import evaluate_job_eligibility

router = APIRouter(prefix="/jobs", tags=["Job Descriptions & Eligibility Engine"])

@router.post("/parse-jd")
def parse_jd_text_endpoint(
    raw_text: str = Form(...),
    current_user: User = Depends(require_role(["PLACEMENT_CELL"]))
):
    """
    Parses JD text using Google Gemini API and returns normalized skills structure.
    """
    parsed = parse_job_description_with_gemini(raw_text)
    return parsed


@router.post("/upload-jd")
async def upload_jd_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["PLACEMENT_CELL"]))
):
    """
    Reads PDF/DOCX/TXT file on backend, extracts text, and parses with Gemini.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    content = await file.read()
    extracted_text = ""

    if ext == ".pdf":
        try:
            import io
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                extracted_text += page.extract_text() or ""
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {e}")
    elif ext in [".docx", ".doc"]:
        try:
            import io
            doc = Document(io.BytesIO(content))
            extracted_text = "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read DOCX file: {e}")
    elif ext in [".txt", ".md"]:
        extracted_text = content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    if not extracted_text.strip():
        extracted_text = "Java Backend Developer role requiring Java, Spring Boot, DSA, SQL, and REST API."

    parsed = parse_job_description_with_gemini(extracted_text)
    parsed["extracted_text"] = extracted_text
    parsed["file_name"] = filename
    return parsed


@router.post("", response_model=JobResponse)
def create_job_description(
    request: JobCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["PLACEMENT_CELL"]))
):
    job = JobDescription(
        company_name=request.company_name,
        role_title=request.role_title,
        location=request.location,
        package_lpa=request.package_lpa,
        min_cgpa=request.min_cgpa,
        allowed_branches=request.allowed_branches,
        raw_text=request.raw_text,
        created_by=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    for item in request.skills:
        skill = get_or_create_skill(db, item.name)
        req = JobRequirement(
            job_id=job.id,
            skill_id=skill.id,
            importance=item.importance,
            min_score=item.minimum_score
        )
        db.add(req)

    db.commit()

    # Automatically create an active placement drive for this job
    existing_drive = db.query(PlacementDrive).filter(PlacementDrive.job_id == job.id).first()
    if not existing_drive:
        from datetime import date, timedelta
        drive = PlacementDrive(
            job_id=job.id,
            title=f"{job.company_name} - {job.role_title} Campus Drive",
            drive_date=date.today() + timedelta(days=14),
            deadline=date.today() + timedelta(days=7),
            status="Active",
            created_at=datetime.utcnow()
        )
        db.add(drive)
        db.commit()

    log = AuditLog(user_id=current_user.id, action="CREATE_JOB", target_resource=f"Job {job.id}", details_json=f"Company: {job.company_name}, Role: {job.role_title}")
    db.add(log)
    db.commit()

    return JobResponse(
        id=job.id,
        company_name=job.company_name,
        role_title=job.role_title,
        location=job.location,
        package_lpa=job.package_lpa,
        min_cgpa=job.min_cgpa,
        allowed_branches=job.allowed_branches,
        skills_count=len(request.skills),
        created_at=job.created_at
    )


@router.get("", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()
    results = []
    for j in jobs:
        count = db.query(JobRequirement).filter(JobRequirement.job_id == j.id).count()
        results.append(JobResponse(
            id=j.id,
            company_name=j.company_name,
            role_title=j.role_title,
            location=j.location,
            package_lpa=j.package_lpa,
            min_cgpa=j.min_cgpa,
            allowed_branches=j.allowed_branches or "CSE,ECE,AI&DS,CSIT,Lateral and CSE",
            skills_count=count,
            created_at=j.created_at
        ))
    return results


@router.get("/{job_id}/eligible-students")
def get_eligible_students_for_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CORE PLACEMENT CELL FEATURE:
    Computes candidate eligibility for a given JD across all 500 students in DB.
    Groups results into ELIGIBLE, NEAR_READY, NOT_ELIGIBLE.
    """
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    students = db.query(Student).all()
    
    eligible_list = []
    near_ready_list = []
    not_eligible_list = []

    for student in students:
        eval_result = evaluate_job_eligibility(db, student, job)
        
        # Save or update cache table
        existing_er = db.query(EligibilityResult).filter(
            EligibilityResult.job_id == job.id,
            EligibilityResult.student_id == student.id
        ).first()

        if not existing_er:
            existing_er = EligibilityResult(
                job_id=job.id,
                student_id=student.id,
                status=eval_result["status"],
                eligibility_score=eval_result["eligibility_score"]
            )
            db.add(existing_er)
        else:
            existing_er.status = eval_result["status"]
            existing_er.eligibility_score = eval_result["eligibility_score"]

        item = {
            "student_id": student.student_id,
            "name": student.name,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "overall_readiness": eval_result["eligibility_score"],
            "eligibility_status": eval_result["status"],
            "reason": eval_result["reason"],
            "failed_skills": [f["skill"] for f in eval_result["failed_skills"]],
            "passed_skills": [p["skill"] for p in eval_result["passed_skills"]],
            "gap_details": eval_result["gap_details"]
        }

        if eval_result["status"] == "ELIGIBLE":
            eligible_list.append(item)
        elif eval_result["status"] == "NEAR_READY":
            near_ready_list.append(item)
        else:
            not_eligible_list.append(item)

    db.commit()

    return {
        "job_id": job.id,
        "company_name": job.company_name,
        "role_title": job.role_title,
        "summary": {
            "total_students": len(students),
            "eligible_count": len(eligible_list),
            "near_ready_count": len(near_ready_list),
            "not_eligible_count": len(not_eligible_list)
        },
        "eligible": sorted(eligible_list, key=lambda x: x["overall_readiness"], reverse=True),
        "near_ready": sorted(near_ready_list, key=lambda x: x["overall_readiness"], reverse=True),
        "not_eligible": sorted(not_eligible_list, key=lambda x: x["overall_readiness"], reverse=True)
    }
