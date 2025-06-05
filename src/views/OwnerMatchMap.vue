<template>
  <!-- <div
    class="container"
  >
   
    <section class="map-panel">
      <header class="map-header">
        <span v-if="role === 'employer'">👷‍♂️ 고용주 실시간 위치 모니터링</span>
        <span v-else-if="role === 'worker'">🧑‍🌾 머슴 실시간 위치 모니터링</span>
        <span v-else>📍 실시간 위치 모니터링</span>
      </header>
      <div id="map" class="map-container"></div>
    </section>

   
    <section class="log-panel">
      <h2>📍 소켓 위치 로그</h2>
      <ul class="log-list">
        <li v-for="(loc, index) in locationLogs" :key="index" class="log-item">
          <div class="log-index">#{{ index + 1 }}</div>
          <div>위도: <strong>{{ loc.lat }}</strong></div>
          <div>경도: <strong>{{ loc.lon }}</strong></div>
        </li>
      </ul>
    </section>
  </div> -->
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { io } from 'socket.io-client';
import { useUserStore } from "../stores/userStore.js";
import { useStoreSocketActivatigLocation } from "../stores/useStoreSocketActivatigLocation.js";
import { useLocationStore } from "../stores/useLocationStore.js";
const socketActivatigLocation = useStoreSocketActivatigLocation();
const userStore = useUserStore();
const role = userStore.authUser.userDetail.role;

const API_KEY = 'bf3a4b9e9374aa9b95f6e03305dd16eb';
let map = null;
let marker = null;

const userLocation = ref({ lat: 37.4606, lon: 126.6633 });

// 요소는 { lat: 37.4606, lon: 126.6633 } 꼴
const locationLogs = ref([]);
const mussemActivatigLocation = useLocationStore();
onMounted(() => {

  console.log(mussemActivatigLocation.userLocation)
  
 // socketActivatigLocation.socketActivatigLocation.emit('completeHire')

  // // 카카오맵 SDK 로드 후 초기화
  // if (typeof kakao === 'undefined' || !kakao.maps) {
  //   const script = document.createElement('script');
  //   script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&libraries=services`;
  //   script.onload = initMap;
  //   document.head.appendChild(script);
  // } else {
  //   initMap();
  // }

  // // 역할에 따라 수신할 user_id 분기 (예: 고용주=1, 머슴=2)
  // const watchUserId = role === 'employer' ? 1 : role === 'worker' ? 2 : null;

  // socket.on('locationUpdate', (data) => {
  //   if (data.user_id === watchUserId) {
  //     userLocation.value = { lat: data.lat, lon: data.lon };
  //     if (marker) marker.setPosition(new kakao.maps.LatLng(data.lat, data.lon));
  //     if (map) map.setCenter(new kakao.maps.LatLng(data.lat, data.lon));
  //     locationLogs.value.push({ lat: data.lat, lon: data.lon });
  //   }
  // });
});

// function initMap() {
//   map = new kakao.maps.Map(document.getElementById('map'), {
//     center: new kakao.maps.LatLng(userLocation.value.lat, userLocation.value.lon),
//     level: 3,
//   });

//   marker = new kakao.maps.Marker({
//     position: new kakao.maps.LatLng(userLocation.value.lat, userLocation.value.lon),
//     map: map,
//   });
// }
</script>

<style scoped>
.container {
  display: flex;
  gap: 24px;
  height: 100%;
  min-height: 540px;
  padding: 24px;
  background: #f7f9fa;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}
.map-panel {
  flex: 1;
  border-radius: 18px;
  overflow: hidden;
  background: white;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}
.map-header {
  background: linear-gradient(90deg, #00c7ae 0%, #00d7b9 100%);
  padding: 18px 24px;
  color: white;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: -0.5px;
}
.map-container {
  flex: 1;
}
.log-panel {
  width: 340px;
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}
.log-panel h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #00c7ae;
  padding-bottom: 6px;
}
.log-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}
.log-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #555;
}
.log-index {
  font-weight: 600;
  color: #00c7ae;
}
</style>
