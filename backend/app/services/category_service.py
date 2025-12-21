"""
Service for category filtering and age-appropriate content management.
"""
from flask import current_app
from app.services.trivia_api_service import TriviaApiService
from app.utils.constants import KID_FRIENDLY_CATEGORIES, BLOCKED_CATEGORIES


class CategoryService:
    """
    Service for category filtering and age-appropriate content management.
    """

    def __init__(self):
        self.trivia_api = TriviaApiService()
        self._category_cache = None

    def get_kid_friendly_categories(self, age_group=None):
        """
        Get filtered, kid-friendly categories.

        Args:
            age_group: Optional filter by age group ('5-7', '8-10', '11-13')

        Returns:
            list: List of category dictionaries with kid-friendly metadata
        """
        # Fetch from API (with caching in real implementation)
        api_categories = self.trivia_api.fetch_categories()

        # Filter and enhance with kid-friendly metadata
        kid_categories = []
        for cat in api_categories:
            cat_id = cat['id']

            # Skip blocked categories
            if cat_id in BLOCKED_CATEGORIES:
                continue

            # Only include kid-friendly categories
            if cat_id in KID_FRIENDLY_CATEGORIES:
                metadata = KID_FRIENDLY_CATEGORIES[cat_id]

                # Filter by age group if specified
                if age_group and age_group not in metadata['ages']:
                    continue

                kid_categories.append({
                    'id': cat_id,
                    'name': metadata['name'],
                    'description': metadata['description'],
                    'icon': metadata['icon'],
                    'ageGroups': metadata['ages'],
                    'kidFriendly': True
                })

        return kid_categories

    def is_category_appropriate(self, category_id, age_group):
        """
        Check if a category is appropriate for given age group.

        Args:
            category_id: Category ID to check
            age_group: Age group ('5-7', '8-10', '11-13')

        Returns:
            bool: True if category is appropriate for age group
        """
        if category_id not in KID_FRIENDLY_CATEGORIES:
            return False

        category = KID_FRIENDLY_CATEGORIES[category_id]
        return age_group in category['ages']

    def get_category_name(self, category_id):
        """
        Get category name by ID.

        Args:
            category_id: Category ID

        Returns:
            str: Category name
        """
        if category_id in KID_FRIENDLY_CATEGORIES:
            return KID_FRIENDLY_CATEGORIES[category_id]['name']
        return f"Category {category_id}"

    def get_category_info(self, category_id):
        """
        Get full category information.

        Args:
            category_id: Category ID

        Returns:
            dict: Category information or None if not found
        """
        if category_id in KID_FRIENDLY_CATEGORIES:
            metadata = KID_FRIENDLY_CATEGORIES[category_id]
            return {
                'id': category_id,
                'name': metadata['name'],
                'description': metadata['description'],
                'icon': metadata['icon'],
                'ageGroups': metadata['ages'],
                'kidFriendly': True
            }
        return None
