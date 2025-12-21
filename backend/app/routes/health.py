"""
Health check endpoint.
"""
from flask import Blueprint, jsonify

bp = Blueprint('health', __name__, url_prefix='/api')


@bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Kids Quiz API',
        'version': '1.0.0'
    }), 200
