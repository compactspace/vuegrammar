// store/user.js
import { defineStore } from "pinia"; // 상대 경로 말고 정상적인 패키지 경로 사용

export const useStoreMyLocation = defineStore("myLocation", {
  state: () => ({
    myLocation: null,
    coordinates: {
      latitude: null,
      longitude: null,
    },
  }),
  actions: {
    setMyLocation(payload) {
      this.myLocation = payload;
    },
    clearMyLocation() {
      this.myLocation = null;
    },
    setCoordinates({ latitude, longitude }) {
      this.coordinates.latitude = latitude;
      this.coordinates.longitude = longitude;
    },
    clearCoordinates() {
      this.coordinates.latitude = null;
      this.coordinates.longitude = null;
    },
  },

  persist: true, // Pinia persist 플러그인이 구성되어 있어야 동작함
});
