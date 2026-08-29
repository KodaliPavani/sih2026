from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.schemas import LoginRequest, TokenResponse, ResetPasswordRequest, UserResponse
from app.models.models import User, Student, PlacementCellUser, AuditLog
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    username = request.username.strip()
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    student_id = None
    name = user.username
    if user.role == "STUDENT":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            student_id = student.student_id
            name = student.name
    elif user.role == "PLACEMENT_CELL":
        pc = db.query(PlacementCellUser).filter(PlacementCellUser.user_id == user.id).first()
        if pc:
            name = pc.name
    elif user.role == "TRAINER":
        username_low = user.username.lower()
        if "dsa" in username_low:
            name = "Prof. K. Sharma (Placement Faculty)"
        elif "spring" in username_low:
            name = "Er. V. Verma (Industry Mentor)"
        elif "sql" in username_low:
            name = "Dr. P. Kodali (Database Lead)"
        else:
            name = "Head Technical Trainer"


    access_token = create_access_token(data={"sub": user.username, "role": user.role, "user_id": user.id})

    # Log login action
    log = AuditLog(user_id=user.id, action="USER_LOGIN", details_json=f"Role: {user.role}, FirstLogin: {user.first_login}")
    db.add(log)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        first_login=user.first_login,
        user_id=user.id,
        student_id=student_id,
        name=name
    )

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match")
    
    if len(request.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    current_user.password_hash = get_password_hash(request.new_password)
    current_user.first_login = False
    current_user.password_changed_at = datetime.utcnow()
    
    log = AuditLog(user_id=current_user.id, action="PASSWORD_RESET", details_json="First login password reset successful")
    db.add(log)
    db.commit()

    return {"message": "Password updated successfully. You can now access your dashboard."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        first_login=current_user.first_login,
        password_changed_at=current_user.password_changed_at
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = AuditLog(user_id=current_user.id, action="USER_LOGOUT")
    db.add(log)
    db.commit()
    return {"message": "Logged out successfully"}
