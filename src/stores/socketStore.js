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
      this.socket = io(`https://${IP}:5000/activeMussem`, {
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
