import { describe, expect, it } from "vitest";
import { calculateScore, percentage } from "@/lib/scoring";

describe("calculateScore", () => {
  it("scales correct answers to the ENT maximum", () => {
    expect(calculateScore(3, 5)).toBe(84);
    expect(calculateScore(5, 5)).toBe(140);
  });

  it("guards invalid and out-of-range values", () => {
    expect(calculateScore(2, 0)).toBe(0);
    expect(calculateScore(-4, 10)).toBe(0);
    expect(calculateScore(12, 10)).toBe(140);
  });
});

describe("percentage", () => {
  it("returns a rounded bounded percentage", () => {
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(10, 4)).toBe(100);
  });
});
