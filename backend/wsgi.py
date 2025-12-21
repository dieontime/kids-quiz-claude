"""
WSGI entry point for production deployment.
Use with Gunicorn: gunicorn wsgi:app
"""
import os
from app import create_app

# Create app with production config
env = os.environ.get('FLASK_ENV', 'production')
app = create_app(env)

if __name__ == '__main__':
    app.run()
