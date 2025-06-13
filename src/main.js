// main.js
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import piniaPersistedstate from "pinia-plugin-persistedstate";
import router from "./router";
import axios from "axios";
import { useUserStore } from "./stores/userStore";
axios.defaults.withCredentials = true;
//axios.defaults.baseURL = "/api"; // 프록시로 api 경로 전환
// axios 응답 인터셉터 등록

// 주의해라
// 클라이언트 뷰단에 핀야로 저장되나. 이는 저장될뿐이고 express에서 세션이 유효한지 항상 검사해야한다.
// 통과했다면 뷰단 핀야를 신뢰하는 것이고, 통과하지 못했다면 세션이 만료되었다는것으로 핀야 초기후 로그인으로 유도
axios.interceptors.response.use(
  (response) => response, // 성공 시 그대로 반환
  (error) => {
    const authStore = useUserStore();
    authStore.clearUser();

    // 에러 응답이 있을 때만 처리
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // 401 Unauthorized: 세션 만료 또는 로그인 필요
        console.log(
          "🚨 401 Unauthorized - 로그아웃 처리 및 로그인 페이지로 이동"
        );
        authStore.logout(); // 핀야 상태 초기화 (로그아웃 함수)
        router.push("/login");
      } else if (status === 403) {
        // 403 Forbidden: 권한 부족
        console.log("⚠️ 403 Forbidden - 권한 부족 안내 페이지로 이동");
        router.push("/no-permission"); // 권한 없음 페이지로 이동 (선택사항)
      }
    }

    // 에러를 계속 던져서 호출처리에서 필요시 catch 가능하게
    return Promise.reject(error);
  }
);

const app = createApp(App);
// Pinia 설정
const pinia = createPinia();
pinia.use(piniaPersistedstate);

app.use(pinia);
app.use(router);
app.mount("#app");
