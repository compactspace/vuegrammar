import express from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";

const app = express();

// Redis 클라이언트 설정
const redisClient = createClient({
  legacyMode: true, // connect-redis v6는 legacyMode 필요함
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
  password: "1111", // 레디스 서버 의 내가 설정한 비번으로
});
redisClient.connect().catch(console.error);

// Redis 스토어 생성
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "sess:",
  ttl: 1800, // TTL 30분 (1800초)
});

// 세션 미들웨어 등록
app.use(
  session({
    store: redisStore,
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: true, // 요청 시마다 TTL 갱신
    cookie: {
      maxAge: 1800 * 1000, // 30분
      httpOnly: true,
      secure: false, // HTTPS에서는 true
      sameSite: "lax",
    },
  })
);

// 테스트 라우터
app.get("/", (req, res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`방문 횟수: ${req.session.views}`);
});

app.listen(3000, () => {
  console.log("✅ 서버 실행: http://localhost:3000");
});
