// ─────────────────────────────────────
// 🔧 모듈 및 설정 불러오기
// ─────────────────────────────────────
import express from "express";
import https from "https";
import http from "http"; // 사용되지 않지만 유지
import cors from "cors";

//주의해라 기본경로가 server폴더 직계 파일로 잡혀있어서
//백엔드 전용 .env를 따로 또 만들어야한다.
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { Server } from "socket.io";

import { addLocation, getLocation } from "./models/locationModel.js";

// ─────────────────────────────────────
// 📦 환경 변수 설정
// ─────────────────────────────────────

const app = express();
const PORT = 3000;
const IP = process.env.ALLOW_IP;

// ─────────────────────────────────────
// 🔐 HTTPS 인증서 로딩
// ─────────────────────────────────────
const options = {
  key: fs.readFileSync("C:/Windows/System32/localhost-key.pem"),
  cert: fs.readFileSync("C:/Windows/System32/localhost.pem"),
};

// 🌐 CORS 설정
// ─────────────────────────────────────
console.log(`IP: ${IP}`);
const allowedOrigins = [
  `https://${IP}:5173`,
  `https://localhost:5173`,
  `http://${IP}:5173`,
  `http://localhost:5173`,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ─────────────────────────────────────
// 🧩 미들웨어
// ─────────────────────────────────────
app.use(express.json());

// ─────────────────────────────────────
// 📡 Socket.io 설정
// ─────────────────────────────────────
const server = https.createServer(options, app);

const io = new Server(server, {
  cors: {
    origin: `https://${IP}:5173`,
    methods: ["GET", "POST"],
  },
});

const activitingLocation = io.of("activitingLocation");

activitingLocation.on("connection", (socket) => {
  console.log(`네임스페이스: activitingLocation 에 입장`);
});

activitingLocation.on("connect_error", (err) => {
  console.error("❌ 연결 실패", err.message);
});
// ─────────────────────────────────────
// 📍 위치 API
// ─────────────────────────────────────

// 위치 등록/업데이트 API (머슴용)
app.post("/location", async (req, res) => {
  console.log("📥 위치 업데이트 요청 도착");
  const { user_id, lat, lon, address } = req.body;

  try {
    const result = await addLocation(user_id, lat, lon, address);
    res.status(200).json(result);
    console.log(user_id, lat, lon, address);
    // 실시간 위치 전송
    activitingLocation.emit("locationUpdate", { user_id, lat, lon, address });
  } catch (error) {
    console.error("❌ 위치 저장 중 오류:", error);
    res.status(500).json({ message: "Error saving location", error });
  }
});

// 위치 조회 API (주인용)
app.get("/location/:user_id", async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const result = await getLocation(user_id);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ 위치 조회 중 오류:", error);
    res.status(500).json({ message: "Error retrieving location", error });
  }
});

// ─────────────────────────────────────
// 🚀 서버 시작
// ─────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on https://localhost:${PORT}`);
});
