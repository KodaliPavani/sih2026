import json
import re
import google.generativeai as genai
from typing import Dict, List, Any
from app.core.config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def parse_job_description_with_gemini(jd_text: str) -> Dict[str, Any]:
    """
    Extracts structured requirements from JD text using Google Gemini API.
    Returns Pydantic-compatible JSON payload.
    """
    if not settings.GEMINI_API_KEY:
        # Structured fallback if Gemini API key is missing
        return fallback_jd_parser(jd_text)

    prompt = f"""
    You are an expert technical recruiter and job description parser.
    Extract key technical and domain skills, minimum CGPA, and job role details from the following job description.
    
    Job Description Text:
    \"\"\"
    {jd_text}
    \"\"\"
    
    Respond strictly with valid JSON only in the following format:
    {{
      "role": "Extracted Job Role Title",
      "skills": [
        {{
          "name": "Skill Name (e.g. Java, DSA, SQL, Spring Boot, REST API, React)",
          "importance": "HIGH" | "MEDIUM" | "LOW",
          "minimum_score": 65
        }}
      ],
      "education": ["B.Tech", "B.E."],
      "minimum_cgpa": 6.5,
      "experience": "0-2 years"
    }}
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Extract JSON substring if wrapped in markdown ```json ... ```
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print(f"[Gemini Service Error] Failed to parse JD with Gemini: {e}")
        return fallback_jd_parser(jd_text)


def generate_learning_recommendations_with_gemini(skill_name: str, current_score: float, target_score: float) -> List[Dict[str, Any]]:
    """
    Generates targeted learning recommendations for a skill gap using Google Gemini API.
    """
    gap = round(target_score - current_score, 1)
    
    if not settings.GEMINI_API_KEY:
        return fallback_learning_recommendations(skill_name, current_score, target_score)

    prompt = f"""
    A student has a skill gap in "{skill_name}".
    Current Mastery Score: {current_score}%
    Required Threshold: {target_score}%
    Gap: {gap} points.
    
    Generate 4 practical, sequential learning modules/tasks to bridge this gap.
    Respond strictly with valid JSON array format:
    [
      {{
        "topic": "Module Title",
        "difficulty": "Beginner" | "Intermediate" | "Advanced",
        "estimated_effort": "2 Hours",
        "resource_type": "Video / Hands-on Task / Coding Challenge",
        "outcome": "Specific objective achieved"
      }}
    ]
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        json_match = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print(f"[Gemini Service Error] Failed learning recommendation: {e}")
        return fallback_learning_recommendations(skill_name, current_score, target_score)


def fallback_jd_parser(jd_text: str) -> Dict[str, Any]:
    """Fallback rule-based JD parser when AI is unavailable."""
    text_lower = jd_text.lower()
    
    extracted_skills = []
    skill_keywords = [
        ("Java", "Java", "HIGH", 70),
        ("DSA", "Data Structures", "HIGH", 65),
        ("SQL", "SQL", "MEDIUM", 60),
        ("Spring Boot", "Spring", "HIGH", 65),
        ("REST API", "Rest", "MEDIUM", 60),
        ("React", "React", "MEDIUM", 60),
        ("Python", "Python", "HIGH", 65),
        ("Machine Learning", "Machine Learning", "HIGH", 70)
    ]
    
    for canon_name, kw, imp, min_s in skill_keywords:
        if kw.lower() in text_lower:
            extracted_skills.append({
                "name": canon_name,
                "importance": imp,
                "minimum_score": min_s
            })

    if not extracted_skills:
        extracted_skills = [
            {"name": "Java", "importance": "HIGH", "minimum_score": 70},
            {"name": "DSA", "importance": "HIGH", "minimum_score": 65},
            {"name": "SQL", "importance": "MEDIUM", "minimum_score": 60},
            {"name": "Spring Boot", "importance": "HIGH", "minimum_score": 65},
            {"name": "REST API", "importance": "MEDIUM", "minimum_score": 60}
        ]

    role_title = "Java Backend Developer"
    if "data analyst" in text_lower or "python" in text_lower:
        role_title = "Data Analyst"
    elif "full stack" in text_lower:
        role_title = "Full Stack Developer"

    return {
        "role": role_title,
        "skills": extracted_skills,
        "education": ["B.Tech", "B.E."],
        "minimum_cgpa": 7.0,
        "experience": "0-2 years"
    }


def fallback_learning_recommendations(skill_name: str, current_score: float, target_score: float) -> List[Dict[str, Any]]:
    return [
        {
            "topic": f"{skill_name} Core Fundamentals & Architecture",
            "difficulty": "Beginner",
            "estimated_effort": "2 Hours",
            "resource_type": "Interactive Tutorial",
            "outcome": f"Master core conceptual foundations of {skill_name}."
        },
        {
            "topic": f"Hands-on Implementation & Best Practices",
            "difficulty": "Intermediate",
            "estimated_effort": "3 Hours",
            "resource_type": "Practical Coding Exercise",
            "outcome": f"Build practical modules using {skill_name}."
        },
        {
            "topic": f"Advanced Patterns & Optimization",
            "difficulty": "Intermediate",
            "estimated_effort": "4 Hours",
            "resource_type": "Project Challenge",
            "outcome": f"Implement error handling, security, and clean architecture."
        },
        {
            "topic": f"{skill_name} Mock Reassessment & Verification",
            "difficulty": "Advanced",
            "estimated_effort": "1 Hour",
            "resource_type": "Coding Assessment",
            "outcome": f"Verify mastery score boost to target {target_score}%."
        }
    ]
