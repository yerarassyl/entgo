import json
import re
import sys
from pathlib import Path


def quote(value):
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def json_value(value):
    return f"{quote(json.dumps(value, ensure_ascii=False))}::jsonb"


def strip_label(value):
    return re.sub(r"^\s*[A-HА-З1-9][).]\s*", "", value).strip()


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: generate-ent-math-sql.py source.json output.sql")
    source = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
    output = Path(sys.argv[2])
    parts = source["parts"]
    topics = [topic for part in parts for topic in part["topics"]]
    questions = [question for part in parts for question in part["questions"]]
    lessons = [lesson for topic in topics for lesson in topic["lessons"]]
    if (len(parts), len(topics), len(lessons), len(questions)) != (19, 148, 299, 760):
        raise ValueError("Unexpected source counts")

    sql = [
        "BEGIN;",
        "INSERT INTO \"Subject\" (\"id\",\"slug\",\"titleRu\",\"titleKk\",\"isRequired\") VALUES ('ent_math_subject','matematika','Математика','Математика',false) ON CONFLICT (\"slug\") DO UPDATE SET \"titleRu\"=EXCLUDED.\"titleRu\",\"titleKk\"=EXCLUDED.\"titleKk\",\"isRequired\"=false;",
    ]
    for topic in topics:
        slug = topic["topic_id"].lower()
        sql.append(
            "INSERT INTO \"Topic\" (\"id\",\"subjectId\",\"slug\",\"titleRu\",\"titleKk\",\"grade\",\"description\",\"status\",\"weight\",\"difficulty\",\"expectedScoreGain\") "
            f"VALUES ({quote('ent_math_topic_' + slug.replace('-', '_'))},(SELECT \"id\" FROM \"Subject\" WHERE \"slug\"='matematika'),{quote(slug)},{quote(topic['title_ru'])},{quote(topic['title_kz'])},{quote(topic['grade'])},{quote(topic['ent_section'])},'PUBLISHED',1,2,1) "
            "ON CONFLICT (\"subjectId\",\"slug\") DO UPDATE SET \"titleRu\"=EXCLUDED.\"titleRu\",\"titleKk\"=EXCLUDED.\"titleKk\",\"grade\"=EXCLUDED.\"grade\",\"description\"=EXCLUDED.\"description\",\"status\"='PUBLISHED';"
        )
        content_ru = [{"id": lesson["lesson_id"], "title": lesson["title_ru"], "theory": lesson["theory_ru"], "formulas": lesson["formulas"], "example": lesson["example_ru"]} for lesson in topic["lessons"]]
        content_kz = [{"id": lesson["lesson_id"], "title": lesson["title_kz"], "theory": lesson["theory_kz"], "formulas": lesson["formulas"], "example": lesson["example_kz"]} for lesson in topic["lessons"]]
        first = topic["lessons"][0]
        topic_lookup = f"(SELECT \"id\" FROM \"Topic\" WHERE \"subjectId\"=(SELECT \"id\" FROM \"Subject\" WHERE \"slug\"='matematika') AND \"slug\"={quote(slug)})"
        sql.append(
            "INSERT INTO \"Lesson\" (\"id\",\"topicId\",\"summary\",\"rule\",\"example\",\"mistake\",\"steps\",\"contentRu\",\"contentKk\",\"publishedAt\",\"updatedAt\") "
            f"VALUES ({quote('ent_math_lesson_' + slug.replace('-', '_'))},{topic_lookup},{quote(first['title_ru'])},{quote(first['theory_ru'])},{quote(first['example_ru'])},'Проверь каждый шаг решения и сопоставь его с условием.',{json_value(first['formulas'])},{json_value(content_ru)},{json_value(content_kz)},NOW(),NOW()) "
            "ON CONFLICT (\"topicId\") DO UPDATE SET \"summary\"=EXCLUDED.\"summary\",\"rule\"=EXCLUDED.\"rule\",\"example\"=EXCLUDED.\"example\",\"steps\"=EXCLUDED.\"steps\",\"contentRu\"=EXCLUDED.\"contentRu\",\"contentKk\"=EXCLUDED.\"contentKk\",\"publishedAt\"=NOW(),\"updatedAt\"=NOW();"
        )

    difficulty = {"базовый": 1, "средний": 2, "повышенный": 3}
    kind = {"single": "SINGLE", "context": "SINGLE", "multi": "MULTI", "match": "MATCHING"}
    for question in questions:
        topic_slug = question["topic_id"].lower()
        topic_lookup = f"(SELECT \"id\" FROM \"Topic\" WHERE \"subjectId\"=(SELECT \"id\" FROM \"Subject\" WHERE \"slug\"='matematika') AND \"slug\"={quote(topic_slug)})"
        for locale in ("ru", "kz"):
            slug = f"ent-math-{question['q_id'].lower()}-{locale}"
            context = question.get(f"context_{locale}")
            prompt = question[f"question_{locale}"]
            right = question.get(f"right_{locale}", [])
            body = "\n\n".join(value for value in (context, prompt, "\n".join(right) if right else None) if value)
            explanation = question[f"solution_{locale}"]
            qid = f"ent_math_{question['q_id'].lower().replace('-', '_')}_{locale}"
            sql.append(
                "INSERT INTO \"Question\" (\"id\",\"slug\",\"subjectId\",\"topicId\",\"status\",\"locale\",\"difficulty\",\"kind\",\"body\",\"explanation\",\"source\",\"sourceYear\",\"createdAt\",\"updatedAt\") "
                f"VALUES ({quote(qid)},{quote(slug)},(SELECT \"id\" FROM \"Subject\" WHERE \"slug\"='matematika'),{topic_lookup},'REVIEW',{quote('RU' if locale == 'ru' else 'KK')},{difficulty[question['difficulty']]},{quote(kind[question['type']])},{json_value(body)},{json_value(explanation)},'ENT Mathematics Bank 2026',2026,NOW(),NOW()) "
                "ON CONFLICT (\"slug\") DO UPDATE SET \"subjectId\"=EXCLUDED.\"subjectId\",\"topicId\"=EXCLUDED.\"topicId\",\"status\"='REVIEW',\"locale\"=EXCLUDED.\"locale\",\"difficulty\"=EXCLUDED.\"difficulty\",\"kind\"=EXCLUDED.\"kind\",\"body\"=EXCLUDED.\"body\",\"explanation\"=EXCLUDED.\"explanation\",\"source\"=EXCLUDED.\"source\",\"sourceYear\"=EXCLUDED.\"sourceYear\",\"updatedAt\"=NOW();"
            )
            sql.append(f"DELETE FROM \"QuestionOption\" WHERE \"questionId\"=(SELECT \"id\" FROM \"Question\" WHERE \"slug\"={quote(slug)});")
            if question["type"] == "match":
                matches = dict(item.split("-", 1) for item in question["correct"])
                options = [(strip_label(value), True, matches.get(chr(65 + index))) for index, value in enumerate(question.get(f"left_{locale}", []))]
            else:
                correct = set(question["correct"])
                options = [(strip_label(value), chr(65 + index) in correct, None) for index, value in enumerate(question[f"options_{locale}"])]
            values = []
            for position, (content, is_correct, match_key) in enumerate(options):
                oid = f"{qid}_o{position}"
                values.append(f"({quote(oid)},(SELECT \"id\" FROM \"Question\" WHERE \"slug\"={quote(slug)}),{position},{json_value(content)},{str(is_correct).lower()},{quote(match_key)})")
            sql.append("INSERT INTO \"QuestionOption\" (\"id\",\"questionId\",\"position\",\"content\",\"isCorrect\",\"matchKey\") VALUES " + ",".join(values) + ";")
    sql.extend(["COMMIT;", ""])
    output.write_text("\n".join(sql), encoding="utf-8")
    print(json.dumps({"topics": len(topics), "lessons": len(lessons), "localized_questions": len(questions) * 2, "output_bytes": output.stat().st_size}))


if __name__ == "__main__":
    main()
