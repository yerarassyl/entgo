import { describe, expect, it } from "vitest";
import { lessonForTopic } from "@/lib/topic-content";

describe("lessonForTopic", () => {
  it("returns curated content for a known topic", () => {
    const lesson = lessonForTopic("проценты", "Проценты");
    expect(lesson.rule).toContain("100");
    expect(lesson.steps).toHaveLength(3);
  });

  it("returns a usable fallback for new content", () => {
    const lesson = lessonForTopic("new-topic", "Новая тема");
    expect(lesson.summary).toContain("Новая тема");
    expect(lesson.example.length).toBeGreaterThan(20);
  });
});
