// sessionConfig.js 또는 sessionConfig.ts

import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisClient } from "./redis.js"; // Redis 연결 클라이언트

// Redis 연결
// RedisStore 인스턴스 생성
const store = new RedisStore({
  client: redisClient,
});

const sessionConfig = {
  store, // RedisStore 인스턴스
  secret: process.env.SESSION_SECRET || "your-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // 개발환경에서 false 가능
    maxAge: 1000 * 60 * 60 * 2, // 2시간
    sameSite: "strict",
  },
};

export default sessionConfig;
