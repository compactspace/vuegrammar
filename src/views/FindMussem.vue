<template>
  <!-- {{ mussemList }} -->
  <div class="mussem-list-wrapper">
    <!-- 💠 카드형 셀렉터 -->
    <div class="region-toggle-card">
      <label class="region-label">내 주소 기준 지역 선택</label>
      <div class="region-toggle">
        <button
          v-for="(region, index) in myLocation"
          :key="index"
          :class="['toggle-btn', { active: selectedLevel === index }]"
          @click="selectedLevel = index"
        >
          {{ region }}
        </button>
      </div>
    </div>

    <!-- 지역 정보 표시 -->
    <h2 class="region-title"><span class="pin">📍</span>{{ currentRegionLabel }}</h2>
    <p class="subtitle">내 주변 머슴 목록</p>

    <div v-if="loading" class="loading">로딩 중...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="!loading && mussemList.length === 0" class="empty">
      근처에 등록된 머슴이 없어요 😥
    </div>

    <div class="mussem-grid" v-if="mussemList.length > 0">
      <div
        v-for="mussem in mussemList"
        :key="mussem.id"
        class="mussem-card"
        :class="{ unavailable: !mussem.is_available }"
      >
        <h3 class="name">🚜 머슴 #{{ mussem.id }}</h3>
        <p class="region">머슴 활동지역: {{ mussem.active_regions.join(" > ") }}</p>
        출동 수단: {{ vehicleLabel(mussem.vehicle_type) }}
        <p class="status">
          상태:
          <span
            :class="{
              working: mussem.is_working,
              available: mussem.is_available && !mussem.is_working,
              pending: !mussem.approved,
            }"
          >
            {{ mussem.is_working ? "머슴일중" : "고용가능" }}
          </span>
        </p>
              
<button
  v-if="mussem.is_available && !mussem.is_working"
  class="hire-btn"
  @click="hireMussem(mussem)"
>
  💼 고용하기
</button>

        <p
  v-if="mussem.customerToMussemDistance"
  class="distance-display"
>
  📡 <strong>{{ (mussem.customerToMussemDistance / 1000).toFixed(2) }} km</strong>
  거리에서 출동 대기 중
</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStoreMyLocation } from "../stores/useStoreMyLocation.js";
import { useSocketStore } from "../stores/socketStore.js";
import { useStoreSocketActivatigLocation } from "../stores/useStoreSocketActivatigLocation.js";
import { useUserStore } from "../stores/userStore.js";

import { useRouter } from 'vue-router';
const router = useRouter();

const store = useStoreMyLocation();
const socketStore = useSocketStore();
const socketActivatigLocation = useStoreSocketActivatigLocation();
const userStore = useUserStore();

const myLocation = ref([...store.myLocation]);
const selectedLevel = ref(2);
const currentRegionLabel = computed(() => myLocation.value[selectedLevel.value]);

const loading = ref(false);
const error = ref("");
const mussemList = ref([]);
const mussemLocations = ref({}); // 머슴의 실시간 위치 저장
const customerPk = userStore.authUser.userDetail.id;

// 소켓 컨넥션순서:LoginView.view 에서 로그인후:현재 접속중인 머슴 네이임스페이스에 연결을 저장  ..(i)
// 되어있음
// pageMouted Flow 
//  => onMounted  :말그대로 페이지 로드후  fetchMussemLocations 를 호출 
//  => fetchMussemLocations: (i)로  내주변 mussemList 가져옴  
//  =>  enterRoomsAndRequestLocations :mussemList 를 받아 새로운 네임스페이스 activitingLocation 에 연결 시도+ 알파


onMounted(() => {
  
  if(socketStore.socket===null){
    socketStore.connectSocket(userStore.authUser.userDetail.role);
    
  }


  console.log(`널: ${socketActivatigLocation.socketActivatigLocation}`)

  if(socketActivatigLocation.socketActivatigLocation===null){
    
    socketActivatigLocation.connectSocket();
  }
  fetchMussemLocations(currentRegionLabel.value);
   //console.log(store.coordinates)

});

const fetchMussemLocations = async (regionName)=> {
  loading.value = true;
  error.value = "";
  mussemList.value = [];

  socketStore.socket.emit("getMussemList", regionName);

  socketStore.socket.once("mussemList", (data) => {
   let  list = [];    
    mussemList.value = list;
    loading.value = false;

    for(let key in data ){
     
      list.push(data[key].rows[0])
    }



    console.log(list)
    if (list.length > 0) {
       enterRoomsAndRequestLocations(list);
    }
  });

  // 안전 타임아웃
  setTimeout(() => {
    loading.value = false;
  }, 3000);
}







// 🧠 고객 접속 시 각 머슴 방에 입장하고 위치 요청


/**
 * @param mussemList 은 객체를 요소로써 같는 배열로 다음과 같다.
  {
  "active_regions": [],
  "approved": null,
  "created_at": null,
  "email": "",
  "id": null,
  "is_available": null,
  "is_working": null,
  "last_completed_location": null,
  "license_num": "",
  "password_hash": "",
  "rating": null,
  "updated_at": null,
  "user_id": null,
  "vehicle_type": ""
}
*/
// 9730
const  enterRoomsAndRequestLocations = async (list) =>{
 
  const role = userStore.authUser.userDetail.role;
  const customerRoomId = userStore.authUser.userDetail.email;
  
  //여기서 중복발급
  

  // 해당 머슴의 고유방번호=email을 반복문으로 받는다.
 
  for (const mussem of list) {  
     console.log(mussem)

    // 머슴 이메일 = roomId  
    let roomId = mussem.email; 


    // 룸 입장시 나를 식별할 아이디   
    let clientId =customerRoomId; 
   
    console.log(`머슴 룸아이디 roomId:  ${roomId}`)

    let toJoinRoomData={role:role, roomId:roomId ,clientId:clientId}
    socketActivatigLocation.socketActivatigLocation.emit("activitingLocationRole", toJoinRoomData);
  }

  // 이건 머슴이 접속시 받는 소켓 이벤트이다. 클라이언트 요청이 아님
  await  socketActivatigLocation.socketActivatigLocation.off("fromMussem"); // 중복 방지
  await  socketActivatigLocation.socketActivatigLocation.on("fromMussem",(data) => {  


    
  

    console.log(`💡방번호:${data.roomId} 머슴 위치 도착: ${ data.location}`);
    mussemLocations.value['mussemCoordinate'] = data.location;
   
    const lat1=store.coordinates.latitude
    const lat2=data.location.lat
    const lon1=store.coordinates.longitude
    const lon2=data.location.lon
    const customerToMussemDistance=getDistanceFromLatLonInM(lat1, lon1, lat2, lon2);
 const index = mussemList.value.findIndex((m) => m.email === data.roomId);
if (index !== -1) {
  mussemList.value[index].customerToMussemDistance = customerToMussemDistance;
}
 
 
  });
}


function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반경(미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 
  const distance = (R * c).toFixed(2)
  console.log(`distance: ${distance}`)
  return distance;
}


watch(selectedLevel, () => {
  fetchMussemLocations(currentRegionLabel.value);
  // socketActivatigLocation.disconnectsocketActivatigLocation();
});

const  hireMussem=(mussem)=>{
  //alert(`머슴 #${mussem.id} (${mussem.email})을(를) 고용 요청했습니다!`);
  // 실제 고용 처리 로직은 여기에 작성
 
 const toMussemEmail= mussem.email
 const fromCustomerEmail= userStore.authUser.userDetail.email

 const requsetData={toMussemEmail:toMussemEmail,fromCustomerEmail:fromCustomerEmail,customerPk:customerPk}

 socketActivatigLocation.socketActivatigLocation.emit('hireRequest',requsetData)
 


socketActivatigLocation.socketActivatigLocation.on('hireRequestSent', ({ to }) => {
    alert(`${to} 머슴에게 요청을 보냈습니다`);
  });

  socketActivatigLocation.socketActivatigLocation.on('hireRequestFailed', ({ message }) => {
    alert(`❌ 요청 실패: ${message}`);
  });

  socketActivatigLocation.socketActivatigLocation.on('hireAccepted', ({ mussemEmail, roomId }) => {
    alert(`🎉 ${mussemEmail} 머슴이 수락했습니다! 매칭 방: ${roomId}`);
     
    userStore.setMatch(true);
    router.push(`/matchCustomer`);

  });

  socketActivatigLocation.socketActivatigLocation.on('hireRejected', ({ mussemEmail }) => {
    alert(`😥 ${mussemEmail} 머슴이 요청을 거절했습니다`);
  });




}



function vehicleLabel(type) {
  switch (type) {
    case "walking":
      return "두 발로 직접 출동 🏃‍♂️ (근성甲)";
    case "bicycle":
      return "자전거 타고 바람처럼 🚴‍♂️";
    case "scooter":
      return "슝~ 전동 킥보드로 질주 🛴";
    case "motorcycle":
      return "모터사이클로 쾌속 도착 🏍️";
    case "car":
      return "자동차 타고 안정 출동 🚗";
    default:
      return "출동 수단 미등록 (소환 실패 🌀)";
  }
}
</script>


<style scoped>
/* 🧊 메인 컨테이너 */
.mussem-list-wrapper {
  max-width: 760px;
  margin: 2.5rem auto;
  padding: 2rem;
  border-radius: 24px;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  font-family: "Noto Sans KR", sans-serif;
  transition: all 0.3s ease;
}

/* 🧊 카드형 셀렉터 */
.region-toggle-card {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 1rem 1.2rem;
  backdrop-filter: blur(16px);
  box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.4), 0 8px 24px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.8rem;
}

.region-label {
  font-weight: 600;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #333;
}

.region-toggle {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: center;
}
.toggle-btn {
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  border: 1px solid rgba(150, 150, 150, 0.4);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(6px);
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.75);
}
.toggle-btn.active {
  background: #007bff;
  color: white;
  font-weight: 700;
  border-color: #007bff;
  box-shadow: 0 0 12px rgba(0, 123, 255, 0.3);
}

/* 📍 지역 타이틀 */
.region-title {
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  color: #003c8f;
  text-shadow: 0 0 6px rgba(0, 123, 255, 0.2);
  margin-bottom: 0.4rem;
}
.region-title .pin {
  margin-right: 0.5rem;
}
.subtitle {
  text-align: center;
  font-size: 1rem;
  color: #555;
  margin-bottom: 2rem;
}

/* 📦 카드 그리드 */
.mussem-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

/* 🧱 카드 스타일 */
.mussem-card {
  background: white;
  border-radius: 16px;
  padding: 1rem 1.2rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 6px solid #007bff;
}
.mussem-card.unavailable {
  opacity: 0.6;
  filter: grayscale(0.3);
}
.mussem-card .name {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
}
.mussem-card .region,
.mussem-card .vehicle,
.mussem-card .status {
  font-size: 0.95rem;
  color: #444;
  margin: 0.25rem 0;
}
.status span {
  font-weight: 600;
}
.status .working {
  color: #e63946;
}
.status .available {
  color: #43aa8b;
}
.status .pending {
  color: #f4a261;
}

/* 로딩, 에러, 비어있을 때 */
.loading,
.error,
.empty {
  text-align: center;
  font-size: 1.1rem;
  color: #777;
  margin-top: 2rem;
}


.hire-btn {
  margin-top: 0.8rem;
  padding: 0.5rem 1rem;
  border: none;
  background-color: #43aa8b;
  color: white;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;
  box-shadow: 0 4px 10px rgba(67, 170, 139, 0.2);
}

.hire-btn:hover {
  background-color: #3b9d7a;
}

</style>
