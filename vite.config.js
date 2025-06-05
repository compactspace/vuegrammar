import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";
import path from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// https://vite.dev/config/

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // 외부 IP에서 접근할 수 있도록 설정
    port: 5173, // 원하는 포트 번호

    // proxy: {
    //       // 예: http://localhost:3000/api → http://localhost:8080/api
    //       "/api": {
    //         target: "http://localhost:3000", // 백엔드 서버로 프록시
    //         changeOrigin: true,
    //         secure: false, // ← HTTPS self-signed 인증서 허용
    //         rewrite: (path) => path.replace(/^\/api/, ""),
    //       },
    //     },

    // // 추후 Let's Encrypt 에서 인증서발급후 https를 적용하라.
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "localhost.pem")),
    },
    // 추후 Let's Encrypt 에서 인증서발급후 https를 적용하라.
    proxy: {
      // 예: http://localhost:3000/api → http://localhost:8080/api
      "/api": {
        target: "https://localhost:3000", // 백엔드 서버로 프록시
        changeOrigin: true,
        secure: false, // ← HTTPS self-signed 인증서 허용
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
