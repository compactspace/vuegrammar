<template>
  <div class="location-wrapper">
    <input
      type="text"
      v-model="location"
      placeholder="현재 주소를 입력해주세요"
      class="location-input"
    />
    <button @click="getCurrentLocation" title="현재 위치 가져오기">📍</button>
    <button @click="openDaumPostcode" title="주소 검색">🔍</button>

    <transition name="modal-fade">
      <div v-if="showPostcode" class="modal-overlay" @click.self="closePostcode">
        <div class="modal-content">
          <button class="close-btn" @click="closePostcode" aria-label="닫기">✕</button>
          <div id="postcode-container" class="postcode-container"></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useStoreMyLocation } from '../../stores/useStoreMyLocation.js'
const store = useStoreMyLocation();

const location = ref('')
const showPostcode = ref(false)
const isDaumLoaded = ref(false)

const FULL_PROVINCE_NAMES = {
  '서울': '서울특별시',
  '부산': '부산광역시',
  '대구': '대구광역시',
  '인천': '인천광역시',
  '광주': '광주광역시',
  '대전': '대전광역시',
  '울산': '울산광역시',
  '세종': '세종특별자치시',
  '경기': '경기도',
  '강원': '강원특별자치도',
  '충북': '충청북도',
  '충남': '충청남도',
  '전북': '전라북도',
  '전남': '전라남도',
  '경북': '경상북도',
  '경남': '경상남도',
  '제주': '제주특별자치도'
}

onMounted(() => {
  const script = document.createElement('script')
  script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
  script.async = true
  script.onload = () => {
    isDaumLoaded.value = true
  }
  document.body.appendChild(script)
})

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('이 브라우저는 위치 정보를 지원하지 않습니다.')
    return
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      const fullAddress = await reverseGeocode(latitude, longitude)
      if (fullAddress) location.value = fullAddress
      else alert('주소를 찾을 수 없습니다.')
    },
    (error) => {
      alert('위치 정보를 가져오는 데 실패했습니다: ' + error.message)
    }
  )
}

async function reverseGeocode(lat, lng) {
  console.log(`위도: ${lat}, 경도: ${lng}`)
  const kakaoApiKey = 'bf3a4b9e9374aa9b95f6e03305dd16eb' // ← 본인 키로 교체
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
        mode: 'cors',
      }
    )
    const data = await res.json()
    if (data.documents && data.documents.length > 0) {
      const address = data.documents[0].address
      const { address_name, region_1depth_name } = address
      const fullProvince = FULL_PROVINCE_NAMES[region_1depth_name] || region_1depth_name
      const updatedAddress = address_name.replace(region_1depth_name, fullProvince)
      store.setMyLocation(fullProvince)
      store.setCoordinates({ latitude: lat, longitude: lng })
      return updatedAddress
    }
    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

async function getGeocodeFromAddress(address) {
  const kakaoApiKey = 'bf3a4b9e9374aa9b95f6e03305dd16eb' // ← 본인 키로 교체
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
        mode: 'cors',
      }
    )
    const data = await res.json()
    if (data.documents.length > 0) {
      const { x, y } = data.documents[0] // x: 경도, y: 위도
      return { latitude: y, longitude: x }
    }
    return null
  } catch (e) {
    console.error('좌표 변환 실패:', e)
    return null
  }
}

const openDaumPostcode = async () => {
  if (!isDaumLoaded.value) {
    alert('주소 검색 기능을 불러오는 중입니다. 잠시만 기다려주세요.')
    return
  }

  showPostcode.value = true
  await nextTick()

  new window.daum.Postcode({
    async oncomplete(data) {
      console.log(data)

      const firstAdmin = data.query.trim().split(' ')[0]
      const twoAdmin = data.query.trim().split(' ')[1]
      const thirdAdmin = data.query.trim().split(' ')[2]
      let areaAray = [firstAdmin, twoAdmin, thirdAdmin]
      console.log(`1차: ${firstAdmin}  2차: ${twoAdmin}  3차: ${thirdAdmin}`)

      store.setMyLocation(areaAray)

      const base = data.query.trim()
      const full = data.address.trim()
      const detail = full.replace(data.sido + ' ' + data.sigungu, '').trim()
      const finalAddress = `${base} ${detail}`.trim()

      location.value = finalAddress
      showPostcode.value = false

      // 위도 경도 변환 추가
      const coords = await getGeocodeFromAddress(finalAddress)
      if (coords) {
        console.log(`📌 위도: ${coords.latitude}, 경도: ${coords.longitude}`)
        store.setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude
        })
      } else {
        console.warn('⚠️ 주소에 해당하는 좌표를 찾지 못했습니다.')
      }
    },
    onclose() {
      showPostcode.value = false
    },
  }).embed(document.getElementById('postcode-container'))
}

const closePostcode = () => {
  showPostcode.value = false
}
</script>


<style scoped>
.location-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;
}

.location-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  outline-offset: 2px;
}

button {
  background: #007bff;
  border: none;
  color: white;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  user-select: none;
  transition: background-color 0.3s ease;
}

button:hover {
  background: #0056b3;
}

/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 30, 30, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
}

/* 모달 내용 */
.modal-content {
  position: relative;
  width: 420px;
  max-width: 100%;
  height: 520px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

/* 닫기 버튼 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #6b7280;
  cursor: pointer;
  z-index: 10;
  padding: 0;
  user-select: none;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #ef4444;
}

/* 다음 우편번호 영역 스타일 조정 */
.postcode-container {
  flex-grow: 1;
  border: none;
}

/* 애니메이션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
