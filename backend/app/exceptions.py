"""
Custom exception classes for the Kids Quiz App.
"""


class AppError(Exception):
    """Base application error"""

    def __init__(self, message, code=500):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ValidationError(AppError):
    """Validation error (400)"""

    def __init__(self, message):
        super().__init__(message, code=400)


class NotFoundError(AppError):
    """Resource not found (404)"""

    def __init__(self, message):
        super().__init__(message, code=404)


class TriviaAPIError(AppError):
    """Open Trivia DB API error"""

    def __init__(self, message, code=500):
        super().__init__(message, code=code)
