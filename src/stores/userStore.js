// store/user.js
import { defineStore } from "pinia"; // 상대 경로 말고 정상적인 패키지 경로 사용

export const useUserStore = defineStore("user", {
  state: () => ({
    authUser: null,
    isMatch: false,
   
  }),
  actions: {
    setUser(payload) {
      this.authUser = payload;
    },
    clearUser() {
      this.authUser = null;
       this.isMatch = false;

       // 위 2개 역시 상태를 저장하는 거라 로컬스토리지 리무브가 씹히는데.. 우선 내비둔다.
// localStorage.removeItem('user');
    },
    setMatch(payload) {
      this.isMatch = payload;
    },
  },
  getters: {
    isLoggedIn: (state) => {
      return !!(state.authUser && state.authUser.loginSuccess === true);
    },
    userRole: (state) => {
      return state.authUser?.userDetail?.role || null;
    },
    username: (state) => {
      return state.authUser?.userDetail?.username || null;
    },
    getIsMatch: (state) => {
      return state.isMatch;
    },
  },

  persist: true, // Pinia persist 플러그인이 구성되어 있어야 동작함
});
