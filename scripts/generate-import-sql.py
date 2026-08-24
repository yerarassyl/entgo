import json
import re
import sys
import zipfile
from pathlib import Path


SUBJECT_IDS = {
    "english": "english",
    "biology": "biology",
    "world-history": "world_history",
    "geography": "geography",
    "reading-literacy": "reading_literacy",
    "informatics": "informatics",
    "history-kz": "history_kz",
    "kazakh-literature": "kazakh_literature",
    "mathematics": "mathematics",
    "math-literacy": "math_literacy",
    "law": "law",
    "russian-literature": "russian_literature",
    "physics": "physics",
    "chemistry": "chemistry",
}

SUBJECT_IDS_BY_TITLE = {
    "Английский язык": "english",
    "Биология": "biology",
    "Всемирная история": "world_history",
    "География": "geography",
    "Грамотность чтения": "reading_literacy",
    "Информатика": "informatics",
    "История Казахстана": "history_kz",
    "Казахский язык и литература": "kazakh_literature",
    "Математика": "mathematics",
    "Математическая грамотность": "math_literacy",
    "Основы права": "law",
    "Русская литература": "russian_literature",
    "Физика": "physics",
    "Химия": "chemistry",
}


def sql(value):
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def jsonb(value):
    return sql(json.dumps(value, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"


def safe(value):
    value = str(value).lower().replace("ё", "е")
    return re.sub(r"[^a-zа-я0-9]+", "-", value).strip("-") or "topic"


def subject_id(item):
    return SUBJECT_IDS_BY_TITLE[item["subject"]["titleRu"]]


def question_sql(item):
    sid = subject_id(item)
    topic_slug = item["topic"]["slug"]
    tid = f"topic_{sid}_{topic_slug}"
    status = "PUBLISHED" if ".zip:" in item.get("source", "") else "REVIEW"
    lines = [
        f"INSERT INTO \"Subject\" (\"id\",\"slug\",\"titleRu\",\"titleKk\",\"isRequired\") VALUES ({sql(sid)},{sql(item['subject']['slug'])},{sql(item['subject']['titleRu'])},{sql(item['subject']['titleKk'])},{str(item['subject']['isRequired']).lower()}) ON CONFLICT (\"id\") DO UPDATE SET \"slug\"=EXCLUDED.\"slug\",\"titleRu\"=EXCLUDED.\"titleRu\",\"titleKk\"=EXCLUDED.\"titleKk\",\"isRequired\"=EXCLUDED.\"isRequired\";",
        f"INSERT INTO \"Topic\" (\"id\",\"subjectId\",\"slug\",\"titleRu\",\"titleKk\",\"difficulty\",\"status\") VALUES ({sql(tid)},{sql(sid)},{sql(topic_slug)},{sql(item['topic']['titleRu'])},{sql(item['topic']['titleKk'])},2,'PUBLISHED') ON CONFLICT (\"id\") DO UPDATE SET \"titleRu\"=EXCLUDED.\"titleRu\",\"titleKk\"=EXCLUDED.\"titleKk\";",
        f"INSERT INTO \"Question\" (\"id\",\"slug\",\"subjectId\",\"topicId\",\"status\",\"locale\",\"difficulty\",\"body\",\"explanation\",\"source\",\"sourceYear\",\"updatedAt\") VALUES ({sql(item['slug'])},{sql(item['slug'])},{sql(sid)},{sql(tid)},{sql(status)},'RU',{int(item['difficulty'])},{jsonb({'text': item['body']})},{jsonb({'text': item['explanation']})},{sql(item.get('source', 'user-upload'))},2026,CURRENT_TIMESTAMP) ON CONFLICT (\"slug\") DO UPDATE SET \"subjectId\"=EXCLUDED.\"subjectId\",\"topicId\"=EXCLUDED.\"topicId\",\"status\"=EXCLUDED.\"status\",\"body\"=EXCLUDED.\"body\",\"explanation\"=EXCLUDED.\"explanation\",\"updatedAt\"=CURRENT_TIMESTAMP;",
    ]
    for position, option in enumerate(item["options"]):
        oid = f"{item['slug']}_opt_{position}"
        lines.append(f"INSERT INTO \"QuestionOption\" (\"id\",\"questionId\",\"position\",\"content\",\"isCorrect\") VALUES ({sql(oid)},{sql(item['slug'])},{position},{jsonb({'text': option['content']})},{str(option['isCorrect']).lower()}) ON CONFLICT (\"questionId\",\"position\") DO UPDATE SET \"content\"=EXCLUDED.\"content\",\"isCorrect\"=EXCLUDED.\"isCorrect\";")
    return lines


def lesson_sql(lesson, subjects):
    sid = subjects[lesson["subject_id"]]
    tid = f"topic_{sid}_{lesson['topic_id']}"
    theory = lesson.get("theory", "")
    key_facts = "\\n".join(lesson.get("key_facts", []))
    examples = "\\n".join(lesson.get("examples", []))
    return [
        f"INSERT INTO \"Topic\" (\"id\",\"subjectId\",\"slug\",\"titleRu\",\"titleKk\",\"difficulty\",\"status\") VALUES ({sql(tid)},{sql(sid)},{sql(lesson['topic_id'])},{sql(lesson['topic_id'])},{sql(lesson['topic_id'])},2,'PUBLISHED') ON CONFLICT (\"id\") DO NOTHING;",
        f"INSERT INTO \"Lesson\" (\"id\",\"topicId\",\"summary\",\"rule\",\"example\",\"mistake\",\"steps\",\"contentRu\",\"publishedAt\",\"updatedAt\") VALUES ({sql(lesson['id'])},{sql(tid)},{sql(theory)},{sql(key_facts)},{sql(examples)},{sql('')},{jsonb(lesson.get('key_facts',[]))},{jsonb(lesson)},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (\"id\") DO UPDATE SET \"topicId\"=EXCLUDED.\"topicId\",\"summary\"=EXCLUDED.\"summary\",\"rule\"=EXCLUDED.\"rule\",\"example\"=EXCLUDED.\"example\",\"contentRu\"=EXCLUDED.\"contentRu\",\"updatedAt\"=CURRENT_TIMESTAMP;",
    ]


def main():
    data_path, zip_path, out_dir = map(Path, sys.argv[1:4])
    items = json.loads(data_path.read_text(encoding="utf-8"))
    with zipfile.ZipFile(zip_path) as archive:
        raw = json.loads(archive.read("entgo_database_full.json"))
    subject_map = {item["id"]: SUBJECT_IDS_BY_TITLE[item["name_ru"]] for item in raw["subjects"]}
    lines = []
    for item in items:
        lines.extend(question_sql(item))
    for lesson in raw.get("lessons", []):
        lines.extend(lesson_sql(lesson, subject_map))
    out_dir.mkdir(parents=True, exist_ok=True)
    chunk_size = 250
    paths = []
    for index in range(0, len(lines), chunk_size):
        path = out_dir / f"chunk-{index // chunk_size:03d}.sql"
        path.write_text("BEGIN;\n" + "\n".join(lines[index:index + chunk_size]) + "\nCOMMIT;\n", encoding="utf-8")
        paths.append(str(path))
    print(json.dumps({"statements": len(lines), "chunks": paths}, ensure_ascii=False))


if __name__ == "__main__":
    main()
