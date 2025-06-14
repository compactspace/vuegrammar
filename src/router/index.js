import { createRouter, createWebHistory } from "vue-router";

// 각 페이지 컴포넌트 import
import MussemMatchMap from "../views/MussemMatchMap.vue"; // 머슴용
import OwnerMatchMap from "../views/OwnerMatchMap.vue"; // 주인용


import MyOrder from "../views/MyOrder.vue";

import MemberSignUpPage from "../views/MemberSignUpPage.vue";
import LoginView from "../views/LoginView.vue";
import NoPermission from "../views/NoPermission.vue";

import HomeView from "../views/MainHome.vue";
import MussemSignUp from "../views/MussemSignUp.vue";
import FindMussem from "../views/FindMussem.vue";
import MussemMainHome from "../views/MussemMainHome.vue";

import { useUserStore } from "../stores/userStore";
import axios from "axios";
const routes = [
  ,
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { requiresAuth: false, noAuth: true }, // 누구나 접근 가능
  },

  {
    ///mussemLocationSearch

    path: "/FindMussem",
    name: "FindMussem",
    component: FindMussem,
    meta: { requiresAuth: true, noAuth: false, role: "customer" }, // 누구나 접근 가능
  },

  {
    path: "/signUp", // 기본 경로
    name: "signUpPage",
    meta: { requiresAuth: false, noAuth: true },
    component: MemberSignUpPage,
  },
  {
    path: "/mussemSignUp", // 기본 경로
    name: "mussemSignUpPage",
    meta: { noAuth: true },
    component: MussemSignUp,
  },



//MyOrder
  {
    path: "/order", // 기본 경로
    name: "MyOrder",
    meta: { requiresAuth: false, noAuth: true },
    component: MyOrder,
  },

  {
    path: "/login", // 기본 경로
    name: "loginPage",
    meta: { requiresAuth: false, noAuth: true },
    component: LoginView,
  },

  {
    path: "/mussemMain",
    name: "MussemMainHome",
    meta: { requiresAuth: true, noAuth: false, role: "mussem" },
    component: MussemMainHome,
  },
  {
    path: "/mastMussem", // 머슴 페이지 경로
    name: "MastView",
    component: MussemMatchMap,
    meta: { requiresAuth: false, noAuth: true, role: "mussem" },
  },
  {
    path: "/matchCustomer", // 주인 페이지 경로
    name: "match",

    component: OwnerMatchMap,
    meta: { requiresAuth: false, noAuth: true, role: "customer" },
  },

  ,
  {
    path: "/no-permission", // 권한이 없는 페이지
    name: "NoPermission",
    meta: { requiresAuth: false, noAuth: true },
    component: NoPermission,
  },
  {
    path: "/:pathMatch(.*)*", // 이상항 라우터 이동시 404 페이지
    meta: { requiresAuth: false, noAuth: true },
    redirect: "/no-permission", // 권한이 없는 페이지로 리다이렉트
  },
];

const router = createRouter({
  history: createWebHistory(), // history 모드로 URL 관리
  routes, // 라우터 설정
});
// 라우터 가드
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const isMatch = userStore.isMatch;
  const authUser = userStore.authUser;
  const unComplteEmploy = userStore.unComplteEmploy;

  if (isMatch) {
    // 여기서 고용 매칭이후  예기치 못한 머슴의 웹브라우져끄기 새로고침등을 방지한다.

    if (authUser?.userDetail.role === "mussem" && to.name !== "MastView") {
      return next({ name: "MastView" }); // MussemMatchMap으로 이동
    }

    if (authUser?.userDetail.role === "customer" && to.name !== "MastView") {
      return next({ name: "match" }); // OwnerMatchMap으로 이동
    }
  }

  if (to.meta.noAuth) {
    next();
  } else {
    try {
      const response = await axios.get("/auth/status"); // 세션 체크 API 호출

      const { user } = response.data;

      const userRole = user.role;

      console.log(`userRole: ${userRole}`);

      const userStore = useUserStore();
      if (response.status === 200) {
        if (userRole != to.meta.role) {
          return next({ name: "NoPermission" });
        }

        return next();
      } else {
        userStore.clearUser();
        return next({ name: "loginPage" });
      }
    } catch (error) {
      // 에러 나면 로그인 페이지로 보내기
      userStore.clearUser();
      return next({ name: "loginPage" });
    }
  }
});

export default router;
