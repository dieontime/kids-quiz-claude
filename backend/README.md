# Kids Quiz Backend

Flask-based REST API for a kid-friendly quiz application with real-time question fetching from the Open Trivia Database.

## Features

- 🎯 RESTful API with 10 endpoints
- 🌐 Real-time question fetching from Open Trivia DB (no hardcoded questions)
- 👶 Kid-friendly content filtering (7 approved categories)
- 🎚️ Age-appropriate difficulty mapping (5-7, 8-10, 11-13)
- ⏱️ Token bucket rate limiter (1 request per 5 seconds)
- 🔄 HTML entity decoding and answer shuffling
- 📊 User progress tracking and statistics
- 💾 SQLite database with 3 models
- 🧪 Comprehensive test coverage

## Tech Stack

- **Framework:** Flask 3.0.0
- **Database:** SQLite with SQLAlchemy ORM
- **Migrations:** Flask-Migrate (Alembic)
- **External API:** Open Trivia Database (https://opentdb.com)
- **Python:** 3.11+

## Quick Start

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dieontime/kids-quiz-claude.git
   cd kids-quiz-claude/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv

   # On Windows
   venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database**
   ```bash
   python init_db.py
   ```

   This creates `quiz.db` with all necessary tables.

5. **Run the development server**
   ```bash
   python app.py
   ```

   Server will start on http://localhost:5000

### Verify Installation

Test the health check endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Kids Quiz API",
  "version": "1.0.0"
}
```

## Project Structure

```
backend/
├── app.py                          # Development entry point
├── wsgi.py                         # Production entry point
├── config.py                       # Configuration (dev/test/prod)
├── init_db.py                      # Database initialization
├── requirements.txt                # Python dependencies
├── quiz.db                         # SQLite database (gitignored)
│
├── app/
│   ├── __init__.py                 # App factory
│   ├── extensions.py               # Flask extensions
│   ├── exceptions.py               # Custom exceptions
│   │
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── user.py                 # User model
│   │   ├── quiz_attempt.py         # QuizAttempt model
│   │   └── user_answer.py          # UserAnswer model
│   │
│   ├── services/                   # Business logic layer
│   │   ├── trivia_api_service.py   # Open Trivia DB integration
│   │   ├── category_service.py     # Content filtering
│   │   ├── quiz_service.py         # Quiz session management
│   │   └── user_service.py         # User management
│   │
│   ├── routes/                     # API endpoints (Blueprints)
│   │   ├── health.py               # Health check
│   │   ├── categories.py           # Category endpoints
│   │   ├── quiz.py                 # Quiz session endpoints
│   │   └── users.py                # User endpoints
│   │
│   └── utils/                      # Utility modules
│       ├── rate_limiter.py         # Token bucket rate limiter
│       ├── constants.py            # App constants
│       └── validators.py           # Custom validators
│
└── tests/                          # Test suite
    └── conftest.py                 # Pytest fixtures
```

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# Flask environment
FLASK_ENV=development

# Secret key for sessions
SECRET_KEY=your-secret-key-here

# Database URL (optional, defaults to sqlite:///quiz.db)
DATABASE_URL=sqlite:///quiz.db

# Open Trivia DB settings (optional)
TRIVIA_API_BASE_URL=https://opentdb.com
TRIVIA_API_RATE_LIMIT=5
TRIVIA_API_TIMEOUT=10

# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Configuration Modes

The app supports three configuration modes:

- **Development** (`development`): Debug enabled, SQL logging on
- **Testing** (`testing`): In-memory database, rate limiting disabled
- **Production** (`production`): Debug off, SQL logging off

Set via `FLASK_ENV` environment variable or `config_name` parameter.

## Database Schema

### User
- `id`: Primary key
- `username`: Unique username (max 50 chars)
- `age_group`: Enum ('5-7', '8-10', '11-13')
- `created_at`: Timestamp
- `last_active`: Timestamp

### QuizAttempt
- `id`: Primary key
- `user_id`: Foreign key to User
- `category_id`: Open Trivia DB category ID
- `category_name`: Category name (for display)
- `difficulty`: Enum ('easy', 'medium', 'hard')
- `question_count`: Number of questions
- `start_time`: Quiz start timestamp
- `end_time`: Quiz end timestamp (nullable)
- `completed`: Boolean
- `score`: Percentage score (0-100)
- `total_questions`: Total questions
- `correct_answers`: Number of correct answers

**Indexes:**
- `(user_id, completed)` - For filtering completed quizzes
- `(user_id, start_time)` - For recent activity queries

### UserAnswer
- `id`: Primary key
- `attempt_id`: Foreign key to QuizAttempt
- `question_text`: Question text (stored for history)
- `question_type`: Enum ('multiple', 'boolean')
- `correct_answer`: Correct answer
- `user_answer`: User's submitted answer
- `is_correct`: Boolean
- `time_spent_seconds`: Time taken (nullable)
- `answered_at`: Submission timestamp

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference including:
- All endpoints with request/response examples
- Data models
- Error handling
- Rate limiting information
- Complete workflow examples

### Quick API Overview

**Base URL:** `http://localhost:5000/api`

**Endpoints:**
- `GET /health` - Health check
- `GET /categories` - List categories
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `GET /users/:id/attempts` - Quiz history
- `GET /users/:id/stats` - User statistics
- `POST /quiz/start` - Start quiz
- `POST /quiz/:id/answer` - Submit answer
- `POST /quiz/:id/complete` - Complete quiz
- `GET /quiz/:id/questions` - Get questions

## Development

### Running in Development Mode

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run with Flask development server
python app.py
```

The server will:
- Run on http://localhost:5000
- Auto-reload on code changes
- Log SQL queries to console
- Enable debug mode

### Database Migrations

Initialize migrations (only once):
```bash
flask db init
```

Create a migration after model changes:
```bash
flask db migrate -m "Description of changes"
```

Apply migrations:
```bash
flask db upgrade
```

Rollback last migration:
```bash
flask db downgrade
```

### Testing

Run all tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

Run specific test file:
```bash
pytest tests/test_services.py
```

### Code Quality

Format code with Black:
```bash
black .
```

Lint with flake8:
```bash
flake8 .
```

Type checking with pylint:
```bash
pylint app/
```

## Production Deployment

### Using Gunicorn

1. **Install Gunicorn** (already in requirements.txt)
   ```bash
   pip install gunicorn
   ```

2. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
   ```

   Options:
   - `-w 4`: 4 worker processes
   - `-b 0.0.0.0:5000`: Bind to all interfaces on port 5000

3. **With environment variables**
   ```bash
   FLASK_ENV=production SECRET_KEY=your-secret-key gunicorn wsgi:app
   ```

### Production Checklist

- [ ] Set `FLASK_ENV=production`
- [ ] Set strong `SECRET_KEY` environment variable
- [ ] Configure production database (if not using SQLite)
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS
- [ ] Configure CORS for production frontend URL
- [ ] Set up logging and monitoring
- [ ] Configure database backups
- [ ] Set appropriate rate limits

## Architecture

### Service Layer Pattern

The backend uses a service layer architecture:

```
Routes (API) → Services (Business Logic) → Models (Data) → Database
```

**Benefits:**
- Separation of concerns
- Testable business logic
- Reusable service methods
- Clean API controllers

### Open Trivia DB Integration

**Flow:**
1. Client requests quiz via `POST /quiz/start`
2. Backend checks rate limiter (waits if needed)
3. Fetches questions from Open Trivia DB API
4. Decodes HTML entities (e.g., `&quot;` → `"`)
5. Shuffles answers randomly
6. Caches questions in memory
7. Creates QuizAttempt record
8. Returns questions to client

**Rate Limiting:**
- Token bucket algorithm
- Module-level cache (persists across requests)
- 5-second minimum between API calls
- Automatic queuing and delay

**Content Filtering:**
- Only 7 pre-approved categories
- Age-appropriate validation
- Difficulty mapping by age group

### Session Management

Quiz sessions are cached in memory:

```python
_active_sessions = {
  attempt_id: {
    'questions': [...],
    'answered_count': 0
  }
}
```

**Lifecycle:**
1. Created on `quiz/start`
2. Accessed on `quiz/:id/answer`
3. Cleaned up on `quiz/:id/complete`

**Note:** In-memory cache is lost on server restart. For production, consider Redis or similar.

## Troubleshooting

### Common Issues

**1. Database locked error**
```
sqlite3.OperationalError: database is locked
```
**Solution:** SQLite has limited concurrency. For high traffic, use PostgreSQL.

**2. Rate limiting delays**
```
Waiting 5 seconds before next quiz start
```
**Solution:** This is expected behavior. Open Trivia DB limits 1 request per 5 seconds.

**3. Import errors**
```
ModuleNotFoundError: No module named 'flask'
```
**Solution:** Activate virtual environment and install dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**4. Quiz session expired error**
```
{"error": "Quiz session expired or not found"}
```
**Solution:** Session cache was cleared (server restart). Start a new quiz.

### Debug Mode

Enable debug mode for detailed error messages:

```python
# app.py
if __name__ == '__main__':
    app.run(debug=True)
```

### Logging

Check logs for detailed error information:
- Development: Logs printed to console
- Production: Configure logging to file

## Performance Considerations

### Bottlenecks

1. **Open Trivia DB API** - 5-second rate limit
2. **SQLite** - Limited concurrency for writes
3. **In-memory cache** - Lost on restart

### Optimizations

1. **Caching:**
   - Category list cached (rarely changes)
   - Consider Redis for session cache

2. **Database:**
   - Indexes on frequently queried columns
   - Use connection pooling for PostgreSQL

3. **API Calls:**
   - Fetch maximum questions (50) when possible
   - Implement exponential backoff for retries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pytest`)
5. Format code (`black .`)
6. Commit (`git commit -m 'Add amazing feature'`)
7. Push (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is part of the Kids Quiz App educational project.

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Project Overview](../CLAUDE.md) - Full project architecture and planning
- [Frontend Documentation](../frontend/README.md) - Frontend setup (coming soon)

## Support

- **Issues:** https://github.com/dieontime/kids-quiz-claude/issues
- **Documentation:** See CLAUDE.md for detailed project information

---

**Built with Flask and Open Trivia Database** 🎯
