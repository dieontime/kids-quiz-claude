"""
Database initialization script.
Run this script to create all database tables.
"""
from app import create_app
from app.extensions import db

if __name__ == '__main__':
    app = create_app('development')

    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ Database initialized successfully!")
        print(f"✓ Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("✓ Tables created: users, quiz_attempts, user_answers")
