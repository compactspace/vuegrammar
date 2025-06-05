// stores/socketStore.js
import { defineStore } from "pinia";
import { io } from "socket.io-client";

const IP = import.meta.env.VITE_ALLOW_IP;
export const useStoreSocketActivatigLocation = defineStore(
  "socketActivatigLocation",
  {
    state: () => ({
      socketActivatigLocation: null,
    }),

    actions: {
      connectSocket() {
        // 어쩔수 없다. localhost 과  와이파이 IP를 수동으로 바꾸어가며 테스트하자...
        this.socketActivatigLocation = io(
          `https://${IP}:5000/activitingLocation`,
          {
            withCredentials: true,
          }
        );

        // this.socketActivatigLocation.on("connect", () => {
        //   console.log("🧩 소켓 연결됨:", this.socketActivatigLocation.id);
        //   this.socketActivatigLocation.emit("activitingLocationRole", { role });
        // });

        // 공통 이벤트 수신 예시
        //   this.socketActivatigLocation.on('notice:global', (msg) => {
        //     console.log('📢 전체 공지:', msg);
        //   });
      },

      disconnectsocketActivatigLocation() {
        this.socketActivatigLocation.disconnect();
        this.socketActivatigLocation = null;
      },
    },
  }
);
