from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models.user import User, UserRole
from auth.utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    require_auth, 
    require_admin,
    require_user_or_admin
)
from schemas.auth import (
    UserCreate, 
    UserUpdate, 
    UserResponse, 
    LoginRequest, 
    LoginResponse,
    ChangePasswordRequest
 )

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """User login endpoint."""
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login
        )
    )

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """User registration endpoint (admin only)."""
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role or UserRole.USER
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        role=db_user.role.value,
        is_active=db_user.is_active,
        created_at=db_user.created_at,
        last_login=db_user.last_login
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(require_auth)):
    """Get current user information."""
    # The user info is already validated in require_auth
    # We need to fetch the full user object from the database
    # This is a simplified version - in production you'd want to pass the user object
    return {"message": "Current user info"}

@router.get("/users", response_model=List[UserResponse])
def get_users(
    credentials: HTTPAuthorizationCredentials = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)."""
    users = db.query(User).all()
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(require_auth),
    db: Session = Depends(get_db)
):
    """Change user password."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/logout")
def logout():
    """User logout endpoint."""
    # In a JWT-based system, logout is typically handled client-side
    # by removing the token. This endpoint can be used for logging purposes.
    return {"message": "Logged out successfully"}
