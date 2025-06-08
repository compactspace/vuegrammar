<template>
  <nav class="navbar">
    <!-- PC & 태블릿용 -->
    <div v-if="!isMobile" class="nav-links">
      <template v-if="!userStore.isLoggedIn">
        <router-link to="/" class="nav-link">🏠 홈</router-link>
        <button @click="goToLogin" class="nav-btn">🔐 로그인</button>
      </template>

      <template v-else-if="userStore.userRole === 'mussem'">
        <router-link to="/mussem" class="nav-link">🧑‍🌾 대시보드</router-link>
        <router-link to="/mussem/my-jobs" class="nav-link">🧾 내 작업 내역</router-link>
        <router-link to="/mussem/settings" class="nav-link">⚙️ 설정</router-link>
        <button @click="logout" class="nav-btn">🚪 로그아웃</button>
      </template>

      <template v-else>
        <router-link to="/" class="nav-link">🏠 홈</router-link>
        <router-link to="/order" class="nav-link">📦 주문</router-link>
        <router-link to="/mypage" class="nav-link">👤 마이페이지</router-link>
        <button @click="logout" class="nav-btn">🚪 로그아웃</button>
      </template>
    </div>

    <!-- 모바일용 -->
    <div v-else>
      <button class="hamburger-btn" @click="menuOpen = true">☰</button>

      <div v-if="menuOpen" class="drawer-overlay" @click="menuOpen = false"></div>

      <div class="drawer-menu" :class="{ open: menuOpen }">
        <button class="close-btn" @click="menuOpen = false">✖</button>

        <template v-if="!userStore.isLoggedIn">
          <router-link to="/" class="nav-link" @click="menuOpen = false">🏠 홈</router-link>
          <button @click="handleLoginClick" class="nav-btn">🔐 로그인</button>
        </template>

        <template v-else-if="userStore.userRole === 'mussem'">
          <router-link to="/mussem" class="nav-link" @click="menuOpen = false">🧑‍🌾 대시보드</router-link>
          <router-link to="/mussem/my-jobs" class="nav-link" @click="menuOpen = false">🧾 내 작업 내역</router-link>
          <router-link to="/mussem/settings" class="nav-link" @click="menuOpen = false">⚙️ 설정</router-link>
          <button @click="handleLogoutClick" class="nav-btn">🚪 로그아웃</button>
        </template>

        <template v-else>
          <router-link to="/" class="nav-link" @click="menuOpen = false">🏠 홈</router-link>
          <router-link to="/order" class="nav-link" @click="menuOpen = false">📦 주문</router-link>
          <router-link to="/mypage" class="nav-link" @click="menuOpen = false">👤 마이페이지</router-link>
          <button @click="handleLogoutClick" class="nav-btn">🚪 로그아웃</button>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useMediaQuery } from "@vueuse/core"
import { useUserStore } from "../stores/userStore.js"
import axios from "axios";
const userStore = useUserStore()
const router = useRouter()
const isMobile = useMediaQuery("(max-width: 767px)")
const menuOpen = ref(false)

const goToLogin = () => {
  router.push("/login")
}

const logout = async () => {  
  try {
    // 여기서 axios 로그아웃 요청 넣어도 좋음
    await axios.post('/users/logout')

    userStore.clearUser()
    router.push("/")
    menuOpen.value = false
  } catch (e) {
    console.error("로그아웃 실패", e)
  }
}

const handleLoginClick = () => {
  goToLogin()
  menuOpen.value = false
}
const handleLogoutClick = async () => {
   await logout()
  menuOpen.value = false
}
</script>

<style scoped>
.navbar {
  background-color: #f5f5f5;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* PC 네비 링크 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
}

.nav-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.nav-btn:hover {
  background-color: #0056b3;
}

/* 모바일 햄버거 버튼 */
.hamburger-btn {
  background: none;
  border: none;
  font-size: 2.2rem;
  cursor: pointer;
  color: #333;
}

/* 드로어 오버레이 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
}

/* 드로어 메뉴 */
.drawer-menu {
  position: fixed;
  top: 0;
  left: -80%;
  width: 70%;
  max-width: 320px;
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transition: left 0.3s ease;
  z-index: 100;
  overflow-y: auto;
}

.drawer-menu.open {
  left: 0;
}

/* 닫기 버튼 */
.close-btn {
  align-self: flex-end;
  font-size: 1.8rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  margin-bottom: 1rem;
}
</style>
