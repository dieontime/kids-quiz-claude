"""
Service for interacting with Open Trivia Database API.
Handles rate limiting, HTML decoding, and answer shuffling.
"""
import requests
import html
import random
from flask import current_app
from app.exceptions import TriviaAPIError
from app.utils.rate_limiter import TokenBucketRateLimiter
from app.utils.constants import TRIVIA_API_CODES


class TriviaApiService:
    """
    Service for interacting with Open Trivia Database API.
    Handles rate limiting, HTML decoding, and answer shuffling.
    """

    def __init__(self):
        self.rate_limiter = TokenBucketRateLimiter(
            rate_limit_seconds=current_app.config.get('TRIVIA_API_RATE_LIMIT', 5)
        )
        self.base_url = current_app.config.get('TRIVIA_API_BASE_URL', 'https://opentdb.com')
        self.timeout = current_app.config.get('TRIVIA_API_TIMEOUT', 10)

    def fetch_categories(self):
        """
        Fetch all categories from Open Trivia DB API.

        Returns:
            list: List of category dictionaries with id and name

        Raises:
            TriviaAPIError: If API request fails
        """
        try:
            response = requests.get(
                f'{self.base_url}/api_category.php',
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()
            return data.get('trivia_categories', [])
        except requests.RequestException as e:
            raise TriviaAPIError(f"Failed to fetch categories: {str(e)}", code=500)

    def fetch_questions(self, category_id, difficulty, amount, question_type='multiple'):
        """
        Fetch questions from Open Trivia DB API.

        Args:
            category_id: Category ID from Open Trivia DB
            difficulty: 'easy', 'medium', or 'hard'
            amount: Number of questions (1-50)
            question_type: 'multiple' or 'boolean'

        Returns:
            list: List of processed question dictionaries

        Raises:
            TriviaAPIError: If API request fails or returns error code
        """
        # Wait if necessary to respect rate limit
        wait_time = self.rate_limiter.wait_if_needed()
        if wait_time > 0:
            current_app.logger.info(f"Rate limit: waited {wait_time:.2f}s")

        try:
            params = {
                'amount': min(amount, 50),  # Max 50 per request
                'category': category_id,
                'difficulty': difficulty,
                'type': question_type
            }

            response = requests.get(
                f'{self.base_url}/api.php',
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            data = response.json()

            # Check response code
            response_code = data.get('response_code', -1)
            if response_code != 0:
                error_message = TRIVIA_API_CODES.get(response_code, 'Unknown error')
                raise TriviaAPIError(error_message, code=response_code)

            questions = data.get('results', [])

            # Process questions: decode HTML and shuffle answers
            processed_questions = [
                self._process_question(q) for q in questions
            ]

            return processed_questions

        except requests.RequestException as e:
            raise TriviaAPIError(f"Failed to fetch questions: {str(e)}", code=500)

    def _process_question(self, question_data):
        """
        Process a single question: decode HTML entities and shuffle answers.

        Args:
            question_data: Raw question data from API

        Returns:
            dict: Processed question with decoded text and shuffled answers
        """
        # Decode HTML entities
        question_text = html.unescape(question_data['question'])
        correct_answer = html.unescape(question_data['correct_answer'])
        incorrect_answers = [html.unescape(ans) for ans in question_data['incorrect_answers']]

        # Combine and shuffle all answers
        all_answers = [correct_answer] + incorrect_answers
        random.shuffle(all_answers)

        return {
            'questionText': question_text,
            'questionType': question_data['type'],
            'difficulty': question_data['difficulty'],
            'category': question_data['category'],
            'correctAnswer': correct_answer,
            'allAnswers': all_answers,
            'answerCount': len(all_answers)
        }
