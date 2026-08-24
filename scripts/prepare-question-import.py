import json
import re
import sys
import zipfile
from pathlib import Path

from docx import Document

sys.stdout.reconfigure(encoding="utf-8")


LABELS = "АБВГ"


def slug(value: str) -> str:
    value = value.lower().replace("ё", "е")
    value = re.sub(r"[^a-zа-я0-9]+", "-", value).strip("-")
    return value or "topic"


def base_item(slug_value, subject, topic, question, options, answer, explanation, source):
    return {
        "slug": slug_value,
        "locale": "RU",
        "difficulty": max(1, min(5, int(2 if answer is None else 2))),
        "body": question.strip(),
        "explanation": (explanation or "Разбери условие по шагам и проверь вычисления.").strip(),
        "source": source,
        "sourceYear": 2026,
        "subject": {
            "slug": slug(subject),
            "titleRu": subject,
            "titleKk": subject,
            "isRequired": subject in {"История Казахстана", "Грамотность чтения", "Математическая грамотность"},
        },
        "topic": {
            "slug": slug(topic),
            "titleRu": topic,
            "titleKk": topic,
        },
        "options": [
            {"content": content.strip(), "isCorrect": index == answer}
            for index, content in enumerate(options)
        ],
    }


def parse_raw_zip(path: Path):
    items = []
    with zipfile.ZipFile(path) as archive:
        data = json.loads(archive.read("entgo_database_full.json"))
    for subject in data.get("subjects", []):
        for item in subject.get("questions", []):
            options = [re.sub(r"^\s*[А-ГA-D]\)\s*", "", str(value)) for value in item.get("options", [])]
            answer = LABELS.find(str(item.get("answer", "")))
            if len(options) >= 2 and 0 <= answer < len(options):
                items.append(base_item(
                    str(item.get("id")), subject["name_ru"], item.get("topic", "Общие вопросы"),
                    item.get("question", ""), options, answer, item.get("explanation"), f"{path.name}:entgo_database_full.json",
                ))
    return items


def parse_docx(path: Path, subject: str):
    paragraphs = [p.text.strip() for p in Document(path).paragraphs]
    items = []
    topic_number = "0"
    topic_title = "Общие вопросы"
    current = None

    def finish():
        nonlocal current
        if not current:
            return
        correct = [i for i, value in enumerate(current["options"]) if value[1]]
        if len(correct) == 1 and len(current["options"]) >= 2:
            items.append(base_item(
                f"docx-{slug(subject)}-{topic_number}-{current['number']}", subject, topic_title,
                current["question"], [value[0] for value in current["options"]], correct[0],
                current.get("explanation", ""), path.name,
            ))
        current = None

    for paragraph in paragraphs:
        if not paragraph:
            continue
        topic = re.match(r"^Тема\s+(\d+)\.\s*(.+)$", paragraph)
        if topic:
            finish()
            topic_number, topic_title = topic.group(1), topic.group(2).strip()
            continue
        question = re.match(r"^(\d+)\.\s+(.+)$", paragraph)
        option = re.match(r"^([АБВГA-D])\)\s*(.+)$", paragraph)
        if question:
            finish()
            current = {"number": question.group(1), "question": question.group(2), "options": []}
        elif option and current:
            value = option.group(2)
            correct = "✓" in value or "правильный ответ" in value.lower()
            value = re.sub(r"\s*✓?\s*правильный ответ\s*", "", value, flags=re.I).strip()
            current["options"].append((value, correct))
        elif current and paragraph.startswith("Ответ:"):
            current["explanation"] = paragraph
    finish()
    return items


def main():
    output = Path(sys.argv[1])
    files = [Path(value) for value in sys.argv[2:]]
    items = []
    # Prefer the newer archive when both archives contain the same question slug.
    for path in files:
        if path.suffix.lower() == ".zip":
            items.extend(parse_raw_zip(path))
        elif path.name == "ent_math_db.docx":
            items.extend(parse_docx(path, "Математика"))
        else:
            items.extend(parse_docx(path, "История Казахстана"))
    unique = {}
    for item in items:
        unique[item["slug"]] = item
    output.write_text(json.dumps(list(unique.values()), ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total": len(unique), "subjects": {subject: sum(item["subject"]["titleRu"] == subject for item in unique.values()) for subject in sorted({item["subject"]["titleRu"] for item in unique.values()})}}, ensure_ascii=False))


if __name__ == "__main__":
    main()
