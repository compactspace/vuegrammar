// stores/loginApprovalSocketStore.js
import { defineStore } from "pinia";
import { io } from "socket.io-client";

let IP = import.meta.env.VITE_ALLOW_IP;

export const useLoginApprovalSocketStore = defineStore("loginApprovalSocket", {
  state: () => ({
    socket: null,
  }),

  actions: {
    connectSocket(userId) {
      // 로컬 호스트로 키는 경우의 테스트 때문에...

      if (location.href.includes("localhost")) {
        IP = "localhost";
      }

      if (!this.socket) {
        this.socket = io(`https://${IP}:5000/loginApproval`, {
          withCredentials: true,
        });

        this.socket.on("connect", () => {
          // console.log(
          //   "Socket connected:",
          //   this.socket.id,
          //   `userData.userDetail.eamil: ${userId}`
          // );
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
