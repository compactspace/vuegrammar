<template>
  <!-- 지도 + 현황 -->
  <div :class="['container', { column: isMobile }]">
    <!-- 지도 패널 -->
    <section class="map-panel">
      <header class="map-header">
        <div>
          <span>👷‍♂️ 고용주 실시간 위치 모니터링</span>
        </div>
        <div class="employer-address">
          📍 고용주 위치: <strong>{{ employerResolvedAddress }}</strong>
        </div>
      </header>
      <div id="map" class="map-container"></div>
    </section>

    <!-- 현황 패널 -->
    <section class="log-panel">
      <h2>🧑‍🌾 머슴 접근 현황</h2>
      <div class="current-info" v-if="mussemLocation">
        📍 고용주 위치: <strong>{{ employerResolvedAddress }}</strong>
        <p><strong>머슴 현재 위치:</strong> 위도 {{ mussemLocation.lat.toFixed(5) }}, 경도 {{ mussemLocation.lon.toFixed(5) }}</p>
        <p v-if="mussemAddress"><strong>주소:</strong> {{ mussemAddress }}</p>
        <p><strong>남은 거리:</strong> {{ remainingDistance }} m</p>
        <p><strong>예상 도착 시간:</strong> 약 {{ estimatedArrivalTime }} 분</p>
      </div>

      <h3 v-if="!isMobile">최근 위치 이동 경로</h3>
      <ul class="location-timeline" v-if="!isMobile">
        <li v-for="(loc, i) in recentLocations" :key="i">
          {{ new Date(loc.timestamp).toLocaleTimeString() }} — 위도 {{ loc.lat.toFixed(5) }}, 경도 {{ loc.lon.toFixed(5) }}
          <br />
          <span v-if="loc.address">📍 {{ loc.address }}</span>
          <span v-else>📍 주소 조회 중...</span>
        </li>
      </ul>
    </section>
  </div>

  <!-- ✅ 지도+현황 아래 고정 채팅창 (PC/모바일 공통) -->
<div class="chat-panel-inline">
  <h3>💬 채팅창</h3>
  <div class="chat-messages" ref="chatMessagesContainer">
    <p v-for="(msg, i) in chatMessages" :key="i">
      <strong>{{ msg.role === 'customer' ? '고용주' : '머슴' }}:</strong>
      {{ msg.message }}
    </p>
  </div>
 <div class="chat-form">
  <input
    type="text"
    v-model="newMessage"
    placeholder="메시지를 입력하세요..."
    @keydown.enter.prevent="sendMessage"
  />
  <button
    :disabled="!newMessage.trim()"
    @click="sendMessage"
    aria-label="메시지 전송"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="feather feather-send"
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  </button>
</div>

</div>
  <!-- 하단 고정 로딩 바 -->
  <div class="bottom-status-bar-fixed" v-if="mussemLocation" :style="{ '--progress': progressRatio }">
    {{ distanceStatusMessage }} (남은 거리: {{ remainingDistance }}m)
  </div>

</template>


<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useMediaQuery } from '@vueuse/core'
import { useUserStore } from "../stores/userStore.js"
import { useRetrySocketStroe } from '../stores/useRetrySocketStroe.js'
import { useLocationStore } from "../stores/useLocationStore.js"

const isMobile = useMediaQuery('(max-width: 768px)')
const retrySocketStroe = useRetrySocketStroe()
const userStore = useUserStore()
const locationStore = useLocationStore()

const API_KEY = 'bf3a4b9e9374aa9b95f6e03305dd16eb'

const role = userStore.authUser.userDetail.role
const myUserId = userStore.authUser.id
const mussemLocation = ref(null)
const mussemAddress = ref('')
const employerResolvedAddress = ref('')
const locationLogs = ref([])
const recentLocations = computed(() => locationLogs.value.slice(-5))
const chatMessages = ref([])
const chatMessagesContainer = ref(null)
const newMessage = ref('')
const addressCache = new Map()
const sendMessage = () => {


  if (!newMessage.value.trim()) return

//나중 그냥 소켓 도 만들어야함 에요 게니 네임스페이스 만들엇네

let messageData={   employment_id :userStore.unComplteEmploy.id,
    message: newMessage.value,
    sender_id : userStore.authUser.userDetail.id,
    role:userStore.authUser.userDetail.role,}


  retrySocketStroe.socket.emit('chatMessage',messageData)
 chatMessages.value.push(messageData)
   newMessage.value = ''
}

// 새 메시지 추가 시 스크롤을 아래로 내리기
watch(chatMessages, async () => {
  await nextTick()
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
  }
})
function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const remainingDistance = computed(() => {
  const employerLat = userStore.unComplteEmploy?.employer_latitude
  const employerLon = userStore.unComplteEmploy?.employer_longitude
  if (!mussemLocation.value || !employerLat || !employerLon) return 0
  return Math.round(calcDistance(
    employerLat,
    employerLon,
    mussemLocation.value.lat,
    mussemLocation.value.lon
  ))
})

const estimatedArrivalTime = computed(() => {
  if (!remainingDistance.value) return 0
  const avgSpeed = 500
  return Math.max(1, Math.round(remainingDistance.value / avgSpeed))
})

let map = null
let marker = null
let geocoder = null
let isMapInitialized = false

const updateAddress = (lat, lon, index = null) => {
  if (!geocoder) return
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  if (addressCache.has(key)) {
    const cached = addressCache.get(key)
    if (index !== null) locationLogs.value[index].address = cached
    else mussemAddress.value = cached
    return
  }

  geocoder.coord2Address(lon, lat, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const address = result[0].address.address_name || '주소 정보 없음'
      addressCache.set(key, address)
      if (index !== null) locationLogs.value[index].address = address
      else mussemAddress.value = address
    }
  })
}

const fetchEmployerAddressFromStore = () => {
  const lat = userStore.unComplteEmploy?.employer_latitude
  const lon = userStore.unComplteEmploy?.employer_longitude
  if (!geocoder && window.kakao?.maps?.services) {
    geocoder = new kakao.maps.services.Geocoder()
  }
  if (!geocoder || !lat || !lon) return
  const key = `${lat.toFixed(5)},${lon.toFixed(5)}`
  if (addressCache.has(key)) {
    employerResolvedAddress.value = addressCache.get(key)
    return
  }

  geocoder.coord2Address(lon, lat, (result, status) => {
    if (status === kakao.maps.services.Status.OK) {
      const address = result[0].address.address_name || '주소 정보 없음'
      addressCache.set(key, address)
      employerResolvedAddress.value = address
    }
  })
}

const initMap = (lat, lon) => {
  const position = new kakao.maps.LatLng(lat, lon)
  map = new kakao.maps.Map(document.getElementById('map'), {
    center: position,
    level: 3,
  })
  marker = new kakao.maps.Marker({ position, map })
  geocoder = new kakao.maps.services.Geocoder()
}

const initialDistance = ref(null)

watch(remainingDistance, (newVal) => {
  if (initialDistance.value === null && newVal > 0) {
    initialDistance.value = newVal
  }
})

const progressRatio = computed(() => {
  if (!initialDistance.value || !remainingDistance.value) return 0
  const ratio = 1 - (remainingDistance.value / initialDistance.value)
  return Math.min(Math.max(ratio, 0), 1)
})

const distanceStatusMessage = computed(() => {
  const p = progressRatio.value
  if (p >= 1) return '✅ 도착 완료! 머슴 임무 종료!'
  if (p >= 0.9) return '🛎️ 거의 다 왔습니다! 문 열 준비하세요'
  if (p >= 0.7) return '🐎 마지막 스퍼트! 고용주 근처입니다'
  if (p >= 0.5) return '🏃 절반 넘었습니다! 조금만 더~'
  if (p >= 0.2) return '🚶 착실히 이동 중입니다...'
  if (p > 0) return '🐢 이제 막 출발했어요'
  return '🕰️ 대기 중...'
})

onMounted(async () => {

 const ComplteEmployStatus=userStore?.unComplteEmploy?.status;
 
   const   userData=userStore?.authUser
    console.log(userData)
  const   unComplteEmploy=userStore?.unComplteEmploy
  let retryData={}
  retryData.userData=userData;
  retryData.unComplteEmploy=unComplteEmploy;
   
   
 
   if(ComplteEmployStatus!=undefined && ComplteEmployStatus==="in_progress"&&retrySocketStroe.socket===null){
   // retrySocketStroe.socket.off("successRequest");

    retrySocketStroe.connectSocket(retryData);
    const   employer_id =userStore.authUser.userDetail.id
    console.log(`employer_id: ${employer_id}`)
    retrySocketStroe.socket.emit(`requestJoinRetryRoom`,(data)=>{
      const {retryJoinRoom}=data;



// 성공 응답 리스너 (한 번만 등록)
 if(retryJoinRoom==="success"){
  retrySocketStroe.socket.on("successRequest", (data) => {
  console.log('재연결 성공')
  });    
         
      }else{
       // 실패 응답 리스너 (한 번만 등록)
  retrySocketStroe.socket.on("notFoundMussem", (data) => {
   
   console.log(notFoundMussem || "머슴이 먹튀");
  });

      }
    })

  }





  retrySocketStroe.socket.on("mussemLocation", (data) => {
    const { lat, lon } = data
    mussemLocation.value = { lat, lon }
    mussemAddress.value = ''
    const newLog = { lat, lon, timestamp: Date.now(), address: '' }
    locationLogs.value.push(newLog)

    updateAddress(lat, lon)
    updateAddress(lat, lon, locationLogs.value.length - 1)

    if (!isMapInitialized && kakao?.maps) {
      initMap(lat, lon)
      isMapInitialized = true
    } else if (marker && map) {
      const newPosition = new kakao.maps.LatLng(lat, lon)
      marker.setPosition(newPosition)
      map.setCenter(newPosition)
    }
  })

  // ✅ 채팅 내역 불러오기
  try {
    const employmentId = userStore.unComplteEmploy.id
    const res = await axios.get(`/users/employment/${employmentId}/chat`)
     
    chatMessages.value = res.data
  } catch (error) {
    console.error('채팅 내역 로딩 실패:', error)
  }

  // 지도 SDK 불러오기
  if (typeof kakao === 'undefined' || !kakao.maps) {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&libraries=services`
    script.onload = () => {
      if (mussemLocation.value) {
        initMap(mussemLocation.value.lat, mussemLocation.value.lon)
        isMapInitialized = true
        updateAddress(mussemLocation.value.lat, mussemLocation.value.lon)
      }
      fetchEmployerAddressFromStore()
    }
    document.head.appendChild(script)
  } else {
    if (mussemLocation.value) {
      initMap(mussemLocation.value.lat, mussemLocation.value.lon)
      isMapInitialized = true
      updateAddress(mussemLocation.value.lat, mussemLocation.value.lon)
    }
    fetchEmployerAddressFromStore()
  }
  retrySocketStroe.socket.on("chatMessage", (msg) => {
    chatMessages.value.push(msg);
  });
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  gap: 24px;
  height: 100%;
  min-height: 540px;
  padding: 24px;
  background: #f7f9fa;
  font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
}

.container.column {
  flex-direction: column;
  padding: 12px;
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
  min-height: 300px;
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

.container.column .log-panel {
  width: 100%;
  margin-top: 16px;
}

.log-panel h2,
.log-panel h3 {
  margin: 0 0 12px;
  font-weight: 600;
  color: #333;
}

.log-panel h2 {
  font-size: 18px;
  border-bottom: 2px solid #00c7ae;
  padding-bottom: 6px;
}

.log-panel h3 {
  font-size: 16px;
}

.current-info p {
  font-size: 16px;
  margin: 6px 0;
  color: #333;
}

.location-timeline {
  list-style: none;
  padding-left: 0;
  max-height: 140px;
  overflow-y: auto;
  font-size: 14px;
  color: #666;
  margin-top: 12px;
}

.location-timeline li {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}

/* ✅ 중간 채팅창 스타일 */
.chat-panel-inline {
  width: 100%;
  max-height: 400px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
}

.chat-panel-inline h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 700;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  font-size: 14px;
  margin-bottom: 10px;
  color: #444;
}

.chat-messages p {
  margin: 4px 0;
}

.chat-panel-inline input[type="text"] {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.3s ease;
}

.chat-panel-inline input[type="text"]:focus {
  border-color: #00c7ae;
}

/* ✅ 슬림한 바닥 고정 로딩바 */
.bottom-status-bar-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  color: white;
  padding: 0 20px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to right,
    #00d7b9 0%,
    #00d7b9 calc(var(--progress) * 100%),
    #008c7a calc(var(--progress) * 100%),
    #008c7a 100%
  );
  z-index: 999;
}


.chat-messages {
  max-height: 100px; /* 원하는 높이 조절 가능 */
  overflow-y: auto;
  font-size: 14px;
  margin-bottom: 10px;
  color: #444;
  padding-right: 8px; /* 스크롤 나올 때 텍스트 안 겹치게 */
  scrollbar-width: thin;
  scrollbar-color: #00c7ae #eee;
}

/* 크롬, 엣지, 사파리 스크롤바 스타일 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #eee;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: #00c7ae;
  border-radius: 3px;
}


.chat-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-form input[type="text"] {
  flex: 1;
  height: 40px;
  padding: 0 14px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 20px;
  outline: none;
  transition: border-color 0.3s ease;
}

.chat-form input[type="text"]:focus {
  border-color: #00c7ae;
}

.chat-form button {
  background-color: #00c7ae;
  border: none;
  color: white;
  width: 44px;
  height: 40px;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.chat-form button:disabled {
  background-color: #a0d9d3;
  cursor: not-allowed;
  color: #eee;
}

.chat-form button:hover:not(:disabled) {
  background-color: #009e8c;
}


/* 모바일 대응 */
@media (max-width: 768px) {
  .map-header {
    font-size: 16px;
    padding: 12px 16px;
  }

  .log-panel h2 {
    font-size: 16px;
  }

  .log-panel h3 {
    font-size: 14px;
  }

  .current-info p {
    font-size: 14px;
  }

  .location-timeline {
    font-size: 12px;
  }

  .chat-panel-inline {
    padding: 12px;
  }

  .chat-panel-inline h3 {
    font-size: 15px;
  }

  .chat-messages {
    font-size: 13px;
  }

  .chat-panel-inline input[type="text"] {
    font-size: 13px;
    padding: 8px 12px;
  }

  .bottom-status-bar-fixed {
    font-size: 13px;
    height: 42px;
  }
}

</style>
