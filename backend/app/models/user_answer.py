"""
UserAnswer model for the Kids Quiz App.
Records each answer for detailed review.
"""
from datetime import datetime
from app.extensions import db


class UserAnswer(db.Model):
    """User answer model"""
    __tablename__ = 'user_answers'

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('quiz_attempts.id'), nullable=False, index=True)

    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.Enum('multiple', 'boolean', name='question_type_enum'), nullable=False)
    correct_answer = db.Column(db.String(200), nullable=False)
    user_answer = db.Column(db.String(200), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)

    time_spent_seconds = db.Column(db.Integer, nullable=True)
    answered_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    attempt = db.relationship('QuizAttempt', back_populates='user_answers')

    def __repr__(self):
        return f'<UserAnswer {self.id} - {"✓" if self.is_correct else "✗"}>'

    def to_dict(self):
        """Convert user answer to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'attemptId': self.attempt_id,
            'questionText': self.question_text,
            'questionType': self.question_type,
            'correctAnswer': self.correct_answer,
            'userAnswer': self.user_answer,
            'isCorrect': self.is_correct,
            'timeSpentSeconds': self.time_spent_seconds,
            'answeredAt': self.answered_at.isoformat()
        }
