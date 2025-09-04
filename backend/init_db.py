from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.user import Base, User, UserRole
from auth.utils import get_password_hash

# Database URL
DATABASE_URL = "sqlite:///./school_bell_system.db"

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create tables
def create_tables():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_default_admin():
    """Create a default admin user."""
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if not admin_user:
            # Create default admin user
            admin_user = User(
                username="admin",
                email="admin@school.com",
                hashed_password=get_password_hash("admin123"),  # Change this password!
                role=UserRole.ADMIN,
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            print("Default admin user created successfully!")
            print("Username: admin")
            print("Password: admin123")
            print("IMPORTANT: Change this password after first login!")
        else:
            print("Admin user already exists.")
            
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function to initialize database."""
    print("Initializing School Bell System Database...")
    
    # Create tables
    create_tables()
    
    # Create default admin user
    create_default_admin()
    
    print("Database initialization completed!")

if __name__ == "__main__":
    main()