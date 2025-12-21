"""
Quiz routes for the Kids Quiz App.
"""
from flask import Blueprint, jsonify, request
from app.services.quiz_service import QuizService
from app.exceptions import ValidationError, NotFoundError, TriviaAPIError

bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')


@bp.route('/start', methods=['POST'])
def start_quiz():
    """
    Start a new quiz session.
    Request body: {userId, categoryId, difficulty, questionCount}
    """
    try:
        data = request.get_json()

        # Validate request
        required_fields = ['userId', 'categoryId', 'difficulty', 'questionCount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        quiz_service = QuizService()
        attempt_id, questions = quiz_service.start_quiz(
            user_id=data['userId'],
            category_id=data['categoryId'],
            difficulty=data['difficulty'],
            question_count=data['questionCount']
        )

        return jsonify({
            'attemptId': attempt_id,
            'questions': questions
        }), 201

    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except TriviaAPIError as e:
        if e.code == 1:
            return jsonify({'error': 'No questions available. Try a different category!'}), 404
        return jsonify({'error': 'Unable to fetch questions. Please try again.'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:attempt_id>/answer', methods=['POST'])
def submit_answer(attempt_id):
    """
    Submit an answer for a question.
    Request body: {questionIndex, userAnswer, timeSpent?}
    """
    try:
        data = request.get_json()

        if 'questionIndex' not in data or 'userAnswer' not in data:
            return jsonify({'error': 'Missing questionIndex or userAnswer'}), 400

        quiz_service = QuizService()
        result = quiz_service.submit_answer(
            attempt_id=attempt_id,
            question_index=data['questionIndex'],
            user_answer=data['userAnswer'],
            time_spent=data.get('timeSpent')
        )

        return jsonify(result), 200

    except (ValidationError, NotFoundError) as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:attempt_id>/complete', methods=['POST'])
def complete_quiz(attempt_id):
    """
    Complete quiz and get results.
    """
    try:
        quiz_service = QuizService()
        results = quiz_service.complete_quiz(attempt_id)
        return jsonify(results), 200

    except (ValidationError, NotFoundError) as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:attempt_id>/questions', methods=['GET'])
def get_questions(attempt_id):
    """
    Get questions for an active session.
    """
    try:
        quiz_service = QuizService()
        questions = quiz_service.get_active_questions(attempt_id)
        return jsonify(questions), 200

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:attempt_id>', methods=['GET'])
def get_attempt(attempt_id):
    """
    Get quiz attempt details.
    """
    try:
        quiz_service = QuizService()
        attempt = quiz_service.get_attempt(attempt_id)
        return jsonify(attempt.to_dict()), 200

    except NotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
