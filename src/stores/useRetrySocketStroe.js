// stores/socketStore.js
import { defineStore } from "pinia";
import { io } from "socket.io-client";

const IP = import.meta.env.VITE_ALLOW_IP;

export const useRetrySocketStroe = defineStore("retrySocket", {
  state: () => ({
    socket: null,
  }),

  actions: {
    connectSocket({ userData, unComplteEmploy }) {
      this.socket = io(`https://${IP}:5000/retrySocket`, {
        withCredentials: true,
        auth: {
          retryData: {
            userData,
            unComplteEmploy,
          },
        },
      });

      this.socket.on("connect", () => {});
    },

    disconnectSocket() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },
  },
});
