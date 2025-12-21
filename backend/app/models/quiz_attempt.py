"""
QuizAttempt model for the Kids Quiz App.
Tracks each quiz session with scoring.
"""
from datetime import datetime
from app.extensions import db


class QuizAttempt(db.Model):
    """Quiz attempt model"""
    __tablename__ = 'quiz_attempts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    category_id = db.Column(db.Integer, nullable=False)  # Open Trivia DB category ID
    category_name = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.Enum('easy', 'medium', 'hard', name='difficulty_enum'), nullable=False)
    question_count = db.Column(db.Integer, nullable=False)

    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False)

    score = db.Column(db.Integer, default=0, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, default=0, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='quiz_attempts')
    user_answers = db.relationship('UserAnswer', back_populates='attempt', lazy='dynamic', cascade='all, delete-orphan')

    # Indexes for common queries
    __table_args__ = (
        db.Index('idx_user_completed', 'user_id', 'completed'),
        db.Index('idx_user_start_time', 'user_id', 'start_time'),
    )

    def __repr__(self):
        return f'<QuizAttempt {self.id} - {self.category_name} ({self.difficulty})>'

    def to_dict(self):
        """Convert quiz attempt to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'userId': self.user_id,
            'categoryId': self.category_id,
            'categoryName': self.category_name,
            'difficulty': self.difficulty,
            'questionCount': self.question_count,
            'startTime': self.start_time.isoformat(),
            'endTime': self.end_time.isoformat() if self.end_time else None,
            'completed': self.completed,
            'score': self.score,
            'totalQuestions': self.total_questions,
            'correctAnswers': self.correct_answers,
            'percentage': round((self.correct_answers / self.total_questions) * 100, 1) if self.total_questions > 0 else 0
        }
