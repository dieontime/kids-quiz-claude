"""
Service for quiz session management, scoring, and progress tracking.
"""
from datetime import datetime
from flask import current_app
from app.extensions import db
from app.models.quiz_attempt import QuizAttempt
from app.models.user_answer import UserAnswer
from app.models.user import User
from app.services.trivia_api_service import TriviaApiService
from app.services.category_service import CategoryService
from app.utils.constants import AGE_TO_DIFFICULTY
from app.exceptions import ValidationError, NotFoundError

# Module-level cache for active quiz sessions (persists across requests)
_active_sessions = {}


class QuizService:
    """
    Service for quiz session management, scoring, and progress tracking.
    """

    def __init__(self):
        self.trivia_api = TriviaApiService()
        self.category_service = CategoryService()

    def start_quiz(self, user_id, category_id, difficulty, question_count):
        """
        Start a new quiz session.

        Args:
            user_id: User ID
            category_id: Category ID from Open Trivia DB
            difficulty: 'easy', 'medium', or 'hard'
            question_count: Number of questions

        Returns:
            tuple: (attempt_id, questions)

        Raises:
            NotFoundError: If user not found
            ValidationError: If validation fails
        """
        # Validate user exists
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")

        # Validate category is appropriate for user's age group
        if not self.category_service.is_category_appropriate(category_id, user.age_group):
            raise ValidationError(f"Category {category_id} not appropriate for age group {user.age_group}")

        # Validate difficulty matches age group
        expected_difficulty = AGE_TO_DIFFICULTY.get(user.age_group)
        if difficulty != expected_difficulty:
            current_app.logger.warning(
                f"Difficulty mismatch: user age {user.age_group} should use {expected_difficulty}, got {difficulty}"
            )

        # Fetch questions from API
        questions = self.trivia_api.fetch_questions(
            category_id=category_id,
            difficulty=difficulty,
            amount=question_count,
            question_type='multiple'
        )

        if not questions:
            raise ValidationError("No questions available for this category/difficulty")

        # Create quiz attempt record
        attempt = QuizAttempt(
            user_id=user_id,
            category_id=category_id,
            category_name=self.category_service.get_category_name(category_id),
            difficulty=difficulty,
            question_count=len(questions),
            total_questions=len(questions),
            start_time=datetime.utcnow()
        )

        db.session.add(attempt)
        db.session.commit()

        # Cache questions in memory for this session
        _active_sessions[attempt.id] = {
            'questions': questions,
            'answered_count': 0
        }

        # Update user's last active time
        user.last_active = datetime.utcnow()
        db.session.commit()

        return attempt.id, questions

    def submit_answer(self, attempt_id, question_index, user_answer, time_spent=None):
        """
        Submit an answer for a question.

        Args:
            attempt_id: Quiz attempt ID
            question_index: Index of the question being answered
            user_answer: User's answer
            time_spent: Optional time spent on question in seconds

        Returns:
            dict: Result info with 'correct' and 'correctAnswer'

        Raises:
            NotFoundError: If attempt not found
            ValidationError: If validation fails
        """
        # Get attempt
        attempt = QuizAttempt.query.get(attempt_id)
        if not attempt:
            raise NotFoundError(f"Quiz attempt {attempt_id} not found")

        if attempt.completed:
            raise ValidationError("Quiz already completed")

        # Get cached questions
        session = _active_sessions.get(attempt_id)
        if not session:
            raise ValidationError("Quiz session expired or not found")

        questions = session['questions']
        if question_index < 0 or question_index >= len(questions):
            raise ValidationError(f"Invalid question index: {question_index}")

        question = questions[question_index]
        correct_answer = question['correctAnswer']
        is_correct = user_answer == correct_answer

        # Create user answer record
        answer = UserAnswer(
            attempt_id=attempt_id,
            question_text=question['questionText'],
            question_type=question['questionType'],
            correct_answer=correct_answer,
            user_answer=user_answer,
            is_correct=is_correct,
            time_spent_seconds=time_spent,
            answered_at=datetime.utcnow()
        )

        db.session.add(answer)

        # Update attempt statistics
        if is_correct:
            attempt.correct_answers += 1

        session['answered_count'] += 1

        db.session.commit()

        return {
            'correct': is_correct,
            'correctAnswer': correct_answer,
            'explanation': None  # Could add explanations in future
        }

    def complete_quiz(self, attempt_id):
        """
        Complete a quiz session and calculate final score.

        Args:
            attempt_id: Quiz attempt ID

        Returns:
            dict: Quiz results with score and answers

        Raises:
            NotFoundError: If attempt not found
            ValidationError: If quiz already completed
        """
        attempt = QuizAttempt.query.get(attempt_id)
        if not attempt:
            raise NotFoundError(f"Quiz attempt {attempt_id} not found")

        if attempt.completed:
            raise ValidationError("Quiz already completed")

        # Mark as completed
        attempt.completed = True
        attempt.end_time = datetime.utcnow()

        # Calculate score (percentage)
        if attempt.total_questions > 0:
            attempt.score = int((attempt.correct_answers / attempt.total_questions) * 100)

        db.session.commit()

        # Clean up session cache
        if attempt_id in _active_sessions:
            del _active_sessions[attempt_id]

        # Get all answers for review
        answers = UserAnswer.query.filter_by(attempt_id=attempt_id).all()

        return {
            'attemptId': attempt.id,
            'score': attempt.score,
            'correctAnswers': attempt.correct_answers,
            'totalQuestions': attempt.total_questions,
            'percentage': attempt.score,
            'completed': True,
            'answers': [ans.to_dict() for ans in answers]
        }

    def get_active_questions(self, attempt_id):
        """
        Get questions for an active quiz session.

        Args:
            attempt_id: Quiz attempt ID

        Returns:
            list: List of questions

        Raises:
            NotFoundError: If session not found
        """
        session = _active_sessions.get(attempt_id)
        if not session:
            raise NotFoundError("Quiz session not found or expired")
        return session['questions']

    def get_attempt(self, attempt_id):
        """
        Get quiz attempt by ID.

        Args:
            attempt_id: Quiz attempt ID

        Returns:
            QuizAttempt: Quiz attempt object

        Raises:
            NotFoundError: If attempt not found
        """
        attempt = QuizAttempt.query.get(attempt_id)
        if not attempt:
            raise NotFoundError(f"Quiz attempt {attempt_id} not found")
        return attempt
