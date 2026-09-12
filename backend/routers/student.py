from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.db_models import User, Profile
from backend.schemas import (
    UserOut,
    ProfileOut,
    ProfileUpdate,
    StudentProgress,
    Announcement,
)
from backend.middleware.role_middleware import require_role
from backend.services.audit_service import log_action

router = APIRouter(
    prefix="/student",
    tags=["Student"],
    dependencies=[Depends(require_role("student"))],
)

@router.get("/profile", response_model=UserOut)
def get_student_profile(current_student: User = Depends(require_role("student"))):
    return current_student

@router.patch("/profile", response_model=UserOut)
def update_student_profile(
    req: ProfileUpdate,
    current_student: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
):
    if not current_student.profile:
        current_student.profile = Profile(user_id=current_student.id)

    if req.full_name is not None:
        current_student.profile.full_name = req.full_name
    if req.program is not None:
        current_student.profile.program = req.program

    db.commit()
    db.refresh(current_student)

    log_action(
        db,
        "STUDENT_PROFILE_UPDATED",
        user_id=current_student.id,
        details="Student updated their own profile",
    )
    return current_student

@router.get("/progress", response_model=StudentProgress)
def get_student_progress(current_student: User = Depends(require_role("student"))):
    # Progress overview metrics
    return StudentProgress(
        courses_enrolled=4,
        completed_modules=18,
        average_score=92.5,
        grade_letter="A",
        upcoming_deadlines=[
          {"title": "Cognitive Algorithms Milestone 3", "due_date": "2026-09-18", "course": "CS 401"},
          {"title": "Database Isolation Levels Lab", "due_date": "2026-09-22", "course": "CS 305"},
          {"title": "Distributed Systems Exam Prep", "due_date": "2026-09-28", "course": "CS 450"},
        ],
    )

@router.get("/announcements", response_model=List[Announcement])
def get_student_announcements(current_student: User = Depends(require_role("student"))):
    return [
        Announcement(
            id="ann-1",
            title="Fall Semester Midterm Schedule Released",
            content="Examination periods and room allotments are now available on the academic portal. Check your schedule carefully.",
            published_at="2026-09-10",
            priority="high",
        ),
        Announcement(
            id="ann-2",
            title="Guest Lecture: Scalable Microservices with Groq LPU",
            content="Join us this Thursday at 4 PM in Auditorium Hall B for an industry keynote on sub-second inference architectures.",
            published_at="2026-09-08",
            priority="medium",
        ),
        Announcement(
            id="ann-3",
            title="Library Extended Hours During Quiz Week",
            content="The engineering library will remain open 24/7 starting next Monday through final project submissions.",
            published_at="2026-09-05",
            priority="low",
        ),
    ]
