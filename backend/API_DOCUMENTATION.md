# Kids Quiz API Documentation

## Overview

The Kids Quiz API is a REST API that provides quiz functionality for children using questions fetched from the Open Trivia Database. The API handles user management, quiz sessions, scoring, and progress tracking.

**Base URL:** `http://localhost:5000/api`

**Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Data Models](#data-models)
5. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Categories](#categories)
   - [Users](#users)
   - [Quiz Sessions](#quiz-sessions)

---

## Authentication

Currently, the API does not require authentication. User identification is handled through user IDs passed in request bodies.

**Future Enhancement:** JWT-based authentication will be added for production use.

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or validation error |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server encountered an error |
| 503 | Service Unavailable | External API unavailable |

### Common Error Responses

**Missing Required Fields (400)**
```json
{
  "error": "Missing required field: userId"
}
```

**Resource Not Found (404)**
```json
{
  "error": "User 999 not found"
}
```

**Validation Error (400)**
```json
{
  "error": "Age group must be one of: 5-7, 8-10, 11-13"
}
```

**API Unavailable (503)**
```json
{
  "error": "Unable to fetch questions. Please try again."
}
```

---

## Rate Limiting

The API implements rate limiting for calls to the Open Trivia Database:

- **Limit:** 1 request per 5 seconds
- **Scope:** Server-wide (affects all quiz start requests)
- **Behavior:** Requests are queued and delayed automatically

When starting a quiz, you may experience a 5-second delay if the previous quiz was started recently.

---

## Data Models

### User

```typescript
interface User {
  id: number;
  username: string;
  ageGroup: '5-7' | '8-10' | '11-13';
  createdAt: string;  // ISO 8601 datetime
  lastActive: string; // ISO 8601 datetime
}
```

### Category

```typescript
interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  kidFriendly: boolean;
  ageGroups: Array<'5-7' | '8-10' | '11-13'>;
}
```

### Quiz Question

```typescript
interface Question {
  questionText: string;
  questionType: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  correctAnswer: string;
  allAnswers: string[];  // Shuffled answers including correct answer
  answerCount: number;
}
```

### Quiz Attempt

```typescript
interface QuizAttempt {
  id: number;
  userId: number;
  categoryId: number;
  categoryName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  startTime: string;     // ISO 8601 datetime
  endTime: string | null; // ISO 8601 datetime
  completed: boolean;
  score: number;          // Percentage (0-100)
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;     // Calculated (correctAnswers / totalQuestions * 100)
}
```

### User Answer

```typescript
interface UserAnswer {
  id: number;
  attemptId: number;
  questionText: string;
  questionType: 'multiple' | 'boolean';
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number | null;
  answeredAt: string;  // ISO 8601 datetime
}
```

### User Statistics

```typescript
interface UserStats {
  totalQuizzes: number;
  avgScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  favoriteCategory: {
    id: number;
    name: string;
    timesPlayed: number;
  } | null;
  recentActivity: QuizAttempt[];
}
```

---

## Endpoints

### Health Check

Check if the API is running and healthy.

#### `GET /health`

**Response (200 OK)**
```json
{
  "status": "healthy",
  "service": "Kids Quiz API",
  "version": "1.0.0"
}
```

**Example**
```bash
curl http://localhost:5000/api/health
```

---

### Categories

#### Get All Kid-Friendly Categories

Retrieve the list of quiz categories appropriate for children.

**`GET /categories`**

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ageGroup | string | No | Filter by age group ('5-7', '8-10', '11-13') |

**Response (200 OK)**
```json
[
  {
    "id": 9,
    "name": "General Knowledge",
    "description": "Fun facts about the world around us!",
    "icon": "brain",
    "kidFriendly": true,
    "ageGroups": ["5-7", "8-10", "11-13"]
  },
  {
    "id": 27,
    "name": "Animals",
    "description": "Learn about amazing creatures!",
    "icon": "paw",
    "kidFriendly": true,
    "ageGroups": ["5-7", "8-10", "11-13"]
  }
]
```

**Available Categories**
- **General Knowledge (9)**: Ages 5-13
- **Science & Nature (17)**: Ages 8-13
- **Mathematics (19)**: Ages 8-13
- **Geography (22)**: Ages 8-13
- **History (23)**: Ages 11-13
- **Animals (27)**: Ages 5-13
- **Cartoons & Animations (32)**: Ages 5-10

**Example**
```bash
# Get all categories
curl http://localhost:5000/api/categories

# Filter by age group
curl "http://localhost:5000/api/categories?ageGroup=8-10"
```

---

#### Get Category by ID

Get detailed information about a specific category.

**`GET /categories/:categoryId`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | integer | Yes | Category ID (path parameter) |

**Response (200 OK)**
```json
{
  "id": 27,
  "name": "Animals",
  "description": "Learn about amazing creatures!",
  "icon": "paw",
  "kidFriendly": true,
  "ageGroups": ["5-7", "8-10", "11-13"]
}
```

**Response (404 Not Found)**
```json
{
  "error": "Category not found"
}
```

**Example**
```bash
curl http://localhost:5000/api/categories/27
```

---

### Users

#### Create User

Create a new user account.

**`POST /users`**

**Request Body**
```json
{
  "username": "kid_player_1",
  "ageGroup": "8-10"
}
```

**Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (max 50 characters) |
| ageGroup | string | Yes | Age group ('5-7', '8-10', '11-13') |

**Response (201 Created)**
```json
{
  "id": 1,
  "username": "kid_player_1",
  "ageGroup": "8-10",
  "createdAt": "2025-12-21T10:30:00.000000",
  "lastActive": "2025-12-21T10:30:00.000000"
}
```

**Response (400 Bad Request)**
```json
{
  "error": "Username 'kid_player_1' already exists"
}
```

**Example**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "kid_player_1", "ageGroup": "8-10"}'
```

---

#### Get User by ID

Retrieve user profile information.

**`GET /users/:userId`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | User ID (path parameter) |

**Response (200 OK)**
```json
{
  "id": 1,
  "username": "kid_player_1",
  "ageGroup": "8-10",
  "createdAt": "2025-12-21T10:30:00.000000",
  "lastActive": "2025-12-21T15:45:00.000000"
}
```

**Response (404 Not Found)**
```json
{
  "error": "User 999 not found"
}
```

**Example**
```bash
curl http://localhost:5000/api/users/1
```

---

#### Get User Quiz History

Retrieve a user's quiz attempt history with optional filtering.

**`GET /users/:userId/attempts`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | User ID (path parameter) |
| limit | integer | No | Number of results (default: 20, max: 100) |
| offset | integer | No | Number to skip for pagination (default: 0) |
| categoryId | integer | No | Filter by category |
| difficulty | string | No | Filter by difficulty ('easy', 'medium', 'hard') |

**Response (200 OK)**
```json
[
  {
    "id": 2,
    "userId": 1,
    "categoryId": 27,
    "categoryName": "Animals",
    "difficulty": "medium",
    "questionCount": 5,
    "startTime": "2025-12-21T15:30:00.000000",
    "endTime": "2025-12-21T15:35:00.000000",
    "completed": true,
    "score": 80,
    "totalQuestions": 5,
    "correctAnswers": 4,
    "percentage": 80.0
  }
]
```

**Example**
```bash
# Get all attempts
curl http://localhost:5000/api/users/1/attempts

# Get paginated results
curl "http://localhost:5000/api/users/1/attempts?limit=10&offset=0"

# Filter by category
curl "http://localhost:5000/api/users/1/attempts?categoryId=27"
```

---

#### Get User Statistics

Get aggregate statistics for a user.

**`GET /users/:userId/stats`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | User ID (path parameter) |

**Response (200 OK)**
```json
{
  "totalQuizzes": 5,
  "avgScore": 72.5,
  "totalQuestions": 25,
  "correctAnswers": 18,
  "accuracyRate": 72.0,
  "favoriteCategory": {
    "id": 27,
    "name": "Animals",
    "timesPlayed": 3
  },
  "recentActivity": [
    {
      "id": 5,
      "userId": 1,
      "categoryId": 27,
      "categoryName": "Animals",
      "difficulty": "medium",
      "score": 80,
      "completed": true,
      "startTime": "2025-12-21T15:30:00.000000",
      "endTime": "2025-12-21T15:35:00.000000"
    }
  ]
}
```

**Example**
```bash
curl http://localhost:5000/api/users/1/stats
```

---

### Quiz Sessions

#### Start New Quiz

Start a new quiz session by fetching questions from the Open Trivia Database API.

**`POST /quiz/start`**

**Request Body**
```json
{
  "userId": 1,
  "categoryId": 27,
  "difficulty": "medium",
  "questionCount": 5
}
```

**Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | integer | Yes | User ID |
| categoryId | integer | Yes | Category ID (from categories endpoint) |
| difficulty | string | Yes | Difficulty level ('easy', 'medium', 'hard') |
| questionCount | integer | Yes | Number of questions (1-50) |

**Note:** Difficulty should match the user's age group:
- Ages 5-7 → `easy`
- Ages 8-10 → `medium`
- Ages 11-13 → `hard`

**Response (201 Created)**
```json
{
  "attemptId": 1,
  "questions": [
    {
      "questionText": "What is the fastest animal?",
      "questionType": "multiple",
      "difficulty": "medium",
      "category": "Animals",
      "correctAnswer": "Peregrine Falcon",
      "allAnswers": [
        "Cheetah",
        "Peregrine Falcon",
        "Golden Eagle",
        "Horsefly"
      ],
      "answerCount": 4
    }
  ]
}
```

**Response (400 Bad Request)**
```json
{
  "error": "Category 27 not appropriate for age group 5-7"
}
```

**Response (404 Not Found)**
```json
{
  "error": "No questions available. Try a different category!"
}
```

**Important Notes:**
- Questions are fetched in real-time from Open Trivia DB
- HTML entities are automatically decoded
- Answers are randomly shuffled
- Questions are cached in memory for the quiz session
- Rate limiting may cause a 5-second delay

**Example**
```bash
curl -X POST http://localhost:5000/api/quiz/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "categoryId": 27,
    "difficulty": "medium",
    "questionCount": 5
  }'
```

---

#### Submit Answer

Submit an answer for a specific question in an active quiz.

**`POST /quiz/:attemptId/answer`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attemptId | integer | Yes | Quiz attempt ID (path parameter) |

**Request Body**
```json
{
  "questionIndex": 0,
  "userAnswer": "Peregrine Falcon",
  "timeSpent": 15
}
```

**Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questionIndex | integer | Yes | Index of the question (0-based) |
| userAnswer | string | Yes | User's selected answer |
| timeSpent | integer | No | Time spent in seconds |

**Response (200 OK)**
```json
{
  "correct": true,
  "correctAnswer": "Peregrine Falcon",
  "explanation": null
}
```

**Response (400 Bad Request)**
```json
{
  "error": "Quiz already completed"
}
```

```json
{
  "error": "Invalid question index: 10"
}
```

```json
{
  "error": "Quiz session expired or not found"
}
```

**Example**
```bash
curl -X POST http://localhost:5000/api/quiz/1/answer \
  -H "Content-Type: application/json" \
  -d '{
    "questionIndex": 0,
    "userAnswer": "Peregrine Falcon",
    "timeSpent": 15
  }'
```

---

#### Complete Quiz

Mark a quiz as completed and retrieve final results.

**`POST /quiz/:attemptId/complete`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attemptId | integer | Yes | Quiz attempt ID (path parameter) |

**Response (200 OK)**
```json
{
  "attemptId": 1,
  "score": 80,
  "correctAnswers": 4,
  "totalQuestions": 5,
  "percentage": 80,
  "completed": true,
  "answers": [
    {
      "id": 1,
      "attemptId": 1,
      "questionText": "What is the fastest animal?",
      "questionType": "multiple",
      "correctAnswer": "Peregrine Falcon",
      "userAnswer": "Peregrine Falcon",
      "isCorrect": true,
      "timeSpentSeconds": 15,
      "answeredAt": "2025-12-21T15:30:15.000000"
    },
    {
      "id": 2,
      "attemptId": 1,
      "questionText": "What is the scientific name for Polar Bear?",
      "questionType": "multiple",
      "correctAnswer": "Ursus Maritimus",
      "userAnswer": "Ursus Arctos",
      "isCorrect": false,
      "timeSpentSeconds": 20,
      "answeredAt": "2025-12-21T15:30:35.000000"
    }
  ]
}
```

**Response (400 Bad Request)**
```json
{
  "error": "Quiz already completed"
}
```

**Example**
```bash
curl -X POST http://localhost:5000/api/quiz/1/complete \
  -H "Content-Type: application/json"
```

---

#### Get Quiz Questions

Retrieve the cached questions for an active quiz session.

**`GET /quiz/:attemptId/questions`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attemptId | integer | Yes | Quiz attempt ID (path parameter) |

**Response (200 OK)**
```json
[
  {
    "questionText": "What is the fastest animal?",
    "questionType": "multiple",
    "difficulty": "medium",
    "category": "Animals",
    "correctAnswer": "Peregrine Falcon",
    "allAnswers": [
      "Cheetah",
      "Peregrine Falcon",
      "Golden Eagle",
      "Horsefly"
    ],
    "answerCount": 4
  }
]
```

**Response (404 Not Found)**
```json
{
  "error": "Quiz session not found or expired"
}
```

**Example**
```bash
curl http://localhost:5000/api/quiz/1/questions
```

---

#### Get Quiz Attempt Details

Retrieve details about a specific quiz attempt.

**`GET /quiz/:attemptId`**

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| attemptId | integer | Yes | Quiz attempt ID (path parameter) |

**Response (200 OK)**
```json
{
  "id": 1,
  "userId": 1,
  "categoryId": 27,
  "categoryName": "Animals",
  "difficulty": "medium",
  "questionCount": 5,
  "startTime": "2025-12-21T15:30:00.000000",
  "endTime": "2025-12-21T15:35:00.000000",
  "completed": true,
  "score": 80,
  "totalQuestions": 5,
  "correctAnswers": 4,
  "percentage": 80.0
}
```

**Response (404 Not Found)**
```json
{
  "error": "Quiz attempt 999 not found"
}
```

**Example**
```bash
curl http://localhost:5000/api/quiz/1
```

---

## Complete Workflow Example

Here's a complete example of the quiz workflow from user creation to quiz completion:

```bash
# 1. Create a user
USER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "test_kid", "ageGroup": "8-10"}')
USER_ID=$(echo $USER_RESPONSE | jq -r '.id')
echo "Created user ID: $USER_ID"

# 2. Get available categories
curl -s http://localhost:5000/api/categories | jq '.[] | {id, name, ageGroups}'

# 3. Start a quiz
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:5000/api/quiz/start \
  -H "Content-Type: application/json" \
  -d "{\"userId\": $USER_ID, \"categoryId\": 27, \"difficulty\": \"medium\", \"questionCount\": 3}")
ATTEMPT_ID=$(echo $QUIZ_RESPONSE | jq -r '.attemptId')
echo "Started quiz, attempt ID: $ATTEMPT_ID"

# 4. Answer questions
curl -s -X POST http://localhost:5000/api/quiz/$ATTEMPT_ID/answer \
  -H "Content-Type: application/json" \
  -d '{"questionIndex": 0, "userAnswer": "Drone", "timeSpent": 10}' | jq '.'

curl -s -X POST http://localhost:5000/api/quiz/$ATTEMPT_ID/answer \
  -H "Content-Type: application/json" \
  -d '{"questionIndex": 1, "userAnswer": "King Cobra", "timeSpent": 12}' | jq '.'

curl -s -X POST http://localhost:5000/api/quiz/$ATTEMPT_ID/answer \
  -H "Content-Type: application/json" \
  -d '{"questionIndex": 2, "userAnswer": "Pugs", "timeSpent": 8}' | jq '.'

# 5. Complete quiz
curl -s -X POST http://localhost:5000/api/quiz/$ATTEMPT_ID/complete \
  -H "Content-Type: application/json" | jq '.score, .percentage'

# 6. Get user statistics
curl -s http://localhost:5000/api/users/$USER_ID/stats | jq '.'
```

---

## External API Integration

### Open Trivia Database

The backend integrates with the Open Trivia Database API (https://opentdb.com) to fetch quiz questions.

**Features:**
- Real-time question fetching (no hardcoded questions)
- 4000+ questions across 24+ categories
- Multiple difficulty levels
- Automatic HTML entity decoding
- Answer shuffling for randomization

**Rate Limiting:**
- Open Trivia DB limits: 1 request per 5 seconds
- Implemented via token bucket algorithm
- Automatic queuing and delay handling

**Content Filtering:**
- Only 7 kid-appropriate categories are exposed
- Politics and celebrities categories are blocked
- Age-appropriate difficulty mapping enforced

---

## Best Practices

### Frontend Integration

1. **User Creation**: Create users once and store the ID locally
2. **Category Selection**: Fetch categories on app load and cache
3. **Quiz Flow**:
   - Start quiz → Store attemptId
   - Submit answers sequentially
   - Complete quiz → Display results
4. **Error Handling**: Always check for error responses and display user-friendly messages
5. **Loading States**: Show loading indicators during API calls, especially for quiz start (may take 5+ seconds)

### Performance Tips

1. Cache category list (changes rarely)
2. Store active attemptId in memory during quiz
3. Pre-fetch user stats after quiz completion
4. Implement exponential backoff for failed requests

---

## Support

For issues or questions:
- GitHub: https://github.com/dieontime/kids-quiz-claude
- Project Documentation: See CLAUDE.md and README.md

---

**Last Updated:** December 21, 2025
**API Version:** 1.0.0
