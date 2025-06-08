<template>
  <div class="mussem-dashboard">
    <header class="status-header">
      <h2>
        🧑‍🌾 {{ userName }}님, 오늘도 한 몸 불살라 보아요!
        <span
          v-if="userLocation && userLocation.lat != null && userLocation.lon != null"
          class="user-location"
        >
          📍 위도: {{ userLocation.lat.toFixed(5) }}, 경도:
          {{ userLocation.lon.toFixed(5) }}
        </span>
      </h2>

      <div class="region-select-wrapper">
        <label for="regionSelect">활동할 지역 선택:</label>
      
        <select
          id="regionSelect"
          v-model="joinInfo.regions"
          :class="{ error: showError }"         
        >
          <option value="" disabled>지역을 선택하세요</option>
          <option v-for="region in regions" :key="region" :value="region">
            {{ region }}
          </option>
        </select>
        <p v-if="showError" class="error-message">⚠️ 활동할 지역을 선택해주세요!</p>
      </div>

      <div class="status-box">
        <span>
          현재 상태:
          <strong :class="statusClass">
            {{ isOnline ? "🔥 불타는 중" : "💤 낮잠 자는 중" }}
          </strong>
        </span>
        <button @click="toggleStatus" class="toggle-button" :disabled="!joinInfo.regions">
          {{ isOnline ? "🛌 살짝 눕기" : "🚀 불끈불끈 활동 시작!" }}
        </button>
      </div>
    </header>

    <section v-if="isOnline" class="suggestion-section">
      <h3>📦 지금 이건 어때요?</h3>
      <div v-if="suggestedTasks.length">
        <TaskCard
          v-for="task in suggestedTasks"
          :key="task.id"
          :task="task"
          @accept="acceptTask(task.id)"
        />
      </div>
      <p v-else>추천 작업이 없습니다. 잠시만 기다려 주세요 🙏</p>
    </section>

    <footer class="dashboard-footer">
      <router-link to="/mussem/my-jobs">🧾 내 작업 내역</router-link>
      <router-link to="/mussem/settings">⚙️ 설정</router-link>
    </footer>

    <!-- 고용 요청 알림 -->
    <transition name="slide">
      <div v-if="hireAlert.visible" class="hire-alert">
        <p>👤 <strong>{{ hireAlert.fromCustomerEmail }}</strong> 고객님께서 고용을 요청하셨습니다!</p>
        <div class="btn-group">
          <button @click="acceptHire">✅ 수락하기</button>
          <button @click="rejectHire">❌ 거절하기</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount ,watchEffect} from "vue";
import TaskCard from "../components/MussemTaskCard/TaskCard.vue";
import { useUserStore } from "../stores/userStore.js";
import { useLocationStore } from "../stores/useLocationStore.js";
import { useSocketStore } from "../stores/socketStore.js";
import { useStoreSocketActivatigLocation } from "../stores/useStoreSocketActivatigLocation.js";
import { useRouter } from 'vue-router';
import { useRetrySocketStroe } from "../stores/useRetrySocketStroe";
const router = useRouter();

const userStore = useUserStore();
const mussemActivatigLocation = useLocationStore();
const socketActivatigLocation = useStoreSocketActivatigLocation();
const socketStore = useSocketStore();
const retrySocketStore=useRetrySocketStroe();

const userName = userStore.authUser.userDetail.name || "철수 머슴"; // 이름 맞게 수정
const role = userStore.authUser.userDetail.role;
const roomId = userStore.authUser.userDetail.email;
const mussemPk = userStore.authUser.userDetail.id;
const userLocation = computed(() => mussemActivatigLocation.userLocation);

const regions = ref([]);
const showError = ref(false);
const joinInfo = ref({
  regions: "",
  email: roomId,
});

const isOnline = ref(false);
const statusClass = computed(() => (isOnline.value ? "online" : "offline"));

const suggestedTasks = ref([]);

const hireAlert = ref({
  visible: false,
  fromCustomerEmail: "",
});

// 방 및 역할 초기값
const createRoom = {
  role,
  roomId,
};

const acceptHire = () => {
  if (!mussemActivatigLocation.isTrackingLocation) {
  alert("⚠️ 활동 시작 후에만 고용을 수락할 수 있어요!");
  return;
}
  // 위치 추적은 이미 활동 시작 시 켜졌다고 가정

  const location = userLocation.value;

  if (!location || location.lat == null || location.lon == null) {
    alert("⚠️ 현재 위치 정보가 없습니다. 위치 권한을 확인해주세요.");
    return;
  }

  socketActivatigLocation.socketActivatigLocation.emit("acceptHireRequest", {
    fromCustomerEmail: hireAlert.value.fromCustomerEmail,
    myRoomId: joinInfo.value.email,
    mussemPk:mussemPk
  });

  hireAlert.value.visible = false;
  alert("고용 요청을 수락했습니다!");
  userStore.setMatch(true)
  router.push(`/mastMussem`);
};


function rejectHire() {
  socketActivatigLocation.socketActivatigLocation.emit("rejectHireRequest", {
    fromCustomerEmail: hireAlert.value.fromCustomerEmail,
  });
  hireAlert.value.visible = false;
  alert("고용 요청을 거절했습니다.");
}

const ComplteEmployStatus=userStore.unComplteEmploy.status;
onMounted(() => {
 
  if(ComplteEmployStatus!=undefined && ComplteEmployStatus==="in_progress"&&retrySocketStore.socket===null){

retrySocketStore.connectSocket();
return;

  }
  if(ComplteEmployStatus!=undefined && ComplteEmployStatus==="in_progress"&&retrySocketStore.socket!=null){
    return;
  }
  // 로컬스토리지에서 지역정보 복원
  const userDataStr = localStorage.getItem("user");
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      regions.value = userData?.authUser?.userDetail?.active_regions || [];
      joinInfo.value.email = userData?.authUser?.userDetail?.email || "";
      joinInfo.value.regions = regions.value[0] || "";
    } catch {
      regions.value = [];
      joinInfo.value.email = "";
      joinInfo.value.regions = "";
    }
  }

  // 추천 작업 (임시)
  suggestedTasks.value = [
    { id: 1, title: "📦 마포구 → 신촌 2km / 5,000원" },
    { id: 2, title: "🛒 편의점 심부름 / 3,000원" },
  ];

  

 



  // 소켓 연결 - 실제는 toggleStatus 켜져야 연결 가능하나, 초기 이벤트 리스너 등록 위해 먼저 연결
  if(socketActivatigLocation.socketActivatigLocation===null){

    socketActivatigLocation.connectSocket();
  }

  if(socketStore.socket===null){
    socketStore.connectSocket(userStore.authUser.userDetail.role);
    
  }
  // 머슴 역할 및 방 등록은 toggleStatus에서 처리

  // 서버에서 고객 위치 요청 처리
  socketActivatigLocation.socketActivatigLocation.on("requestLocation", ({ to }) => {
    console.log("고객 위치 요청 받음");
    const location = userLocation.value;
    if (location?.lat != null && location?.lon != null) {
      socketActivatigLocation.socketActivatigLocation.emit("sendLocationToCustomer", {
        to,
        location,
      });
    }
  });

  // 머슴에게 온 고용 요청 수신
  socketActivatigLocation.socketActivatigLocation.on("receiveHireRequest", ({ fromCustomerEmail,customerPk }) => {
    console.log(`고용주 고유번호: ${customerPk} 와  이메일: ${fromCustomerEmail}로 부터의 수신`)
    hireAlert.value.visible = true;
    hireAlert.value.fromCustomerEmail = fromCustomerEmail;
  });
});

onBeforeUnmount(() => {
   
  // socketActivatigLocation.disconnectsocketActivatigLocation();
  // socketStore.disconnectSocket();
});

watch(
  () => joinInfo.value.regions,
  (newRegion, oldRegion) => {
    if (oldRegion && newRegion !== oldRegion) {
      socketStore.socket.emit("servant:out", {
        ...joinInfo.value,
        regions: oldRegion,
      });
      isOnline.value = false;
    }
  }
);


const toggleStatus = () => {
  if (!joinInfo.value.regions) {
    showError.value = true;
    return;
  }
  showError.value = false;

  isOnline.value = !isOnline.value;

  if (isOnline.value) {
    mussemActivatigLocation.startTracking();
    socketStore.socket.emit("servant:join", joinInfo.value);

    // 머슴 방 생성 및 역할 등록
    
    socketActivatigLocation.socketActivatigLocation.emit("createRoom", { role, roomId }, (response) => {
      console.log("방 생성 완료:", response);
    });
    socketActivatigLocation.socketActivatigLocation.emit("activitingLocationRole", createRoom);

  } else {
    mussemActivatigLocation.stopTracking();
    socketStore.socket.emit("servant:out", joinInfo.value);
    // socketActivatigLocation.socketActivatigLocation.disconnect();
  }
};

const  acceptTask=(taskId)=> {
  alert(`🛠️ 작업 ${taskId} 수락!`);
 
}

const unComplteEmployStatus = ref(null)

// 2. unComplteEmploy.status 감시 (추가 가능)
async function ensureSocketConnected() {
  if (!retrySocketStore.socket) {  
  retrySocketStore.connectSocket(); // connectSocket이 Promise 반환한다고 가정
  }
}

// watch를 async 함수로 감싸기 어렵기 때문에 별도 함수로 분리 후 상태 변경 감시 시 호출
watch(
  () => userStore.unComplteEmploy?.status,
  async (status) => {
 
    if (status === "in_progress") {
      await ensureSocketConnected();
      if (retrySocketStore.socket) {
        
        const userData = userStore.authUser.userDetail;
        const unComplteEmploy = userStore.unComplteEmploy;
        const createRoomData = { userData, unComplteEmploy };
        
        retrySocketStore.socket.emit("createRetryRoom", createRoomData);
        
        router.push(`/mastMussem`);
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.mussem-dashboard {
  padding: 2rem;
  background: #f5f5f5;
  min-height: 100vh;
}

.status-header {
  background: linear-gradient(135deg, #f0fff4, #d0f0c0);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.region-select-wrapper {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  max-width: 300px;
}

.region-select-wrapper label {
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #2e7d32;
  font-size: 1rem;
  user-select: none;
}

.region-select-wrapper select {
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  border: 1.5px solid #2e7d32;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  cursor: pointer;
  background-color: #f9fff9;
}

.region-select-wrapper select.error {
  border-color: #d32f2f;
  background-color: #ffe6e6;
}

.region-select-wrapper select:hover {
  border-color: #4caf50;
}

.error-message {
  margin-top: 0.3rem;
  color: #d32f2f;
  font-weight: 600;
  font-size: 0.9rem;
  user-select: none;
}

.status-box {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.toggle-button {
  padding: 0.6rem 1.2rem;
  background-color: #00c853;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.toggle-button:hover:not(:disabled) {
  background-color: #009624;
}

.toggle-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.online {
  color: #2e7d32;
}
.offline {
  color: #9e9e9e;
}

.suggestion-section {
  background: #ffffff;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 2rem;
}

.dashboard-footer {
  display: flex;
  justify-content: space-around;
  padding-top: 1.5rem;
}

.dashboard-footer a {
  text-decoration: none;
  font-weight: bold;
  color: #007bff;
}

.user-location {
  font-size: 0.9rem;
  color: #4caf50;
  margin-left: 1rem;
}

/* 고용 요청 알림 스타일 */
.hire-alert {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fffde7;
  border: 1px solid #ffeb3b;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 10px rgba(255, 235, 59, 0.5);
  z-index: 9999;
  max-width: 320px;
  width: 90%;
}

.hire-alert p {
  margin: 0 0 0.6rem 0;
  font-weight: 600;
  color: #fbc02d;
  text-align: center;
}

.btn-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-group button {
  background-color: #fbc02d;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-group button:hover {
  background-color: #f9a825;
}

/* 간단한 슬라이드 인/아웃 트랜지션 */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}


</style>