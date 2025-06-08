// stores/useLocationStore.js
import { defineStore } from "pinia";

export const useLocationStore = defineStore("location", {
  state: () => ({
    isTrackingLocation: false,
    userLocation: null,
    watchId: null,
  }),
  actions: {
    startTracking() {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.userLocation = { lat: latitude, lon: longitude };
          this.isTrackingLocation = true;
        },
        (error) => {
          console.error("초기 위치 가져오기 실패:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.userLocation = { lat: latitude, lon: longitude };
        },
        (error) => {
          console.error("위치 추적 중 오류:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    },

    stopTracking() {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.isTrackingLocation = false;
        this.userLocation = {};
      }
    },
    getCurrentLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const location = { lat: latitude, lon: longitude };
            this.userLocation = location; // 필요시 업데이트
            resolve(location);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    },
  },
  persist: true,
});
