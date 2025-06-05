<!-- AddressSearch.vue -->
<template>
  <div style="margin-top: 20px;">
    <button @click="openDaumPostcode">주소 검색하기</button>
  </div>
</template>

<script setup>
import { defineEmits, onMounted } from 'vue'

const emit = defineEmits(['update-location'])

function openDaumPostcode() {
  new window.daum.Postcode({
    oncomplete(data) {
      emit('update-location', data.address)
    }
  }).open()
}

// 다음 우편번호 스크립트 자동 삽입
onMounted(() => {
  if (!window.daum) {
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    document.body.appendChild(script)
  }
})
</script>

<style scoped>
button {
  padding: 8px 16px;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  background-color: #ff6600;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #cc5200;
}
</style>
