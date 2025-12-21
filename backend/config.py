"""
Flask configuration for different environments.
"""
import os
from datetime import timedelta
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent


class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # Open Trivia DB API
    TRIVIA_API_BASE_URL = 'https://opentdb.com'
    TRIVIA_API_RATE_LIMIT = 5  # seconds between requests
    TRIVIA_API_TIMEOUT = 10  # request timeout in seconds

    # CORS
    CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:3000']

    # Cache
    CATEGORY_CACHE_TTL = timedelta(hours=24)  # Categories rarely change
    QUIZ_SESSION_TTL = timedelta(hours=2)  # Active quiz sessions

    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'quiz.db'}"
    SQLALCHEMY_ECHO = True  # Log SQL queries


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # In-memory for tests
    TRIVIA_API_RATE_LIMIT = 0  # Disable rate limiting in tests


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"sqlite:///{BASE_DIR / 'quiz.db'}"
    SQLALCHEMY_ECHO = False

    # Production secret key should be set via environment variable
    # If not set, a warning will be logged but app will still run
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'CHANGE-THIS-IN-PRODUCTION-USE-ENV-VAR'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
