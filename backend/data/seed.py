"""Database seed script for Phase 1.
Seeds one admin and one student test account if they do not already exist.
"""
from backend.database import engine, SessionLocal, Base
import backend.models.db_models
from backend.models.db_models import Role, User
from backend.services.user_service import create_user, get_user_by_username

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Admin Account
        admin = get_user_by_username(db, "admin")
        if not admin:
            admin = create_user(
                db,
                email="admin@university.edu",
                username="admin",
                password="AdminPassword123!",
                role=Role.ADMIN,
                full_name="Academic Administrator",
                program="Faculty of Science & Computing",
            )
            print(f"[*] Seeded Admin: {admin.username} ({admin.email})")
        else:
            print(f"[=] Admin already exists: {admin.username}")

        # Seed Student Account
        student = get_user_by_username(db, "student")
        if not student:
            student = create_user(
                db,
                email="student@university.edu",
                username="student",
                password="StudentPassword123!",
                role=Role.STUDENT,
                full_name="Alex Rivera",
                program="B.S. Computer Science",
            )
            print(f"[*] Seeded Student: {student.username} ({student.email})")
        else:
            print(f"[=] Student already exists: {student.username}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
