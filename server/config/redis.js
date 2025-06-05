// config/redis.js
import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    port: 6379,
  },
  password: "1111",
});

let isConnected = false;

async function connectRedis() {
  if (!isConnected) {
    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });
    await redisClient.connect();
    isConnected = true;
    console.log("✅ Redis connected");
  }
}

export { redisClient, connectRedis };
