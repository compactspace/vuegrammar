<template>
  <div :class="{'no-permission': true, 'mobile-view': isMobile}">
    <h1>❌ 권한이 없습니다</h1>
    <p v-if="!isMobile">이 페이지에 접근하려면 로그인하거나 권한이 필요합니다.</p>
    <p v-if="isMobile">로그인 후 이 페이지에 접근할 수 있습니다.</p>
    
    <router-link to="/login" class="btn">로그인 페이지로 가기</router-link>
  </div>
</template>


<script setup>
import { useMediaQuery } from '@vueuse/core'; // useMediaQuery import

const isMobile = useMediaQuery('(max-width: 767px)')
</script>



<style scoped>
.no-permission {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 100vh;
  text-align: center;
}

.no-permission h1 {
  font-size: 2.5rem;
  color: red;
}

.no-permission p {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
}

.no-permission .btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border-radius: 5px;
  text-decoration: none;
  font-size: 1rem;
}

.no-permission .btn:hover {
  background-color: #45a049;
}

.no-permission .mobile-view {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .no-permission h1 {
    font-size: 1.8rem;
  }

  .no-permission .btn {
    padding: 12px 24px;
    font-size: 1.2rem;
  }

  .no-permission p {
    font-size: 1rem;
  }
}
</style>
