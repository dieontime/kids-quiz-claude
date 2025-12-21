"""
Flask extensions initialization.
Extensions are initialized here and then initialized in the app factory.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
