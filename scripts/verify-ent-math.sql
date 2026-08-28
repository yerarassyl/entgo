WITH question_counts AS (
  SELECT
    COUNT(*)::int AS localized_questions,
    COUNT(*) FILTER (WHERE "locale" = 'RU')::int AS ru,
    COUNT(*) FILTER (WHERE "locale" = 'KK')::int AS kk,
    COUNT(*) FILTER (WHERE "kind" = 'SINGLE')::int AS single_or_context,
    COUNT(*) FILTER (WHERE "kind" = 'MULTI')::int AS multi,
    COUNT(*) FILTER (WHERE "kind" = 'MATCHING')::int AS matching
  FROM "Question"
  WHERE "source" = 'ENT Mathematics Bank 2026'
), lesson_counts AS (
  SELECT
    COUNT(*)::int AS topics,
    COUNT("Lesson".*)::int AS topic_lessons,
    SUM(jsonb_array_length("Lesson"."contentRu"))::int AS embedded_lessons
  FROM "Topic"
  LEFT JOIN "Lesson" ON "Lesson"."topicId" = "Topic"."id"
  WHERE "Topic"."subjectId" = (SELECT "id" FROM "Subject" WHERE "slug" = 'matematika')
    AND "Topic"."slug" LIKE 'p%'
)
SELECT * FROM question_counts CROSS JOIN lesson_counts;
