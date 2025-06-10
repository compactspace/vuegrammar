<template>
  <div class="layout-wrapper">
    <!-- 1행: 지도 + 상태 패널 -->
    <div class="top-row">
      <div class="map-area" id="map"></div>

      <div class="info-panel">
        <section class="status-panel">
          <h2>🧑‍🌾 머슴 이동 중</h2>
          <p>고용주에게 가는 중입니다...</p>
          <p><strong>현재 위치:</strong> 위도 {{ userLocation.lat.toFixed(4) }}, 경도 {{ userLocation.lon.toFixed(4) }}</p>
        </section>
      </div>
    </div>

    <!-- 2행: 진행 상태 바 + 채팅창 -->
    <div class="bottom-row">
      <div class="progress-bar">
        <div class="step active">이동 중</div>
        <div class="step">근처 도착</div>
        <div class="step">도착 완료</div>
      </div>

      <!-- 💬 채팅창 -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="feather feather-send">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick,watch } from 'vue';
import axios from 'axios';
import { useStoreSocketActivatigLocation } from "../stores/useStoreSocketActivatigLocation.js";
import { useRetrySocketStroe } from "../stores/useRetrySocketStroe.js";
import { useUserStore } from "../stores/userStore.js";

const socketActivatigLocation = useStoreSocketActivatigLocation();
const retrySocketStroe = useRetrySocketStroe();
const userStore = useUserStore();

const API_KEY = "YOUR_KAKAO_MAP_API_KEY";

const userLocation = ref({ lat: 37.4606, lon: 126.6633 });
const chatMessages = ref([]);
const chatMessagesContainer = ref(null);
const newMessage = ref('');
let map = null;
let marker = null;
let watchId = null;

const sendMessage = () => {
  if (!newMessage.value.trim()) return;

 let messageData={   employment_id :userStore.unComplteEmploy.id,
    message: newMessage.value,
    sender_id : userStore.authUser.userDetail.id,
    role:userStore.authUser.userDetail.role,}


  retrySocketStroe.socket.emit('chatMessage',messageData)
 chatMessages.value.push(messageData)
   newMessage.value = ''
}

watch(chatMessages, async () => {
  await nextTick();
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
  }
});

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

const trackAndSendLocation = () => {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      userLocation.value = { lat: latitude, lon: longitude };

      const latLng = new kakao.maps.LatLng(latitude, longitude);
      if (marker && map) {
        marker.setPosition(latLng);
        map.setCenter(latLng);
      }

      const payload = { lat: latitude, lon: longitude };
      if (retrySocketStroe.socket) {
        retrySocketStroe.socket.emit("mussemLocationUpdate", payload);
      } else if (socketActivatigLocation.socketActivatigLocation) {
        socketActivatigLocation.socketActivatigLocation.emit("mussemLocationUpdate", payload);
      }
    },
    (error) => console.error("위치 추적 에러:", error),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
  );
};

onMounted(async () => {


  if (retrySocketStroe.socket) {
    retrySocketStroe.socket.on("acceptRequest", (data) => {
    //  console.log("새로고침의 요청 받음")
      retrySocketStroe.socket.emit("acceptRequest", data);
    });
  }

  try {
   
    const employmentId = userStore.unComplteEmploy.id;
    const res = await axios.get(`/mussem/employment/${employmentId}/chat`);

    chatMessages.value = res.data;
  } catch (error) {
    console.error("채팅 내역 로딩 실패:", error);
  }

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

  retrySocketStroe.socket.on("chatMessage", (msg) => {
    chatMessages.value.push(msg);
  });
});

onBeforeUnmount(() => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
});
</script>

<style scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  max-width: 1000px;
  margin: auto;
}

.top-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 지도 */
.map-area {
  width: 100%;
  height: 400px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 상태 패널 */
.status-panel {
  background: #f2fff2;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
}

.bottom-row {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.step {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  font-size: 0.85rem;
  border-bottom: 3px solid #ccc;
  color: #777;
}

.step.active {
  border-color: #00c471;
  font-weight: bold;
  color: #00c471;
}

/* ✅ 채팅 패널 */
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
  max-height: 100px;
  overflow-y: auto;
  font-size: 14px;
  margin-bottom: 10px;
  color: #444;
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: #00c7ae #eee;
}

.chat-messages p {
  margin: 4px 0;
}

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
  border-color: #00c471;
}

.chat-form button {
  background: #00c471;
  border: none;
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.chat-form button:hover {
  background: #00a85a;
}

.chat-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 데스크탑 대응 */
@media screen and (min-width: 768px) {
  .top-row {
    flex-direction: row;
  }

  .map-area {
    flex: 2;
    height: 500px;
  }

  .info-panel {
    flex: 1;
    padding-left: 1rem;
  }

  .chat-panel-inline {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
