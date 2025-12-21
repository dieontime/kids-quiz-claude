"""
Flask application entry point for development.
Run this file to start the development server.
"""
import os
from app import create_app
from app.extensions import db

# Get environment from ENV variable or default to development
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()

    # Run the development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
