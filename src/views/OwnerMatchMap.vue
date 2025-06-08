<template>
  <div>
    <button @click="findAddress">현재 주소 확인</button>
    <p v-if="address">📍 {{ address }}</p>
 <p v-if="address">📍 {{ coordinate }}</p>
    
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLocationStore } from '../stores/useLocationStore';

const locationStore = useLocationStore();
const address = ref('');
const coordinate=ref({})

const findAddress = async () => {
  try {
    const location = await locationStore.getCurrentLocation();
    const geocoder = new kakao.maps.services.Geocoder();
    coordinate.value={lat:location.lat, lon:location.lon}
    const coord = new kakao.maps.LatLng(location.lat, location.lon);

    geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const info = result[0].address.address_name; // 또는 result[0].road_address.address_name
        address.value = info;
      } else {
        console.error('주소 변환 실패:', status);
      }
    });
  } catch (error) {
    console.error('위치 또는 주소 가져오기 실패:', error);
  }
};
</script>
