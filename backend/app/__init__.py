"""
Flask application factory.
"""
from flask import Flask, jsonify
from config import config
from app.extensions import db, migrate, cors


def create_app(config_name='development'):
    """
    Flask application factory.

    Args:
        config_name: Configuration to use ('development', 'testing', 'production')

    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Import models (needed for migrations)
    from app.models import user, quiz_attempt, user_answer

    # Register blueprints (will be added after creating routes)
    register_blueprints(app)

    # Error handlers
    register_error_handlers(app)

    return app


def register_blueprints(app):
    """Register Flask blueprints"""
    try:
        from app.routes import health, categories, quiz, users
        app.register_blueprint(health.bp)
        app.register_blueprint(categories.bp)
        app.register_blueprint(quiz.bp)
        app.register_blueprint(users.bp)
    except ImportError:
        # Routes not created yet, skip registration
        pass


def register_error_handlers(app):
    """Register error handlers"""
    from app.exceptions import AppError

    @app.errorhandler(AppError)
    def handle_app_error(error):
        return jsonify({'error': error.message}), error.code

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
