"""
User model for the Kids Quiz App.
Stores user profiles for progress tracking.
"""
from datetime import datetime
from app.extensions import db


class User(db.Model):
    """User model"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    age_group = db.Column(db.Enum('5-7', '8-10', '11-13', name='age_group_enum'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    quiz_attempts = db.relationship('QuizAttempt', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username} ({self.age_group})>'

    def to_dict(self):
        """Convert user to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'username': self.username,
            'ageGroup': self.age_group,
            'createdAt': self.created_at.isoformat(),
            'lastActive': self.last_active.isoformat()
        }
