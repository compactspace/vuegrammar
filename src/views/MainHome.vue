

<template>
  <div class="home-wrapper">
    <!-- 🎯 배너 전체 -->
    <div class="bannerArea">
      <img src="/mainbanner.png" alt="머슴 일러스트" class="hero-image" />
      <router-link to="/mussemSignUp" class="corner-fold">머슴 되기</router-link>
      <div class="banner-text">
        <h1>🏃‍♂️찾기</h1>
        <MainBannerLocation :gps-available="isPossibleGPS" />
      </div>
    </div>

    <!-- 🎯 메인 버튼 영역 -->
    <div class="home-container">
      <div class="button-group">
  
        <template v-if="!showFindMussemButton">
          <a href="#" class="nav-button" @click.prevent="handleCheckLocation('/FindMussem')">📦내 위치 머슴 확인</a>
        </template>
        <template v-else>
          <a href="#" class="nav-button" @click.prevent="retryJoinRoom()">🧾 내가 고용한 머슴 현황</a>
          <a href="#" class="nav-button" @click.prevent="handleCheckLocation('/mussemLocationSearch')">🪓 머슴으로 일하기</a>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useMediaQuery } from '@vueuse/core'
import { ref, computed, watchEffect,onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainBannerLocation from '../components/MainHome/MainBannerLocation.vue'
import { useStoreMyLocation } from '../stores/useStoreMyLocation'
import { useSocketStore } from '../stores/socketStore'
import { useRetrySocketStroe } from '../stores/useRetrySocketStroe'
import { useUserStore } from '../stores/userStore'
import { useLoginApprovalSocketStore } from '../stores/useLoginApprovalSocket.js'; 
  const loginApprovalStore = useLoginApprovalSocketStore();
const router = useRouter();
const store = useStoreMyLocation();
const socketStore = useSocketStore();
const retrySocketStore=useRetrySocketStroe();
const userStore = useUserStore()

const unComplteEmployStatus = ref(null)


const isPossibleGPS=ref(false);


watchEffect(() => {
  const status = userStore.unComplteEmploy?.status
  console.log('고용 상태 변경 감지됨:', status)
  unComplteEmployStatus.value = status
})

const showFindMussemButton = computed(() => {
  const status = unComplteEmployStatus.value
  console.log( unComplteEmployStatus.value)
 
  return status === 'in_progress'?  true : false
})

const handleCheckLocation = (path) => {
  if (!store.myLocation) {
    alert('주소를 먼저 입력해야 합니다.')
    return
  }
  router.push(path)
}


const retryJoinRoom = () => { 
  const employer_id = userStore.authUser.userDetail.id;
  // console.log(`employer_id: ${employer_id}`);

  // 이벤트 리스너 중복 방지
  retrySocketStore.socket.off("successRequest");
  retrySocketStore.socket.off("notFoundMussem");

  // 요청 보내기
  retrySocketStore.socket.emit("requestJoinRetryRoom");

  // 성공 응답 리스너 (한 번만 등록)
  retrySocketStore.socket.on("successRequest", (data) => {
    console.log(data)
    const { retryJoinRoom } = data;
    if (retryJoinRoom === "success") {
      alert("하하하");
       router.push("/matchCustomer")
      
    }
  });

  // 실패 응답 리스너 (한 번만 등록)
  retrySocketStore.socket.on("notFoundMussem", (data) => {
    const { notFoundMussem } = data;
    alert(notFoundMussem || "머슴이 먹튀");
  });
};


onMounted(()=>{
if(loginApprovalStore.socket==null &&userStore.authUser?.userDetail){

  loginApprovalStore.connectSocket(userStore.authUser.userDetail.email)

}
  if(loginApprovalStore.socket!=null){

loginApprovalStore.socket.on("requestLoginApproval", ({ message }) => {
          const approved = confirm(message);
          loginApprovalStore.socket.emit("loginApprovalResponse", approved);
        });
  }



if(/Mobi|Android|iPhone/i.test(navigator.userAgent)){
  isPossibleGPS.value=true;
}

   const ComplteEmployStatus=userStore?.unComplteEmploy?.status;
 
   const   userData=userStore?.authUser
    console.log(userData)
  const   unComplteEmploy=userStore?.unComplteEmploy
  let retryData={}
  retryData.userData=userData;
  retryData.unComplteEmploy=unComplteEmploy;
   
   
 
   if(ComplteEmployStatus!=undefined && ComplteEmployStatus==="in_progress"&&retrySocketStore.socket===null){
   
// 이상한 패턴이네
    retrySocketStore.connectSocket(retryData);
    return;

  }
  if(ComplteEmployStatus!=undefined && ComplteEmployStatus==="in_progress"&&retrySocketStore.socket.connected!=true){
    
      retrySocketStore.connectSocket(retryData);
    const   employer_id =userStore.authUser.userDetail.id
    console.log(`employer_id: ${employer_id}`)
    retrySocketStore.socket.on(`retry_target_${employer_id}`,(data)=>{
      const {retryJoinRoom}=data;
      if(retryJoinRoom==="success"){
         
      }
    })
  }
})


const isMobile = useMediaQuery('(max-width: 767px)')
</script>




<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #fefefe, #e3f2fd);
  min-height: 100vh;
}

/* 🎯 배너 */
.bannerArea {
  position: relative;
  width: 100%;
  height: 45vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: #fff;
}

/* 🪓 오른쪽 접힘 + 텍스트 클릭 */
.corner-fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  clip-path: polygon(100% 0, 100% 100%, 0 0);
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
  text-decoration: none;
  z-index: 3;
  cursor: pointer;
  transition: background 0.3s ease;
}

.corner-fold:hover {
  background: linear-gradient(135deg, #0056b3, #004494);
}

/* 🏞️ 배너 이미지 */
.hero-image {
  position: absolute;
  bottom: 0;
  width: auto;
  height: 100%;
  object-fit: contain;
  z-index: 0;
  animation: float 4s ease-in-out infinite;
}

/* 배너 텍스트 */
.banner-text {
  z-index: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  animation: fadeIn 1s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.banner-text h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #222;
  margin-bottom: 0.5rem;
}

/* 🎯 콘텐츠 영역 */
.home-container {
  width: 100%;
  max-width: 700px;
  padding: 2rem 1rem;
  text-align: center;
  animation: fadeInUp 0.8s ease;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.nav-button {
  padding: 0.9rem 1.8rem;
  font-size: 1.05rem;
  font-weight: 600;
  background-color: #007bff;
  color: white;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.nav-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 86, 179, 0.4);
}

/* 애니메이션 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .banner-text {
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .banner-text h1 {
    font-size: 1.4rem;
  }

  .hero-image {
    height: 100%;
    max-height: 240px;
  }

  .nav-button {
    width: 100%;
    font-size: 1rem;
  }
}
</style>
