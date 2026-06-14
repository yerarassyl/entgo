# Question bank import

Import only original, licensed or openly reusable content. Every imported item
is created with `REVIEW` status and must be approved in `/admin` before it can be
used in published tests.

```bash
npm run questions:import -- ./questions.json
```

The JSON file is an array:

```json
[
  {
    "slug": "math-percent-001-ru",
    "locale": "RU",
    "difficulty": 2,
    "body": "Question text",
    "explanation": "Verified simple-language explanation",
    "source": "entgo-original",
    "sourceYear": 2026,
    "subject": {
      "slug": "math-literacy",
      "titleRu": "Математическая грамотность",
      "titleKk": "Математикалық сауаттылық",
      "isRequired": true
    },
    "topic": {
      "slug": "percentages",
      "titleRu": "Проценты",
      "titleKk": "Пайыздар"
    },
    "options": [
      { "content": "Option A", "isCorrect": false },
      { "content": "Option B", "isCorrect": true }
    ]
  }
]
```

The importer rejects malformed questions and questions without exactly one
correct option. Large imports should be split into reviewable batches.
