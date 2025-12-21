"""
Token Bucket Rate Limiter for API calls.
Ensures we don't exceed 1 request per 5 seconds (Open Trivia DB limit).
"""
import time
import threading


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter for API calls.
    Thread-safe implementation to ensure rate limits are respected.
    """

    def __init__(self, rate_limit_seconds=5):
        """
        Initialize rate limiter.

        Args:
            rate_limit_seconds: Minimum seconds between requests (default: 5)
        """
        self.rate_limit = rate_limit_seconds
        self.last_request_time = 0
        self.lock = threading.Lock()

    def wait_if_needed(self):
        """
        Block if necessary to respect rate limit.

        Returns:
            float: Time waited in seconds
        """
        with self.lock:
            current_time = time.time()
            time_since_last_request = current_time - self.last_request_time

            if time_since_last_request < self.rate_limit:
                wait_time = self.rate_limit - time_since_last_request
                time.sleep(wait_time)
                self.last_request_time = time.time()
                return wait_time

            self.last_request_time = current_time
            return 0

    def can_make_request(self):
        """
        Check if a request can be made without waiting.

        Returns:
            bool: True if request can be made immediately
        """
        current_time = time.time()
        return (current_time - self.last_request_time) >= self.rate_limit

    def reset(self):
        """Reset the rate limiter (useful for testing)"""
        with self.lock:
            self.last_request_time = 0
