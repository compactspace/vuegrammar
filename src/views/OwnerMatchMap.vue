<template>
  <div class="container">
    <section class="map-panel">
      <header class="map-header">
        <span v-if="role === 'employer'">👷‍♂️ 고용주 실시간 위치 모니터링</span>
        <span v-else-if="role === 'worker'">🧑‍🌾 머슴 실시간 위치 모니터링</span>
        <span v-else>📍 실시간 위치 모니터링</span>
      </header>
      <div id="map" class="map-container"></div>
    </section>

    <section class="log-panel">
      <h2>🧑‍🌾 머슴 접근 현황</h2>
      <div class="current-info" v-if="mussemLocation">
        <p><strong>머슴 현재 위치:</strong> 위도 {{ mussemLocation.lat.toFixed(5) }}, 경도 {{ mussemLocation.lon.toFixed(5) }}</p>
        <p v-if="mussemAddress"><strong>주소:</strong> {{ mussemAddress }}</p>
        <p><strong>남은 거리:</strong> {{ remainingDistance }} m</p>
        <p><strong>예상 도착 시간:</strong> 약 {{ estimatedArrivalTime }} 분</p>
      </div>

      <h3>최근 위치 이동 경로</h3>
      <ul class="location-timeline">
        <li v-for="(loc, i) in recentLocations" :key="i">
          {{ new Date(loc.timestamp).toLocaleTimeString() }} —
          위도 {{ loc.lat.toFixed(5) }}, 경도 {{ loc.lon.toFixed(5) }}
          <br />
          <span v-if="loc.address">📍 {{ loc.address }}</span>
          <span v-else>📍 주소 조회 중...</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from "../stores/userStore.js";
import { useRetrySocketStroe } from '../stores/useRetrySocketStroe.js';
import { useLocationStore } from "../stores/useLocationStore.js";

const retrySocketStroe = useRetrySocketStroe();
const userStore = useUserStore();

const API_KEY = 'bf3a4b9e9374aa9b95f6e03305dd16eb';

const role = userStore.role;
const locationStore = useLocationStore();

const employerLocation = computed(() => locationStore.userLocation);
const mussemLocation = ref(null);
const mussemAddress = ref('');

const locationLogs = ref([]);
const recentLocations = computed(() => locationLogs.value.slice(-5));

// 주소 캐싱
const addressCache = new Map();

// 거리 계산
function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const remainingDistance = computed(() => {
  if (!mussemLocation.value || !employerLocation.value) return 0;
  return Math.round(calcDistance(
    employerLocation.value.lat,
    employerLocation.value.lon,
    mussemLocation.value.lat,
    mussemLocation.value.lon
  ));
});

const estimatedArrivalTime = computed(() => {
  if (!remainingDistance.value) return 0;
  const avgSpeed = 500;
  return Math.max(1, Math.round(remainingDistance.value / avgSpeed));
});

let map = null;
let marker = null;
let geocoder = null;
let isMapInitialized = false;

// 주소 업데이트 함수
const updateAddress = (lat, lon, index = null) => {
  if (!geocoder) return;
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
  if (addressCache.has(key)) {
    const cachedAddress = addressCache.get(key);
    if (index !== null) locationLogs.value[index].address = cachedAddress;
    return;
  }

  geocoder.coord2Address(lon, lat, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const address = result[0].address.address_name || '주소 정보 없음';
      addressCache.set(key, address);
      if (index !== null) locationLogs.value[index].address = address;
    } else {
      console.error("역지오코딩 실패:", status);
    }
  });
};

const initMap = (lat, lon) => {
  const position = new kakao.maps.LatLng(lat, lon);
  map = new kakao.maps.Map(document.getElementById('map'), {
    center: position,
    level: 3,
  });
  marker = new kakao.maps.Marker({
    position,
    map,
  });

  geocoder = new kakao.maps.services.Geocoder();
};

onMounted(() => {
  retrySocketStroe.socket.on("mussemLocation", (data) => {
    const { lat, lon } = data;
    mussemLocation.value = { lat, lon };
    mussemAddress.value = ''; // 초기화 후 업데이트

    const newLog = { lat, lon, timestamp: Date.now(), address: '' };
    locationLogs.value.push(newLog);

    updateAddress(lat, lon); // 현재 위치 주소
    updateAddress(lat, lon, locationLogs.value.length - 1); // 최근 기록용 주소

    if (!isMapInitialized && kakao?.maps) {
      initMap(lat, lon);
      isMapInitialized = true;
    } else if (marker && map) {
      const newPosition = new kakao.maps.LatLng(lat, lon);
      marker.setPosition(newPosition);
      map.setCenter(newPosition);
    }
  });

  if (typeof kakao === 'undefined' || !kakao.maps) {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&libraries=services`;
    script.onload = () => {
      if (mussemLocation.value) {
        initMap(mussemLocation.value.lat, mussemLocation.value.lon);
        isMapInitialized = true;
        updateAddress(mussemLocation.value.lat, mussemLocation.value.lon);
      }
    };
    document.head.appendChild(script);
  } else {
    if (mussemLocation.value) {
      initMap(mussemLocation.value.lat, mussemLocation.value.lon);
      isMapInitialized = true;
      updateAddress(mussemLocation.value.lat, mussemLocation.value.lon);
    }
  }
});
</script>
