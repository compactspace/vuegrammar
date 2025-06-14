import { createClient } from "redis";

const redisClient = createClient({
  socket: { port: 6379 },
  password: "1111",
});

const redisPublisher = createClient({
  socket: { port: 6379 },
  password: "1111",
});

const redisSubscriber = createClient({
  socket: { port: 6379 },
  password: "1111",
});

let isConnected = false;

async function connectRedis() {
  if (!isConnected) {
    [redisClient, redisPublisher, redisSubscriber].forEach((client) => {
      client.on("error", (err) => console.error("Redis Client Error", err));
    });
    await Promise.all([
      redisClient.connect(),
      redisPublisher.connect(),
      redisSubscriber.connect(),
    ]);
    isConnected = true;
    console.log("✅ Redis clients connected");
  }
}

export { redisClient, redisPublisher, redisSubscriber, connectRedis };
