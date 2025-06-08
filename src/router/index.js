import { createRouter, createWebHistory } from "vue-router";

// 각 페이지 컴포넌트 import
import MussemMatchMap from "../views/MussemMatchMap.vue"; // 머슴용
import OwnerMatchMap from "../views/OwnerMatchMap.vue"; // 주인용
import ApiEx01 from "../examplecompo/실시간위도경도API테스트/ApiEx01.vue";
import MedaiComPoEx01 from "../examplecompo/뷰미디어쿼리/MedaiComPoEx01.vue";
import MemberSignUpPage from "../views/MemberSignUpPage.vue";
import LoginView from "../views/LoginView.vue";
import NoPermission from "../views/NoPermission.vue";

import HomeView from "../views/MainHome.vue";
import MussemSignUp from "../views/MussemSignUp.vue";
import FindMussem from "../views/FindMussem.vue";
import MussemMainHome from "../views/MussemMainHome.vue";

import { useUserStore } from "../stores/userStore";

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
    meta: { requiresAuth: false, noAuth: true }, // 누구나 접근 가능
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

  {
    path: "/login", // 기본 경로
    name: "loginPage",
    meta: { requiresAuth: false, noAuth: true },
    component: LoginView,
  },

  {
    path: "/mussemMain", // 주인 페이지 경로
    name: "MussemMainHome",
    meta: { requiresAuth: true, noAuth: false },
    component: MussemMainHome,
  },
  {
    path: "/mastMussem", // 머슴 페이지 경로
    name: "MastView",
    component: MussemMatchMap,
    meta: { requiresAuth: false, noAuth: true },
  },
  {
    path: "/matchCustomer", // 주인 페이지 경로
    name: "match",

    component: OwnerMatchMap,
    meta: { requiresAuth: false, noAuth: true },
  },
  {
    path: "/t1",
    name: " ApiEx01",
    component: ApiEx01,
  },

  ,
  {
    path: "/media", // 주인 페이지 경로
    name: "MedaiComPoEx01",
    component: MedaiComPoEx01,
    meta: { noAuth: true },
  },

  {
    path: "/no-permission", // 권한이 없는 페이지
    name: "NoPermission",
    component: NoPermission,
  },
  {
    path: "/:pathMatch(.*)*", // 404 페이지
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
    const { authUser } = await checkAuth();
    const isLoggedIn = authUser.loginSuccess;
    const userRole = authUser?.userDetail?.role;

    const requiresAuth = to.meta.requiresAuth;
    const requiredRole = to.meta.role;

    // console.log(`isLoggedIn: ${isLoggedIn}`);
    // console.log(`userRole: ${userRole}`);

    if (requiresAuth && !isLoggedIn) {
      return next({ name: "loginPage" });
    }

    if (requiredRole && isLoggedIn && userRole !== requiredRole) {
      return next({ name: "ForbiddenPage" });
    }
    next();
  }
});

// 로그인 상태 확인 함수 (로컬 스토리지 사용)
const checkAuth = async () => {
  // 로컬 스토리지에 인증 상태가 있으면 바로 반환
  const authUser = localStorage.getItem("user");
  // console.log(`userDetail:  ${authUser}`);
  if (authUser && authUser != "undefined") {
    // console.log(JSON.parse(authUser));

    return JSON.parse(authUser); // 인증 상태 반환
  }

  console.log("📡 인증 체크 호출됨");

  // try {
  //   const response = await axios.get("/users/authcheck", {
  //     withCredentials: true,
  //   });

  //   console.log("🔐 인증 응답:", response);
  //   let obj = {};
  //   const { loggedIn, userInfo } = response.data;
  //   obj.isLoggedIn = loggedIn;
  //   obj.userInfo = userInfo;
  //   // 인증 상태를 로컬 저장소에 저장
  //   // ✅ 핀냐에 저장
  //   userStore.setUser(userData);

  //   localStorage.setItem("authStatus", JSON.stringify(loggedIn));
  //   localStorage.setItem("userDetail", JSON.stringify(userInfo));
  //   return obj;
  // } catch (error) {
  //   console.error("❌ 인증 실패:", error);
  //   return false; // 인증 실패 시 false 반환
  // }
};

export default router;
