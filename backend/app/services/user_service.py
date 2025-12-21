"""
Service for user management and statistics.
"""
from datetime import datetime
from sqlalchemy import func, desc
from app.extensions import db
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.exceptions import ValidationError, NotFoundError
from app.utils.constants import VALID_AGE_GROUPS


class UserService:
    """
    Service for user management and statistics.
    """

    def create_user(self, username, age_group):
        """
        Create a new user.

        Args:
            username: Unique username (max 50 chars)
            age_group: Age group ('5-7', '8-10', '11-13')

        Returns:
            User: Created user object

        Raises:
            ValidationError: If validation fails
        """
        # Validate inputs
        if not username or len(username) > 50:
            raise ValidationError("Username must be between 1 and 50 characters")

        if age_group not in VALID_AGE_GROUPS:
            raise ValidationError(f"Age group must be one of: {', '.join(VALID_AGE_GROUPS)}")

        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            raise ValidationError(f"Username '{username}' already exists")

        # Create user
        user = User(
            username=username,
            age_group=age_group,
            created_at=datetime.utcnow(),
            last_active=datetime.utcnow()
        )

        db.session.add(user)
        db.session.commit()

        return user

    def get_user(self, user_id):
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User: User object

        Raises:
            NotFoundError: If user not found
        """
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        return user

    def get_user_by_username(self, username):
        """
        Get user by username.

        Args:
            username: Username

        Returns:
            User: User object or None
        """
        return User.query.filter_by(username=username).first()

    def get_user_attempts(self, user_id, limit=20, offset=0, category_id=None, difficulty=None):
        """
        Get user's quiz attempts with optional filtering.

        Args:
            user_id: User ID
            limit: Maximum number of results (default: 20)
            offset: Number of results to skip (default: 0)
            category_id: Optional filter by category ID
            difficulty: Optional filter by difficulty

        Returns:
            list: List of QuizAttempt objects

        Raises:
            NotFoundError: If user not found
        """
        user = self.get_user(user_id)

        query = QuizAttempt.query.filter_by(user_id=user_id)

        # Apply filters
        if category_id is not None:
            query = query.filter_by(category_id=category_id)

        if difficulty is not None:
            query = query.filter_by(difficulty=difficulty)

        # Order by start time descending (most recent first)
        query = query.order_by(desc(QuizAttempt.start_time))

        # Apply pagination
        query = query.limit(limit).offset(offset)

        return query.all()

    def get_user_stats(self, user_id):
        """
        Get aggregate statistics for a user.

        Args:
            user_id: User ID

        Returns:
            dict: Statistics including total quizzes, avg score, favorite category, etc.

        Raises:
            NotFoundError: If user not found
        """
        user = self.get_user(user_id)

        # Get completed attempts only
        completed_attempts = QuizAttempt.query.filter_by(
            user_id=user_id,
            completed=True
        ).all()

        if not completed_attempts:
            return {
                'totalQuizzes': 0,
                'avgScore': 0,
                'totalQuestions': 0,
                'correctAnswers': 0,
                'accuracyRate': 0,
                'favoriteCategory': None,
                'recentActivity': []
            }

        # Calculate statistics
        total_quizzes = len(completed_attempts)
        total_score = sum(attempt.score for attempt in completed_attempts)
        avg_score = round(total_score / total_quizzes, 1) if total_quizzes > 0 else 0

        total_questions = sum(attempt.total_questions for attempt in completed_attempts)
        correct_answers = sum(attempt.correct_answers for attempt in completed_attempts)
        accuracy_rate = round((correct_answers / total_questions) * 100, 1) if total_questions > 0 else 0

        # Find favorite category (most played)
        category_counts = {}
        for attempt in completed_attempts:
            cat_id = attempt.category_id
            cat_name = attempt.category_name
            if cat_id not in category_counts:
                category_counts[cat_id] = {'name': cat_name, 'count': 0}
            category_counts[cat_id]['count'] += 1

        favorite_category = None
        if category_counts:
            fav_cat_id = max(category_counts, key=lambda k: category_counts[k]['count'])
            favorite_category = {
                'id': fav_cat_id,
                'name': category_counts[fav_cat_id]['name'],
                'timesPlayed': category_counts[fav_cat_id]['count']
            }

        # Get recent activity (last 5 attempts)
        recent_attempts = sorted(
            completed_attempts,
            key=lambda x: x.start_time,
            reverse=True
        )[:5]
        recent_activity = [attempt.to_dict() for attempt in recent_attempts]

        return {
            'totalQuizzes': total_quizzes,
            'avgScore': avg_score,
            'totalQuestions': total_questions,
            'correctAnswers': correct_answers,
            'accuracyRate': accuracy_rate,
            'favoriteCategory': favorite_category,
            'recentActivity': recent_activity
        }

    def update_last_active(self, user_id):
        """
        Update user's last active time.

        Args:
            user_id: User ID
        """
        user = self.get_user(user_id)
        user.last_active = datetime.utcnow()
        db.session.commit()
