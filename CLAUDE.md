# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kids Quiz App is an interactive educational quiz application designed for children. The app features:
- **Frontend**: React with TypeScript - Child-friendly UI with colorful, engaging components
- **Backend**: Python (Flask) - Handles quiz logic, scoring, and progress tracking
- **Database**: SQLite (lightweight, file-based database) - Stores user progress and scores only
- **Question Source**: Open Trivia Database API (free, no hardcoded questions)

### Core Features
- Multiple quiz categories (Math, Science, Language, General Knowledge, etc.)
- Age-appropriate questions with difficulty levels fetched from Open Trivia DB API
- Interactive quiz-taking experience with immediate feedback
- Progress tracking and score history
- Colorful, engaging UI designed for kids
- Safe and simple user experience

### Architecture Decision: API-First Approach
Instead of hardcoding questions in the database, this app fetches questions on-demand from the **Open Trivia Database** (https://opentdb.com), a free trivia API. This approach:
- **Simplifies implementation** - No need to create/manage question database
- **Always fresh content** - Questions come directly from a maintained API
- **Reduces database size** - Only stores user progress, not questions
- **Scalable** - Can fetch unlimited questions on-demand
- **Maintainable** - API handles content updates

## Development Commands

### Frontend (React + TypeScript)

```bash
# Install dependencies
cd frontend
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run single test file
npm test -- path/to/test.test.tsx

# Lint
npm run lint

# Type check
npm run type-check
```

### Backend (Python)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
# or
uvicorn main:app --reload  # If using FastAPI

# Run tests
pytest

# Run single test file
pytest tests/test_file.py

# Run specific test
pytest tests/test_file.py::test_function_name

# Run tests with coverage
pytest --cov=. --cov-report=html

# Lint
flake8 .
# or
pylint app/

# Format code
black .

# Database migrations (if using Flask-Migrate)
flask db init           # Initialize migrations
flask db migrate -m "description"  # Create migration
flask db upgrade        # Apply migrations
flask db downgrade      # Rollback migration

# Initialize database
python init_db.py       # Run database initialization script
```

## Open Trivia Database API Integration

### API Overview
- **Base URL**: https://opentdb.com
- **Cost**: Free, no API key required
- **Rate Limit**: 1 request per 5 seconds per IP address
- **Max Questions**: 50 questions per API call
- **Question Types**: Multiple choice, True/False
- **Difficulty Levels**: Easy, Medium, Hard
- **Categories**: 24+ categories available

### Key API Endpoints

**Fetch Questions:**
```
GET https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple
```
Parameters:
- `amount`: Number of questions (1-50)
- `category`: Category ID (optional)
- `difficulty`: easy, medium, hard (optional)
- `type`: multiple, boolean (optional)

**Fetch Categories:**
```
GET https://opentdb.com/api_category.php
```
Returns list of all available categories with IDs.

### Rate Limiting Strategy

Since the API allows only 1 request per 5 seconds:

1. **Backend Rate Limiter**: Implement token bucket algorithm in `backend/utils/rate_limiter.py`
2. **Service Layer**: `TriviaApiService` waits before making API calls if needed
3. **User Experience**: Show friendly loading messages while waiting
4. **Optimization**: Fetch maximum questions (50) per request when possible
5. **Caching**: Cache category list as it changes infrequently

### HTML Entity Decoding

The API returns questions with HTML entities (e.g., `&quot;`, `&#039;`, `&amp;`).

**Backend Solution (Primary):**
- Decode in `backend/services/trivia_api_service.py` using Python's `html.unescape()`
- Ensures all questions are clean before sending to frontend

**Frontend Solution (Backup):**
- Client-side decoder in `frontend/src/utils/htmlDecoder.ts`
- Fallback in case backend misses any entities

### Kid-Friendly Content Filtering

Not all API categories are appropriate for kids. The backend filters and maps categories:

**Approved Categories:**
```python
KID_FRIENDLY_CATEGORIES = {
    9: {'name': 'General Knowledge', 'ages': ['5-7', '8-10', '11-13'], 'icon': 'brain'},
    17: {'name': 'Science & Nature', 'ages': ['8-10', '11-13'], 'icon': 'leaf'},
    19: {'name': 'Mathematics', 'ages': ['8-10', '11-13'], 'icon': 'calculator'},
    22: {'name': 'Geography', 'ages': ['8-10', '11-13'], 'icon': 'globe'},
    23: {'name': 'History', 'ages': ['11-13'], 'icon': 'scroll'},
    27: {'name': 'Animals', 'ages': ['5-7', '8-10', '11-13'], 'icon': 'paw'},
    32: {'name': 'Cartoons & Animations', 'ages': ['5-7', '8-10'], 'icon': 'tv'}
}
```

**Blocked Categories:**
```python
BLOCKED_CATEGORIES = [24, 26]  # Politics, Celebrities - not kid-appropriate
```

### Age-to-Difficulty Mapping

Map user age groups to API difficulty levels:

```python
AGE_TO_DIFFICULTY = {
    '5-7': 'easy',      # Simple vocabulary, basic concepts
    '8-10': 'medium',   # Reading comprehension required
    '11-13': 'hard'     # Complex reasoning and abstract thinking
}
```

### Error Handling

**API Response Codes:**
- `0`: Success
- `1`: No results (category exhausted for given difficulty)
- `2`: Invalid parameter
- `3`: Token not found
- `4`: Token empty

**Backend Error Handling:**
```python
@app.errorhandler(TriviaAPIError)
def handle_trivia_error(error):
    if error.code == 1:
        return jsonify({'error': 'No more questions available. Try a different category!'}), 404
    elif error.code == 429:  # Rate limit
        return jsonify({'error': 'Please wait a moment before starting another quiz!'}), 429
    else:
        return jsonify({'error': 'Unable to fetch questions. Try again!'}), 503
```

### Implementation Details

**Backend Service** (`backend/services/trivia_api_service.py`):
```python
class TriviaApiService:
    def fetch_questions(self, category_id, difficulty, amount, question_type='multiple'):
        # Check rate limiter
        self.rate_limiter.wait_if_needed()

        # Make API call
        response = requests.get(f'{API_BASE}/api.php', params={
            'amount': amount,
            'category': category_id,
            'difficulty': difficulty,
            'type': question_type
        })

        # Decode HTML entities
        questions = self._decode_html_entities(response.json()['results'])

        # Shuffle answers (mix correct + incorrect)
        questions = self._shuffle_answers(questions)

        return questions
```

**Frontend API Call** (`frontend/src/api/quizApi.ts`):
```typescript
export const quizApi = {
  startQuiz: async (userId: number, categoryId: number, difficulty: Difficulty, count: number) => {
    // Backend handles API call to Open Trivia DB
    const response = await apiClient.post('/quiz/start', {
      userId,
      categoryId,
      difficulty,
      questionCount: count
    });
    return response.data; // Returns { attemptId, questions[] }
  }
};
```

## Architecture

### High-Level Structure

The application follows a client-server architecture with clear separation between frontend and backend:

- **Frontend**: React SPA that communicates with the backend via REST API
- **Backend**: Python API server that handles business logic and data persistence
- **Communication**: HTTP/REST with JSON payloads

### Frontend Architecture

- **Component Structure**: Feature-based organization with shared components
- **File Organization**: Each component uses separate files:
  - `Component.tsx` - Component logic and JSX
  - `Component.module.scss` or `Component.module.less` - Component styles (prefer SCSS/LESS)
  - `Component.test.tsx` - Jest unit tests
- **State Management**: Context API for global state, local state for component-specific data
- **API Layer**: Centralized API client for backend communication
- **Type Safety**: TypeScript interfaces mirror backend data models
- **Testing**: Jest for unit tests, one test file per component
- **Kid-Friendly Design Principles**:
  - Large, easy-to-click buttons and interactive elements
  - Bright, cheerful color schemes
  - Clear, simple language appropriate for target age group
  - Visual feedback for interactions (animations, sounds)
  - Progress indicators to keep kids engaged
  - Encouraging messages and positive reinforcement

### Backend Architecture

- **Routing**: RESTful endpoints organized by resource
- **Business Logic**: Service layer pattern separates concerns from route handlers
- **Data Layer**: SQLAlchemy ORM for database abstraction with SQLite
- **Database**: SQLite file-based database (stored in project root or designated folder)
- **Validation**: Request/response validation using Pydantic (FastAPI) or marshmallow (Flask)

### Database (SQLite)

- **ORM**: SQLAlchemy for object-relational mapping
- **Migrations**: Flask-Migrate (Alembic) for database schema versioning
- **Location**: Database file typically stored as `database.db` or `app.db`
- **Models**: Define database tables as Python classes inheriting from `db.Model`
- **Queries**: Use SQLAlchemy query API for database operations

### Data Models for Quiz App (Simplified Schema)

Since questions are fetched from the Open Trivia Database API, we only need **3 models** for tracking user progress:

1. **User**
   - `id` (Primary Key)
   - `username` (unique, max 50 chars)
   - `age_group` (enum: '5-7', '8-10', '11-13')
   - `created_at` (datetime)
   - `last_active` (datetime)
   - Stores user profiles for progress tracking

2. **QuizAttempt**
   - `id` (Primary Key)
   - `user_id` (Foreign Key to User)
   - `category_id` (Open Trivia DB category ID from API)
   - `category_name` (stored for display in history)
   - `difficulty` (enum: easy, medium, hard)
   - `question_count` (number of questions in quiz)
   - `start_time` (datetime)
   - `end_time` (datetime, nullable)
   - `completed` (boolean, default False)
   - `score` (integer, default 0)
   - `total_questions` (integer)
   - `correct_answers` (integer, default 0)
   - Tracks each quiz session with scoring

3. **UserAnswer**
   - `id` (Primary Key)
   - `attempt_id` (Foreign Key to QuizAttempt)
   - `question_text` (text, stored for history review)
   - `question_type` (enum: multiple, boolean)
   - `correct_answer` (string)
   - `user_answer` (string)
   - `is_correct` (boolean)
   - `time_spent_seconds` (integer, nullable)
   - `answered_at` (datetime)
   - Records each answer for detailed review

**Why This Schema?**
- **No Question/Answer tables**: Questions come from API, not stored locally
- **No Category table**: Categories fetched from API, filtered by backend
- **No Quiz table**: Each attempt creates its own session
- **Simplified**: Only store what's needed for user progress and history

### API Communication

- Frontend makes requests to backend API endpoints
- Backend returns JSON responses
- Authentication handled via JWT tokens or session cookies (optional for user progress)
- CORS configured to allow frontend origin during development

### API Endpoints for Quiz App

Backend acts as a proxy to Open Trivia DB API, handling rate limits, content filtering, and progress tracking.

**Categories**
- `GET /api/categories` - List kid-friendly categories from Open Trivia DB
- `GET /api/categories?ageGroup=8-10` - Filter categories by age group
  - Response: `[{ id, name, description, icon, kidFriendly, ageGroups[] }]`

**Quiz Session** (Backend fetches questions from API)
- `POST /api/quiz/start` - Fetch questions from API and create attempt
  - Body: `{ userId, categoryId, difficulty, questionCount }`
  - Backend calls Open Trivia DB API, decodes HTML, shuffles answers
  - Creates QuizAttempt record
  - Response: `{ attemptId, questions[] }`

- `POST /api/quiz/:attemptId/answer` - Submit answer for a question
  - Body: `{ questionIndex, userAnswer }`
  - Validates answer, creates UserAnswer record
  - Response: `{ correct, correctAnswer }`

- `POST /api/quiz/:attemptId/complete` - Complete quiz and get results
  - Calculates final score, updates QuizAttempt
  - Response: `{ score, totalQuestions, percentage, results[] }`

- `GET /api/quiz/:attemptId/questions` - Get questions for active session
  - Returns cached questions from current attempt

**User Management**
- `POST /api/users` - Create new user
  - Body: `{ username, ageGroup }`
  - Response: User object

- `GET /api/users/:id` - Get user profile

**User Progress**
- `GET /api/users/:id/attempts` - Get user's quiz history
  - Query params: `limit`, `offset`, `category?`, `difficulty?`
  - Response: Paginated list of quiz attempts

- `GET /api/users/:id/stats` - Get aggregate statistics
  - Response: `{ totalQuizzes, avgScore, favoriteCategory, totalQuestions, accuracyRate, recentActivity }`

## Key Patterns

### Creating Frontend Components

When creating a new React component, create the following files:

1. **Component file** (`ComponentName.tsx`):
   - Contains the component logic and JSX
   - Imports styles from the style file
   - Exports the component
   - **If file exceeds 200 lines**: Split into two files:
     - `ComponentName.tsx` - JSX with React elements and HTML only
     - `ComponentName.logic.ts` - TypeScript code without JSX (hooks, handlers, utilities)

2. **Style file** (`ComponentName.module.scss` or `ComponentName.module.less`):
   - Use SCSS or LESS for enhanced CSS features
   - Use CSS modules for scoped styling
   - Keep styles specific to this component

3. **Test file** (`ComponentName.test.tsx`):
   - Jest unit tests for the component
   - Test component rendering, user interactions, and edge cases
   - Mock API calls and external dependencies
   - Import mock data from separate JSON file

4. **Mock data file** (`ComponentName.mockData.json`):
   - Store all mock data used in tests
   - Keeps test files clean and focused on test logic
   - Reusable across multiple test cases

Example structure (simple component):
```
components/
  QuizCard/
    QuizCard.tsx
    QuizCard.module.scss
    QuizCard.test.tsx
    QuizCard.mockData.json
```

Example structure (large component > 200 lines):
```
components/
  QuizPlayer/
    QuizPlayer.tsx              # JSX and rendering only
    QuizPlayer.logic.ts         # TypeScript logic, hooks, handlers, timer
    QuizPlayer.module.scss
    QuizPlayer.test.tsx
    QuizPlayer.mockData.json
```

### Key Components for Quiz App

Common components you'll build:
- **QuizCard**: Display quiz information in list/grid views
- **QuizPlayer**: Main quiz-taking interface with questions and answers
- **QuestionDisplay**: Renders different question types (multiple choice, true/false)
- **ScoreBoard**: Shows quiz results and performance
- **ProgressTracker**: Visual progress indicator during quiz
- **CategorySelector**: Browse and select quiz categories
- **Timer**: Optional countdown timer for timed quizzes

### Frontend-Backend Integration

When adding new features:
1. Define database models (SQLAlchemy) if new data entities are needed
2. Create and apply database migrations for schema changes
3. Define TypeScript interfaces for request/response types
4. Create backend endpoint with matching data structure
5. Implement service layer logic in backend (including database operations)
6. Create API client method in frontend
7. Build React components that consume the API

### Quiz-Specific Business Logic

**API Integration** (`backend/services/trivia_api_service.py`)
- Fetch questions from Open Trivia DB API on-demand
- Implement rate limiting (1 request per 5 seconds)
- Decode HTML entities in questions and answers
- Shuffle answer options (combine correct + incorrect answers)
- Cache category list for performance
- Handle API errors gracefully

**Content Filtering** (`backend/services/category_service.py`)
- Filter to kid-appropriate categories only
- Block inappropriate content (politics, celebrities)
- Map categories to age groups
- Map age groups to difficulty levels

**Scoring System** (`backend/services/quiz_service.py`)
- Calculate scores based on correct answers
- Track accuracy rate and performance metrics
- Store attempt history for progress tracking
- Generate quiz statistics

**Quiz Session Management**
- Track quiz state (in_progress, completed, abandoned)
- Validate answer submissions
- Store questions temporarily during active quiz session
- Calculate final results on completion

**Data Flow: Starting a Quiz**
```
1. Frontend: User selects category, difficulty, count
2. Frontend: POST /api/quiz/start
3. Backend: Check rate limiter, wait if needed
4. Backend: Call Open Trivia DB API
5. Backend: Decode HTML entities, shuffle answers
6. Backend: Create QuizAttempt record in database
7. Backend: Return { attemptId, questions[] }
8. Frontend: Display first question in QuizPlayer
```

**Kid-Friendly Features**
- Age-appropriate content filtering via category service
- Positive feedback and encouragement messages
- Visual progress indicators to maintain engagement
- Immediate feedback on correct/incorrect answers
- Celebration animations for achievements

### Error Handling

- Frontend: Display user-friendly error messages, handle network failures
- Backend: Return appropriate HTTP status codes with error details in JSON

### Working with the Database

When modifying database schema:
1. Update SQLAlchemy model classes in the backend
2. Create a migration: `flask db migrate -m "description of changes"`
3. Review the generated migration file in `migrations/versions/`
4. Apply the migration: `flask db upgrade`
5. Update any affected TypeScript interfaces in frontend

Database file (`*.db`) should be added to `.gitignore` - only commit schema migrations, not the database itself.

### Development Workflow

1. Start backend server first (frontend depends on API)
2. Start frontend dev server
3. Frontend proxy configured to route API calls to backend
4. Hot reload enabled for both frontend and backend during development

### Development Priorities for Quiz App

When building features, follow this order:

1. **Backend Setup & API Integration** (Day 1-2)
   - Set up Flask application structure
   - Implement `trivia_api_service.py` with rate limiting
   - Implement `category_service.py` with kid-friendly filtering
   - Test API connectivity and HTML decoding

2. **Simplified Database** (Day 2)
   - Create 3 models: User, QuizAttempt, UserAnswer
   - Initialize database with Flask-Migrate
   - No question/answer tables needed (API-first approach)

3. **Backend API Endpoints** (Day 2-3)
   - Categories endpoint (filtered, kid-appropriate)
   - Quiz session endpoints (start, answer, complete)
   - User progress endpoints (attempts, stats)

4. **Frontend Setup** (Day 3-4)
   - Set up React + TypeScript with Vite
   - Create TypeScript interfaces matching backend models
   - Implement API client with axios
   - Create contexts (UserContext, QuizContext)

5. **Quiz Components** (Day 5-7)
   - CategorySelector - display kid-friendly categories
   - DifficultySelector - age-appropriate difficulty
   - QuizPlayer - main quiz interface
   - QuestionDisplay, AnswerOptions, ScoreBoard

6. **Pages & Navigation** (Day 8)
   - Home, CategorySelection, QuizPlay, Results pages
   - React Router setup

7. **Integration & Polish** (Day 9-10)
   - End-to-end testing
   - Error handling
   - Loading states
   - Animations and transitions
   - Responsive design

### No Sample Data Needed

Since questions come from the Open Trivia Database API:
- **No seed data required** for questions/quizzes
- **No content management** interface needed
- **Only create test users** for development
- API provides 4000+ questions across 24+ categories
- Content is always fresh and up-to-date

### Testing the API Integration

Use these API endpoints for testing:

```bash
# Test fetching 10 easy general knowledge questions
curl "https://opentdb.com/api.php?amount=10&category=9&difficulty=easy"

# Test fetching categories
curl "https://opentdb.com/api_category.php"

# Test multiple choice questions only
curl "https://opentdb.com/api.php?amount=10&type=multiple&difficulty=medium"
```

## Benefits of API-First Approach

### Why Use Open Trivia DB Instead of Hardcoding Questions?

**Implementation Benefits:**
- **80% Less Database Complexity**: Only 3 models instead of 7
- **No Content Management Needed**: No admin interface to create/edit questions
- **Faster Development**: Skip question creation, focus on quiz experience
- **Simpler Codebase**: Less code to write, test, and maintain

**Content Benefits:**
- **4000+ Questions Available**: Vast question library from day one
- **Always Fresh**: API maintained by community, content updates automatically
- **Multiple Categories**: 24+ categories covering various topics
- **Multiple Difficulty Levels**: Easy, medium, hard for all age groups
- **Quality Content**: Community-vetted questions and answers

**Operational Benefits:**
- **Zero Content Costs**: Free API, no content licensing needed
- **No Moderation Required**: API already filters and manages content
- **Scalable**: Can handle unlimited quiz sessions
- **Small Database**: Only stores user progress, not questions

**User Experience Benefits:**
- **Variety**: Users get different questions each time
- **Never Stale**: Always new content to explore
- **Immediate Availability**: No waiting for content creation

### Trade-offs to Consider

**Dependencies:**
- Requires internet connection to fetch questions
- Subject to API availability (99%+ uptime historically)
- Must respect rate limits (1 request per 5 seconds)

**Content Control:**
- Limited customization of questions
- Dependent on API's content filtering
- Can't add completely custom questions (yet)

**Mitigation Strategies:**
- Backend caching for frequently accessed categories
- Graceful error handling when API unavailable
- Clear user messaging during loading
- Future enhancement: Add custom question capability alongside API

### Recommended Approach

**Current Implementation:** 100% API-based
- Simplest to implement
- Gets you to MVP fastest
- Best for learning and initial launch

**Future Enhancement (Optional):**
- Add custom question tables for teacher/parent-created content
- Hybrid approach: Fetch from API OR local database
- Best of both worlds: API variety + custom content

## Resources

**Open Trivia Database:**
- Website: https://opentdb.com
- API Documentation: https://opentdb.com/api_config.php
- GitHub: Community-maintained question database

**Alternative Quiz APIs (for reference):**
- The Trivia API: https://the-trivia-api.com
- API Ninjas Trivia: https://api-ninjas.com/api/trivia
- jService (Jeopardy): https://jservice.io

**React + Flask Resources:**
- Flask Documentation: https://flask.palletsprojects.com
- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs
