<template>
  <div>
    <h1>현재 위치와 주소 간 거리 계산</h1>
    <div v-if="userLocation">
      <h2>나의 위치</h2>
      <p>위도: {{ userLocation.lat }}, 경도: {{ userLocation.lon }}</p>
      <p>주소: {{ userLocation.address }}</p>
    </div>
    <div v-if="addressLocation">
      <h2>카카오로부터 받은 위치</h2>
      <p>위도: {{ addressLocation.lat }}, 경도: {{ addressLocation.lon }}</p>
    </div>
    <div v-if="distance !== null">
      <h2>두 지점 간의 거리</h2>
      <p>{{ distance }} km</p>
    </div>
    <p v-else-if="errorMessage">오류 발생: {{ errorMessage }}</p>
    <p v-else>위치를 계산하는 중입니다...</p>
    <div id="map" style="width: 100%; height: 500px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';

const API_KEY = 'bf3a4b9e9374aa9b95f6e03305dd16eb'; // Kakao API Key
const url = 'https://dapi.kakao.com/v2/local/search/address.json';
const reverseGeocodeUrl = 'https://dapi.kakao.com/v2/local/geo/coord2address.json';

// 거리 계산을 위한 변수
const distance = ref(null);
const userLocation = ref(null); 
const addressLocation = ref(null); 
const errorMessage = ref(null); 

// 카카오맵 객체 및 마커 저장
let map = null;
let marker = null;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getAddressFromCoordinates(lat, lon) {
  try {
    const response = await axios.get(reverseGeocodeUrl, {
      params: { x: lon, y: lat },
      headers: { Authorization: `KakaoAK ${API_KEY}` }
    });
    if (response.data.documents && response.data.documents.length > 0) {
      const address = response.data.documents[0].address;
      return address;
    } else {
      return null;
    }
  } catch (error) {
    console.error('리버스 지오코딩 요청 실패:', error);
    return null;
  }
}

async function fetchAddressCoordinates() {
  try {
    const query = '경기 안양시 만안구 만안로 232';
    const response = await axios.get(url, {
      params: { query },
      headers: { Authorization: `KakaoAK ${API_KEY}` }
    });
    
    if (response.data.documents && response.data.documents.length > 0) {
      const data = response.data.documents[0];
      const addressLat = parseFloat(data.y); 
      const addressLon = parseFloat(data.x); 

      addressLocation.value = { lat: addressLat, lon: addressLon }; 

      userLocation.value = { lat: 37.4606, lon: 126.6633 }; 

      const userAddress = await getAddressFromCoordinates(userLocation.value.lat, userLocation.value.lon);
      if (userAddress) {
        userLocation.value.address = `${userAddress.region_1depth_name} ${userAddress.region_2depth_name} ${userAddress.region_3depth_name}`;
      } else {
        userLocation.value.address = '주소를 찾을 수 없습니다.';
      }

      const dist = haversine(userLocation.value.lat, userLocation.value.lon, addressLat, addressLon);
      distance.value = dist; 

      initMap(userLocation.value.lat, userLocation.value.lon);
      moveMarkerPeriodically();
    } else {
      console.error('주소 정보를 찾을 수 없습니다.');
      errorMessage.value = '주소를 찾을 수 없습니다.';
    }
  } catch (error) {
    console.error('API 요청 실패:', error);
    errorMessage.value = 'API 요청 실패. 다시 시도해 주세요.';
  }
}

// Kakao 맵 API 로드가 완료된 후 실행
function initMap(lat, lon) {
  if (typeof kakao === 'undefined' || !kakao.maps) {
    console.error('Kakao 맵 API 로딩 실패');
    return;
  }

  map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(lat, lon),
    level: 6,  // 지도 레벨 6 (도로가 선명히 보일 정도로 확대)
    mapTypeId: kakao.maps.MapTypeId.ROADMAP, // 도로 스타일
  });

  marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(lat, lon),
    map: map,
  });
}

let interval = null;
function moveMarkerPeriodically() {
  let lat = userLocation.value.lat;
  let lon = userLocation.value.lon;
  
  interval = setInterval(() => {
    lat += 0.0001;
    lon += 0.0001;
    
    const newPosition = new kakao.maps.LatLng(lat, lon);
    marker.setPosition(newPosition);
    map.setCenter(newPosition);

    userLocation.value.lat = lat;
    userLocation.value.lon = lon;

  }, 1000);
}

onBeforeUnmount(() => {
  if (interval) {
    clearInterval(interval);
  }
});

onMounted(() => {
  // Kakao API 로드 후 실행
  if (typeof kakao === 'undefined' || !kakao.maps) {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&libraries=services`;
    script.onload = () => {
      // Kakao API가 로드된 후 fetchAddressCoordinates 호출
      fetchAddressCoordinates();
    };
    document.head.appendChild(script);
  } else {
    fetchAddressCoordinates();
  }
});
</script>

<style scoped>
#map {
  width: 100%;
  height: 500px;
}
</style>
