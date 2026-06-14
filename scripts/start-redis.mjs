import { RedisMemoryServer } from "redis-memory-server";

const server = new RedisMemoryServer({
  instance: {
    ip: "127.0.0.1",
    port: 6379,
  },
});

await server.getPort();
console.log("Redis-compatible server listening on 127.0.0.1:6379");

async function shutdown() {
  await server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
