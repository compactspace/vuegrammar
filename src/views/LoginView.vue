<template>
  <div class="login-wrapper">
    <div class="login-container">
      <h1>로그인</h1>
     <form @submit.prevent="handleLogin" class="button-group">
  <div>
    <label for="username">아이디</label>
    <input v-model="username" type="text" id="username" placeholder="아이디를 입력하세요" required />
  </div>
  <div>
    <label for="password">비밀번호</label>
    <input v-model="password" type="password" id="password" placeholder="비밀번호를 입력하세요" required />
  </div>
  
  <div class="button-row">
    <button type="submit" class="login-button">로그인</button>
    <button type="button" class="signup-button-glitch" @click=handleSignup>회원가입</button>
  </div>
</form>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useUserStore } from '../stores/userStore.js';
import { useRouter } from 'vue-router';
import { useSocketStore } from '../stores/socketStore.js';
import { useRetrySocketStroe } from '../stores/useRetrySocketStroe.js';
const username = ref('');
const password = ref('');
const error = ref('');
const userStore = useUserStore();
const socketStore=useSocketStore();
const retrySocketStroe=useRetrySocketStroe();
const router = useRouter();


const handleLogin = async () => {
  error.value = '';

  try {
    const response = await axios.post('/users/login', {
      email: username.value,
      password: password.value,
    });

    const userData = response.data;

    console.log(userData)

    if (userData.loginSuccess) {

      const unComplteEmploy=userData?.unComplteEmploy
      
      userStore.setUser(userData);
      const role = userData.userDetail?.role;
      if(unComplteEmploy!=undefined || unComplteEmploy!=null){
       userStore.setUnComplteEmploy(unComplteEmploy);
   
      
       
       retrySocketStroe.connectSocket({ userData, unComplteEmploy });
      //    if(role==="mussem"){      
      //     router.push('/mussemMain');
      //     return;
      // }
      //  if(role==="customer"){      
      //     router.push('/mussemMain');
      //     return;
      // }
      }
      if(role==="mussem"){      
          router.push('/mussemMain');
          return;
      }
      if (role === 'admin') {
        router.push('/admin');
        return;
      }
      router.push('/');
      return;
    } else {
      error.value = userData.message || '로그인에 실패했습니다.';
    }

  } catch (err) {
    error.value = '로그인 실패: ' + (err.response?.data?.message || err.message);
  }
};

const handleSignup = () => {
   router.push('/signUp');  
  // 향후 라우팅 추가 가능 예: router.push('/signup');
};
</script>

<style scoped>
/* ✅ 화면 전체를 덮고 중앙정렬하는 wrapper */
.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0eafc, #cfdef3);
  padding: 1rem;
  animation: fadeIn 0.5s ease;
}

/* ✅ 카드 형태 로그인 박스 */
.login-container {
  width: 100%;
  max-width: 400px;
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 제목 */
h1 {
  text-align: center;
  font-size: 2rem;
  color: #333;
}

/* 입력 폼 */
form > div {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #555;
}

input[type="text"],
input[type="password"] {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #007bff;
}

/* 버튼 정렬 영역 */
.button-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

/* 로그인 버튼 */
.login-button {
  background-color: #007bff;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-button:hover {
  background-color: #0056b3;
}

/* 간지 회원가입 버튼 - 사이버 글리치 스타일 */
.signup-button-glitch {
  position: relative;
  overflow: hidden;
  padding: 0.9rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  color: #5ed2ff;
  background: transparent;
  border: 2px solid #5ed2ff;
  border-radius: 0.75rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 0 6px rgba(94, 210, 255, 0.4);
}

.signup-button-glitch::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(94, 210, 255, 0.2), transparent);
  transition: all 0.5s;
}

.signup-button-glitch:hover {
  color: #fff;
  background: #5ed2ff;
  box-shadow: 0 0 16px rgba(94, 210, 255, 0.5), 0 0 32px rgba(94, 210, 255, 0.3);
  transform: scale(1.04);
}

.signup-button-glitch:hover::before {
  left: 100%;
}

.signup-button-glitch:active {
  transform: scale(0.98);
}


/* 에러 메시지 */
.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모바일 대응 */
@media (max-width: 480px) {
  .login-container {
    padding: 1.5rem;
    border-radius: 12px;
  }

  h1 {
    font-size: 1.5rem;
  }

  .login-button,
  .signup-button-glitch {
    font-size: 1.1rem;
  }
}
</style>
