export function calculateScore(correct: number, total: number, maximum = 140) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) return 0;
  const boundedCorrect = Math.min(Math.max(0, correct), total);
  return Math.round((boundedCorrect / total) * maximum);
}

export function percentage(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round((Math.min(Math.max(0, value), total) / total) * 100);
}
