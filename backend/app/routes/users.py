"""
User routes for the Kids Quiz App.
"""
from flask import Blueprint, jsonify, request
from app.services.user_service import UserService
from app.exceptions import ValidationError, NotFoundError

bp = Blueprint('users', __name__, url_prefix='/api/users')


@bp.route('', methods=['POST'])
def create_user():
    """
    Create a new user.
    Request body: {username, ageGroup}
    """
    try:
        data = request.get_json()

        if 'username' not in data or 'ageGroup' not in data:
            return jsonify({'error': 'Missing username or ageGroup'}), 400

        user_service = UserService()
        user = user_service.create_user(
            username=data['username'],
            age_group=data['ageGroup']
        )

        return jsonify(user.to_dict()), 201

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile by ID"""
    try:
        user_service = UserService()
        user = user_service.get_user(user_id)
        return jsonify(user.to_dict()), 200

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:user_id>/attempts', methods=['GET'])
def get_user_attempts(user_id):
    """
    Get user's quiz attempts.
    Query parameters: limit, offset, categoryId, difficulty
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        category_id = request.args.get('categoryId', type=int)
        difficulty = request.args.get('difficulty')

        user_service = UserService()
        attempts = user_service.get_user_attempts(
            user_id=user_id,
            limit=limit,
            offset=offset,
            category_id=category_id,
            difficulty=difficulty
        )

        return jsonify([attempt.to_dict() for attempt in attempts]), 200

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Get aggregate statistics for a user"""
    try:
        user_service = UserService()
        stats = user_service.get_user_stats(user_id)
        return jsonify(stats), 200

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
