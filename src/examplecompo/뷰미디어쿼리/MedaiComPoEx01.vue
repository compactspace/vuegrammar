<template>
  <div>
    <input type="text" v-model="location" placeholder="위치를 입력하세요" />
    <button @click="getCurrentLocation" title="현재 위치 가져오기">📍</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const location = ref('')  // 주소가 들어갈 변수
const kakaoApiKey = 'bf3a4b9e9374aa9b95f6e03305dd16eb'  // 본인 키로 교체!

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 정보를 지원하지 않습니다.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      console.log('위도:', latitude, '경도:', longitude)  // 좌표 확인용 로그

      const addr = await reverseGeocode(latitude, longitude)
      location.value = addr || '주소를 찾을 수 없습니다.'
    },
    (error) => {
      alert('위치 정보를 가져오는 데 실패했습니다: ' + error.message)
      console.error(error)
    },
    {
      enableHighAccuracy: true, // 정확도 높이기 옵션
      timeout: 10000,           // 10초 내 응답 없으면 에러
      maximumAge: 0             // 캐시 안 쓰고 새 위치 요청
    }
  )
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
        mode: 'cors',
      }
    )
    const data = await response.json()
    if (data.documents && data.documents.length > 0) {
      return data.documents[0].address.address_name
    } else {
      return null
    }
  } catch (error) {
    console.error('카카오 역지오코딩 에러:', error)
    return null
  }
}
</script>

<style scoped>
input {
  width: 300px;
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  margin-left: 8px;
  padding: 8px 12px;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
  background-color: #1ea7fd;
  color: white;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0d8bd1;
}
</style>
