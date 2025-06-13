<template>


<!-- 취소 사유 입력용 모달 -->
<div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
  <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <p id="modal-title" class="modal-text">
      정말 작업을 취소하시겠습니까? <br> 아래에 사유를 입력해주세요.
    </p>

    <textarea
      v-model="cancelReason"
      placeholder="예: 급한 개인 사정, 위치 오류 등"
      class="cancel-textarea"
      rows="4"
    ></textarea>

    <div class="modal-buttons">
      <button class="modal-close-btn" @click="confirmCancel" :disabled="!cancelReason.trim()">확인</button>
      <button class="modal-close-btn cancel" @click="closeModal">닫기</button>
    </div>
  </div>
</div>



  <div class="layout-wrapper">
    <!-- 1행: 지도 + 상태 패널 -->
    <div class="top-row">
      <div class="map-area" id="map"></div>

      <div class="info-panel">
        <section class="status-panel">
          <h2>🧑‍🌾 {{ currentStatusLabel }}</h2>
          <p>{{ statusDescription }}</p>
          <p><strong>현재 위치:</strong> 위도 {{ userLocation.lat.toFixed(4) }}, 경도 {{ userLocation.lon.toFixed(4) }}</p>

          <!-- 상태 전환 버튼들 인데 불분명하니 추후 지워라 -->
          <!-- <div class="status-buttons">
            <button
              v-for="(btn, idx) in availableActions"
              :key="idx"
              class="status-button"
              @click="handleAction(btn.action)"
            >
             뭐지 {{ btn.label }}
            </button>
          </div> -->

          <!-- 취소 버튼 (항상 우측) -->
          <div class="cancel-section">
            <button class="cancel-button" @click="closeModal">❌ 작업 취소</button>
          </div>
        </section>
      </div>
    </div>

    <!-- 2행: 진행 상태 바 + 채팅창 -->
    <div class="bottom-row">
      <div class="progress-bar">
        {{ currentStatus }}
        <div class="step" :class="{ active: currentStatus === STATUS.MOVING }">이동 중</div>
        <div class="step" :class="{ active: currentStatus === STATUS.NEARBY }">근처 도착</div>
        <div class="step" :class="{ active: currentStatus === STATUS.ARRIVED }">도착 완료</div>
        <div class="step" :class="{ active: currentStatus === STATUS.WORKING }">작업 중</div>
        <div class="step" :class="{ active: currentStatus === STATUS.COMPLETED }">완료</div>
      </div>

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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
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

const showModal = ref(false)

const cancelReason = ref('');
let map = null;
let marker = null;
let watchId = null;

// 💡 상태 정의
const STATUS = {
  MOVING: 'moving',
  NEARBY: 'nearby',
  ARRIVED: 'arrived',
  WORKING: 'working',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
};

const currentStatus = ref(STATUS.MOVING);

const currentStatusLabel = computed(() => {
  switch (currentStatus.value) {
    case STATUS.MOVING: return '머슴 이동 중';
    case STATUS.NEARBY: return '근처 도착';
    case STATUS.ARRIVED: return '도착 완료';
    case STATUS.WORKING: return '작업 중';
    case STATUS.COMPLETED: return '작업 완료';
    case STATUS.CANCELED: return '작업 취소됨';
    default: return '';
  }
});

const statusDescription = computed(() => {
  switch (currentStatus.value) {
    case STATUS.MOVING: return '고용주에게 가는 중입니다...';
    case STATUS.NEARBY: return '고용주 위치 근처에 도착했습니다.';
    case STATUS.ARRIVED: return '고용주 댁에 도착했습니다.';
    case STATUS.WORKING: return '작업을 수행 중입니다.';
    case STATUS.COMPLETED: return '작업이 완료되었습니다.';
    case STATUS.CANCELED: return '작업이 취소되었습니다.';
    default: return '';
  }
});

const availableActions = computed(() => {
  
  switch (currentStatus.value) {
    
    case STATUS.NEARBY:
      return [
        { label: '도착 완료', action: STATUS.ARRIVED },
      ];
    case STATUS.ARRIVED:
      return [
        { label: '작업 시작', action: STATUS.WORKING },
      ];
    case STATUS.WORKING:
      return [
        { label: '작업 완료', action: STATUS.COMPLETED },
      ];
    default:
      return [];
  }
});

// const handleAction = (newStatus) => {

//   currentStatus.value = newStatus;

//   retrySocketStroe.socket.emit("updateStatus", {
//     employment_id: userStore.unComplteEmploy.id,
//     newStatus: newStatus,
//   });
// };


// 취소시 다음 스탭으로

// 먼저 머슴 또는 고용주 의 조회 조건이  이기 때문에=> select * from mussem as m inner join employment as e on m.user_id=e.mussem_id where e.mussem_id=$1  and e.status='in_progress';

// 해당 현재 고용고유번호의 employment status=CANCELED where id=현재매칭 고유번호 한다.

// 그리고 지금 페이지는 머슴이니 머슴으로 employment_cancel 테이블에 인설트를 한다.

// 그리고 고용주에게 취소되었다고 에밋 한다. 그리고 적절히 모달을 띄우게 한다.

// 우선 db와 소켓은 건들지 말고 프론트만 테스트 해보자.


const handleCancel = () => {
  showModal.value = true;
};

const confirmCancel = () => {
  
  if (!cancelReason.value.trim()) {
    alert("취소 사유를 입력해주세요.");
    return;
  }

  currentStatus.value = STATUS.CANCELED;

  retrySocketStroe.socket.emit("updateStatus", {
    employment_id: userStore.unComplteEmploy.id,
    newStatus: STATUS.CANCELED,
    reason: cancelReason.value, // 취소 사유 포함 전송
   canceled_by_id:userStore.authUser.userDetail.id,
   canceled_by_type:userStore.authUser.userDetail.role
  });

  showModal.value = false;
  cancelReason.value = '';
  userStore.setUnComplteEmploy({})
retrySocketStroe.disconnectSocket();
  router.push("/mussemMain");
};
const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  const messageData = {
    employment_id: userStore.unComplteEmploy.id,
    message: newMessage.value,
    sender_id: userStore.authUser.userDetail.id,
    role: userStore.authUser.userDetail.role,
  };

  retrySocketStroe.socket.emit('chatMessage', messageData);
  chatMessages.value.push(messageData);
  newMessage.value = '';
};

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

/**
 * @param  lat1, lon1, 머슴 의 위도 경도
 * @param  lat2, lon2, 고정된 고용주의 위도 경도
 * @returns 고정된 고용주로부터의 거리를 리턴
 */
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};



// 실행순서

//onMounted => trackAndSendLocation():userLocation(머슴=이동중인나의 반응형객체값을 변경) 
//=> 컴퓨티드가 반응 => calcDistance() 계산값을  변수 remainingDistance에 담아 반응형객체로  리턴
//=> watch가 감시 => 반응형객체 initialDistance를 초기화
//=> initialDistance를 초기화 가 트리거 되어 
//=> 컴퓨티트가 실행되어  변수  progressRatio에  상태메시지 를  담은 반응형 객체를 리턴
//=> 
const remainingDistance = computed(() => {
  const employerLat = userStore.unComplteEmploy?.employer_latitude;
  const employerLon = userStore.unComplteEmploy?.employer_longitude;

  if (!userLocation.value.lat || !userLocation.value.lon || !employerLat || !employerLon) {
    return 0;
  }

  return Math.round(
    calcDistance(
      userLocation.value.lat,
      userLocation.value.lon,
      employerLat,
      employerLon
    )
  );
});
const initialDistance = ref(null);
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

watch(progressRatio, (p) => {

  if (p >= 1) {
    currentStatus.value = STATUS.ARRIVED;
  } else if (p >= 0.9) {
    currentStatus.value = STATUS.NEARBY;
  } else if (p >= 0.7) {
    currentStatus.value = STATUS.NEARBY;
  } else if (p >= 0.5) {
    currentStatus.value = STATUS.NEARBY;
  } else if (p >= 0.2) {
    currentStatus.value = STATUS.MOVING;
  } else if (p > 0) {
    currentStatus.value = STATUS.MOVING;
  } else {
    currentStatus.value = STATUS.MOVING;
  }
});










onMounted(async () => {

  if (retrySocketStroe.socket) {
    retrySocketStroe.socket.on("acceptRequest", (data) => {
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
    alert(msg)
    chatMessages.value.push(msg);
  });
});

onBeforeUnmount(() => {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
});


// 모달 닫기 함수
const closeModal=()=>{
  showModal.value = ! showModal.value

}

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

/* 상태 전환 버튼들 */
.status-buttons {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-button {
  padding: 0.5rem 1rem;
  background: #00c471;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.status-button:hover {
  background: #009a5e;
}

/* 취소 버튼 영역 */
.cancel-section {
  margin-top: 1rem;
  text-align: right;
}

.cancel-button {
  background: #ff4d4f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.cancel-button:hover {
  background: #d9363e;
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


.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.25); /* 은은한 어둠 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px); /* 흐림 효과로 은은하게 */
}

.modal-content {
  background: #fffefc;
  padding: 24px 32px;
  border-radius: 14px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-weight: 600;
  color: #444;
}

.modal-text {
  font-size: 1.1rem;
  margin-bottom: 24px;
  line-height: 1.5;
}

.modal-close-btn {
  background-color: #6c63ff; /* 부드러운 보라색 */
  color: white;
  font-weight: 700;
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.modal-close-btn:hover {
  background-color: #574fd6;
}
.cancel-textarea {
  width: 100%;
  resize: none;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  outline: none;
}

.cancel-textarea:focus {
  border-color: #00c471;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.modal-close-btn.cancel {
  background-color: #ccc;
}

.modal-close-btn.cancel:hover {
  background-color: #999;
}

</style>
