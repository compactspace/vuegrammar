import { defineStore } from "pinia";

export const useUserInfoStore = defineStore("userInfo", {
  state: () => ({
    useUserInfo: {},
  }),
  persist: true, // 상태를 로컬스토리지에 저장

  actions: {
    saveUserInfo(useUserInfo) {
      this.useUserInfo = useUserInfo;
    },
  },
});
