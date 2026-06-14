const baseUrl = process.env.LOAD_TEST_URL ?? "http://127.0.0.1:3000";
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? 50);
const durationMs = Number(process.env.LOAD_TEST_DURATION_MS ?? 10_000);
const deadline = Date.now() + durationMs;
const latencies = [];
let requests = 0;
let failures = 0;

async function worker(index) {
  const paths = ["/", "/api/health"];
  while (Date.now() < deadline) {
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${paths[(requests + index) % paths.length]}`, {
        headers: { "user-agent": "entgo-load-smoke/1.0" },
      });
      await response.arrayBuffer();
      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    } finally {
      latencies.push(performance.now() - started);
      requests += 1;
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));
latencies.sort((a, b) => a - b);
const percentile = (value) =>
  latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] ?? 0;
const errorRate = requests ? failures / requests : 1;
const result = {
  baseUrl,
  concurrency,
  durationMs,
  requests,
  requestsPerSecond: Math.round(requests / (durationMs / 1_000)),
  failures,
  errorRate: Number((errorRate * 100).toFixed(2)),
  p50Ms: Math.round(percentile(0.5)),
  p95Ms: Math.round(percentile(0.95)),
  p99Ms: Math.round(percentile(0.99)),
};

console.log(JSON.stringify(result, null, 2));
if (errorRate > 0.01 || result.p95Ms > 2_500) process.exit(1);
