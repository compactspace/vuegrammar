<template>
  <div>
    <h1>실시간 위치 추적</h1>
    <p>현재 위치:</p>
    <p v-if="location">위도: {{ location.latitude }}, 경도: {{ location.longitude }}</p>
    <p v-else>위치를 추적 중...</p>
    <p>위치가 변경될 때마다 실시간으로 업데이트됩니다.</p>

    <!-- 카카오 맵을 표시할 div -->
    <div id="map" style="width:100%; height:400px; margin-top: 20px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 위치 상태를 저장할 ref
const location = ref(null)
const map = ref(null)
const marker = ref(null)
const path = ref([])  // 이동 경로 저장

// 카카오 맵 SDK 로딩 여부 체크
const loadKakaoMap = () => {
  if (window.kakao && window.kakao.maps) {
    console.log("Kakao Map SDK 로드 완료");
    startTracking();
  } else {
    const script = document.createElement("script");
    script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=bf3a4b9e9374aa9b95f6e03305dd16eb&autoload=true";
    script.onload = () => {
      console.log("Kakao Map SDK 로딩 시작...");
      startTracking();
    };
    document.head.appendChild(script);
  }
}

// 위치 추적을 시작하는 함수
const startTracking = () => {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, maximumAge: 10000 });
  } else {
    console.error('Geolocation을 지원하지 않는 브라우저입니다.');
  }
}

// 위치를 성공적으로 받아온 경우
const success = (position) => {
  const { latitude, longitude } = position.coords;
  location.value = { latitude, longitude };
  console.log(`현재 위치: 위도 = ${latitude}, 경도 = ${longitude}`);

  if (!map.value) {
    initMap(latitude, longitude);
  } else {
    updateLocation(latitude, longitude);
  }
}

// 위치를 가져오는 중 오류가 발생한 경우
const error = (err) => {
  console.error('위치를 가져오는 데 실패했습니다.', err);
}

// 카카오 맵 초기화
const initMap = (lat, lng) => {
  const container = document.getElementById('map');
  const options = {
    center: new kakao.maps.LatLng(lat, lng),
    level: 3,
  };

  map.value = new kakao.maps.Map(container, options);

  marker.value = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(lat, lng),
    map: map.value,
  });

  // 이동 경로 저장
  path.value.push(new kakao.maps.LatLng(lat, lng));
}

// 위치 업데이트
const updateLocation = (lat, lng) => {
  const newPos = new kakao.maps.LatLng(lat, lng);
  marker.value.setPosition(newPos);  // 마커 위치 갱신
  map.value.setCenter(newPos);  // 맵 중심 이동

  path.value.push(newPos);  // 경로에 새로운 위치 추가

  // Polyline로 경로 그리기
  const polyline = new kakao.maps.Polyline({
    map: map.value,
    path: path.value,
    strokeWeight: 5,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeStyle: 'solid'
  });
}

onMounted(() => {
  loadKakaoMap();
});
</script>

<style scoped>
p {
  font-size: 18px;
  margin: 10px 0;
}
</style>
