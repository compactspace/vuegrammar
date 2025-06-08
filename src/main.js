// main.js
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import piniaPersistedstate from "pinia-plugin-persistedstate";
import router from "./router";
import axios from "axios";

axios.defaults.withCredentials = true;
// axios.defaults.baseURL = "/api"; // 프록시로 api 경로 전환
const app = createApp(App);
// Pinia 설정
const pinia = createPinia();
pinia.use(piniaPersistedstate);

app.use(pinia);
app.use(router);
app.mount("#app");
