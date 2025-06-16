// stores/socketStore.js
import { defineStore } from "pinia";
import { io } from "socket.io-client";

const IP = import.meta.env.VITE_ALLOW_IP;
export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null,
  }),

  actions: {
    connectSocket(role) {
      // 어쩔수 없다. localhost 과  와이파이 IP를 수동으로 바꾸어가며 테스트하자...
      this.socket = io(`https://mussem.kro.kr:5000/activeMussem`, {
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        // console.log("🧩 소켓 연결됨:", this.socket.id);
        this.socket.emit("activeMussem", { role });
      });
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },
  },
});
