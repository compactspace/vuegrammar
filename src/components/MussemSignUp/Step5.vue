<template>
  <div>
    <h2>가입 완료!</h2>
    <p>머슴 라이더 회원가입이 완료되었습니다. 환영합니다! 🎉</p>
    <button @click="goToMain">메인 페이지로 이동</button>
  </div>
</template>

<script setup>
function goToMain() {
  alert('메인 페이지로 이동합니다.')
  // 실제 라우터 이동 코드 넣으면 됨
}
</script>

<style scoped>
button {
  background-color: #66D9E8;
  border: none;
  color: white;
  padding: 0.5rem 1.5rem;
  margin-top: 1rem;
  cursor: pointer;
  border-radius: 4px;
}
</style>
