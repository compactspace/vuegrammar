// 👇 가장 먼저 추가하세요
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

import fs from "fs";
import https from "https";
import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { createSocketServer } from "./socket/socketServer/socketServer.js";
import sessionConfig from "./config/session.js";
import userRoutes from "./routes/userRoutes.js";
import customerRouter from "./routes/customerRouter.js";
import mussemRouter from "./routes/mussemRouter.js";
import authRouter from "./routes/authRouter.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { authMiddleware } from "./authMiddleware/authMiddleware.js";
import path from "path";
import { checkSessionStatus } from "./checkSessionStatus/checkSessionStatus.js";
dotenv.config();

const app = express();
app.use(express.json());
const options = {
  key: fs.readFileSync("C:/Windows/System32/localhost-key.pem"),
  cert: fs.readFileSync("C:/Windows/System32/localhost.pem"),
};

async function startServer() {
  const IP = process.env.ALLOW_IP;

  const allowedOrigins = [
    `https://${IP}:5173`,
    `https://localhost:5173`,
    `http://${IP}:5173`,
    `http://localhost:5173`,
  ];

  try {
    await connectRedis();

    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    );
    const __dirname = path.resolve();
    const clientBuildPath = path.join(__dirname, "dist"); // 또는 'public', 실제 빌드 결과물 위치

    app.use(express.static(clientBuildPath));

    app.use(cookieParser());
    app.use(session(sessionConfig));
    app.use(checkSessionStatus);
    app.use(authMiddleware);
    app.use("/auth", authRouter);
    app.use("/users", userRoutes);
    app.use("/customer", customerRouter);
    app.use("/mussem", mussemRouter);
    // SPA 라우팅 지원 (404 fallback → index.html)
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });

    const httpsServer = https.createServer(options, app);
    createSocketServer();

    httpsServer.listen(4000, () => {
      console.log("🚀 HTTPS 서버가 4000번 포트에서 실행 중입니다!");
    });

    // 종료 핸들러 설정
    process.on("SIGINT", async () => {
      console.log("\n🛑 서버 종료 시도 중 (SIGINT 감지)");

      try {
        await redisClient.flushAll();
        console.log("🧹 Redis 데이터 모두 삭제됨 (FLUSHALL)");
      } catch (err) {
        console.error("Redis FLUSHALL 실패:", err);
      }

      try {
        await redisClient.quit();
        console.log("🔌 Redis 연결 종료");
      } catch (err) {
        console.error("Redis 종료 중 오류:", err);
      }

      httpsServer.close(() => {
        console.log("🛑 HTTPS 서버 종료 완료");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("서버 시작 중 에러 발생:", error);
    process.exit(1);
  }
}

startServer();
