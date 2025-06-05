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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Kakao API Key (접두사 KakaoAK 포함)
const API_KEY = 'KakaoAK bf3a4b9e9374aa9b95f6e03305dd16eb'; 
const url = 'https://dapi.kakao.com/v2/local/search/address.json'; // Kakao API URL
const reverseGeocodeUrl = 'https://dapi.kakao.com/v2/local/geo/coord2address.json'; // 리버스 지오코딩 API URL

// 거리 계산을 위한 변수
const distance = ref(null);
const userLocation = ref(null); // 사용자의 위치
const addressLocation = ref(null); // 카카오로부터 받은 주소의 위치
const errorMessage = ref(null); // 오류 메시지를 위한 변수

// 하버사인 공식 함수: 두 지점 사이의 거리 계산 (단위: km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 현재 위치를 가져오는 함수
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error)
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
}

// 리버스 지오코딩을 통해 위도, 경도에서 주소를 가져오는 함수
async function getAddressFromCoordinates(lat, lon) {
  try {
    const response = await axios.get(reverseGeocodeUrl, {
      params: { x: lon, y: lat },
      headers: { Authorization: API_KEY }
    });

    // 주소 정보 추출
    if (response.data.documents && response.data.documents.length > 0) {
      const address = response.data.documents[0].address;
      return address; // 예: { "region_1depth_name": "서울", "region_2depth_name": "강남구", "region_3depth_name": "역삼동" }
    } else {
      return null;
    }
  } catch (error) {
    console.error('리버스 지오코딩 요청 실패:', error);
    return null;
  }
}

// Kakao API에서 주소의 위도와 경도를 가져오는 함수
async function fetchAddressCoordinates() {
  try {
    const query = '경기 안양시 만안구 만안로 232'; // 검색할 주소
    const response = await axios.get(url, {
      params: { query },
      headers: { Authorization: API_KEY }
    });
    
    // 주소의 위도와 경도를 받아옴
    if (response.data.documents && response.data.documents.length > 0) {
      const data = response.data.documents[0];
      const addressLat = parseFloat(data.y); // 주소의 위도
      const addressLon = parseFloat(data.x); // 주소의 경도

      addressLocation.value = { lat: addressLat, lon: addressLon }; // 카카오 주소 위치 저장

      // 현재 위치 받아오기
      const currentPosition = await getCurrentLocation();
      const userLat = currentPosition.coords.latitude;
      const userLon = currentPosition.coords.longitude;

      userLocation.value = { lat: userLat, lon: userLon }; // 사용자의 위치 저장

      // 리버스 지오코딩으로 사용자 위치의 주소 얻기
      const userAddress = await getAddressFromCoordinates(userLat, userLon);
      if (userAddress) {
        userLocation.value.address = `${userAddress.region_1depth_name} ${userAddress.region_2depth_name} ${userAddress.region_3depth_name}`;
      } else {
        userLocation.value.address = '주소를 찾을 수 없습니다.';
      }

      // 두 지점 간 거리 계산
      const dist = haversine(userLat, userLon, addressLat, addressLon);
      distance.value = dist; // 거리 값 업데이트
    } else {
      console.error('주소 정보를 찾을 수 없습니다.');
      errorMessage.value = '주소를 찾을 수 없습니다.';
    }
  } catch (error) {
    console.error('API 요청 실패:', error);
    if (error.code === 1) {
      // 위치 권한 거부시 메시지 처리
      errorMessage.value = '위치 권한을 허용하지 않았습니다. 위치를 허용해 주세요.';
    } else {
      // 다른 에러 처리
      errorMessage.value = 'API 요청 실패. 다시 시도해 주세요.';
    }
  }
}

// 컴포넌트가 마운트될 때 주소 검색 및 거리 계산 시작
onMounted(() => {
  fetchAddressCoordinates();
});
</script>
