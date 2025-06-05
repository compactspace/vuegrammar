import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";

export const useSignupStore = defineStore("signup", () => {
  const state = reactive({
    email: "",
    password: "",
    licenseNum: "",
    vehicleType: "",
    activeRegions: [],
    agreedTermIds: [],

    // 여기부터 중복확인 관련 상태
    emailValid: false,
    emailExists: null, // null: 미확인, true: 중복, false: 사용 가능
    emailChecked: false,
  });

  function reset() {
    state.email = "";
    state.password = "";
    state.licenseNum = "";
    state.vehicleType = "";
    state.activeRegions = [];
    state.agreedTermIds = [];

    state.emailValid = false;
    state.emailExists = null;
    state.emailChecked = false;
  }

  return {
    ...toRefs(state),
    reset,
  };
});
