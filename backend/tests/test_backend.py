import pytest
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.services.normalization_service import normalize_skill_name
from app.services.eligibility_engine import evaluate_job_eligibility

def test_password_hashing():
    raw_pass = "2300030042"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password("2300030042", hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_tokens():
    payload = {"sub": "2300030042", "role": "STUDENT"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "2300030042"
    assert decoded["role"] == "STUDENT"

def test_skill_normalization():
    assert normalize_skill_name("JS") == "JavaScript"
    assert normalize_skill_name("SPRING BOOT") == "Spring Boot"
    assert normalize_skill_name("RESTful API") == "REST API"
    assert normalize_skill_name("Core Java") == "Java"
    assert normalize_skill_name("Data Structures & Algorithms") == "DSA"
