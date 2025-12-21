"""
Category routes for the Kids Quiz App.
"""
from flask import Blueprint, jsonify, request
from app.services.category_service import CategoryService
from app.exceptions import TriviaAPIError

bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@bp.route('', methods=['GET'])
def get_categories():
    """
    Get kid-friendly categories.
    Optional query parameter: ageGroup (e.g., ?ageGroup=8-10)
    """
    try:
        age_group = request.args.get('ageGroup')

        category_service = CategoryService()
        categories = category_service.get_kid_friendly_categories(age_group)

        return jsonify(categories), 200

    except TriviaAPIError as e:
        return jsonify({'error': 'Unable to fetch categories. Please try again.'}), 503
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get information about a specific category"""
    try:
        category_service = CategoryService()
        category_info = category_service.get_category_info(category_id)

        if not category_info:
            return jsonify({'error': 'Category not found'}), 404

        return jsonify(category_info), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
