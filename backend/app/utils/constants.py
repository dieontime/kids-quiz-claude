"""
Application constants for the Kids Quiz App.
Includes kid-friendly categories, age mappings, and API codes.
"""

# Kid-friendly categories from Open Trivia DB
# Format: category_id: {name, description, ages, icon}
KID_FRIENDLY_CATEGORIES = {
    9: {
        'name': 'General Knowledge',
        'description': 'Fun facts about the world around us!',
        'ages': ['5-7', '8-10', '11-13'],
        'icon': 'brain'
    },
    17: {
        'name': 'Science & Nature',
        'description': 'Explore the wonders of science and nature!',
        'ages': ['8-10', '11-13'],
        'icon': 'leaf'
    },
    19: {
        'name': 'Mathematics',
        'description': 'Challenge your math skills!',
        'ages': ['8-10', '11-13'],
        'icon': 'calculator'
    },
    22: {
        'name': 'Geography',
        'description': 'Discover countries, cities, and landmarks!',
        'ages': ['8-10', '11-13'],
        'icon': 'globe'
    },
    23: {
        'name': 'History',
        'description': 'Learn about important events from the past!',
        'ages': ['11-13'],
        'icon': 'scroll'
    },
    27: {
        'name': 'Animals',
        'description': 'Learn about amazing creatures!',
        'ages': ['5-7', '8-10', '11-13'],
        'icon': 'paw'
    },
    32: {
        'name': 'Cartoons & Animations',
        'description': 'Test your knowledge of favorite cartoons!',
        'ages': ['5-7', '8-10'],
        'icon': 'tv'
    }
}

# Categories to block (inappropriate for kids)
BLOCKED_CATEGORIES = [
    24,  # Politics
    26   # Celebrities
]

# Age to difficulty mapping
AGE_TO_DIFFICULTY = {
    '5-7': 'easy',      # Simple vocabulary, basic concepts
    '8-10': 'medium',   # Reading comprehension required
    '11-13': 'hard'     # Complex reasoning and abstract thinking
}

# Open Trivia DB API response codes
TRIVIA_API_CODES = {
    0: 'Success',
    1: 'No Results',
    2: 'Invalid Parameter',
    3: 'Token Not Found',
    4: 'Token Empty'
}

# Valid age groups
VALID_AGE_GROUPS = ['5-7', '8-10', '11-13']

# Valid difficulty levels
VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

# Valid question types
VALID_QUESTION_TYPES = ['multiple', 'boolean']
