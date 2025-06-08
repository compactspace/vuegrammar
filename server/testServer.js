const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const HTTPS_PORT = 4000;

// 인증서 파일 경로 (발급받은 경로에 맞게 수정하세요)
const certPath = 'C:/certs';

const privateKey = fs.readFileSync(path.join(certPath, 'mussem.kro.kr-key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(certPath, 'mussem.kro.kr-crt.pem'), 'utf8');
const ca = fs.readFileSync(path.join(certPath, 'mussem.kro.kr-chain.pem'), 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

// 1. Vue 빌드 결과물을 담고 있는 dist 폴더 위치
const distPath = path.join(__dirname, '../dist');

// 2. 정적 파일 서빙
app.use(express.static(distPath));

// 3. SPA 라우팅 처리 - 어떤 경로로 와도 index.html 반환
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// (Optional) API 라우트 예시
// app.get('/api/hello', (req, res) => {
//   res.json({ message: 'Hello from Express API!' });
// });

https.createServer(credentials, app).listen(HTTPS_PORT, () => {
  console.log(`HTTPS 서버가 포트 ${HTTPS_PORT}에서 실행 중입니다.`);
});
