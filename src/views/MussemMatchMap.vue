<template>
  <div>
    <h1>머슴 위치 실시간 전송</h1>
    <div id="map" style="width: 100%; height: 400px;"></div>

    <section class="log-panel">
      <h2>📍 위치 로그</h2>
      <ul>
        <li v-for="(loc, idx) in locationLogs" :key="idx">
          #{{ idx + 1 }} 위도: {{ loc.lat }}, 경도: {{ loc.lon }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useStoreSocketActivatigLocation } from "../stores/useStoreSocketActivatigLocation.js";
import { useRetrySocketStroe } from "../stores/useRetrySocketStroe.js";
const socketActivatigLocation = useStoreSocketActivatigLocation();
const retrySocketStroe =useRetrySocketStroe();
const API_KEY = "YOUR_KAKAO_MAP_API_KEY";
//socketActivatigLocation.connectSocket();

const locationLogs = ref([]);
const userLocation = ref({ lat: 37.4606, lon: 126.6633 });

let map = null;
let marker = null;
let watchId = null;

// 1. 카카오 지도  범위와 마커 위치 초기화
const initMap = () => {
  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(userLocation.value.lat, userLocation.value.lon),
    level: 3,
  });

  marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(userLocation.value.lat, userLocation.value.lon),
    map: map,
  });
};

// 2. 위치 추적 및 서버 전송
const trackAndSendLocation = () => {
  if (!navigator.geolocation) {
    console.error("Geolocation 지원 안됨");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      userLocation.value = { lat: latitude, lon: longitude };

      // 지도 마커 업데이트
      if (marker && map) {
        const latLng = new kakao.maps.LatLng(latitude, longitude);
        marker.setPosition(latLng);
        map.setCenter(latLng);
      }

      // 위치 로그에 추가 (최대 20개)
      locationLogs.value.unshift({ lat: latitude, lon: longitude });
      if (locationLogs.value.length > 20) locationLogs.value.pop();

      // 서버에 위치 업데이트 emit
      // 개망 내실수다. 아무튼 분기점을 준다.
      if(retrySocketStroe.socket!=null||retrySocketStroe.socket!=undefined){
      retrySocketStroe.socket.emit("mussemLocationUpdate", { lat: latitude, lon: longitude });
      }else if(socketActivatigLocation.socketActivatigLocation!=null||socketActivatigLocation.socketActivatigLocation!=undefined){

        socketActivatigLocation.socketActivatigLocation.emit("mussemLocationUpdate", { lat: latitude, lon: longitude });
      }

    },
    (error) => {
      console.error("위치 추적 에러:", error);
    },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
  );
};

// 3. 소켓 연결 및 초기 데이터 셋팅
onMounted(() => {

 
retrySocketStroe.socket.on("acceptRequest", (data) => {

  retrySocketStroe.socket.emit("acceptRequest", data); // 서버에 다시 요청해서 방에 참여
});







  if (typeof kakao === "undefined" || !kakao.maps) {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&libraries=services`;
    script.onload = () => {
      initMap();
      trackAndSendLocation();
    };
    document.head.appendChild(script);
  } else {
    initMap();
    trackAndSendLocation();
  }

 
});

onBeforeUnmount(() => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
 
});
</script>

<style scoped>
.log-panel {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  background: #fafafa;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
