// stores/loginApprovalSocketStore.js
import { defineStore } from "pinia";
import { io } from "socket.io-client";

const IP = import.meta.env.VITE_ALLOW_IP;

export const useLoginApprovalSocketStore = defineStore("loginApprovalSocket", {
  state: () => ({
    socket: null,
  }),

  actions: {
    connectSocket(userId) {
      if (!this.socket) {
        this.socket = io(`https://${IP}:5000/loginApproval`, {
          withCredentials: true,
        });

        this.socket.on("connect", () => {
          console.log("Socket connected:", this.socket.id);
          this.socket.emit("register", { userId });
        });

        this.socket.on("disconnect", () => {
          console.log("Socket disconnected");
          this.socket = null;
        });
      }
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },
  },
});
