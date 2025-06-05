<script setup>

import NavBar from "../src/common/NavBar.vue";
import { useRoute } from 'vue-router'
import { computed } from 'vue'

// 숨길 경로 목록
const hiddenRoutes = ['/login', '/signup', '/splash']

// 현재 라우트 가져오기
const route = useRoute()

// 네브바 숨길지 여부 계산
const shouldHideNavBar = computed(() => hiddenRoutes.includes(route.path))
</script>

<template>
  <div>
    <!-- 로그인 등에서는 숨김 -->
    <NavBar v-if="!shouldHideNavBar" />
    <router-view />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
