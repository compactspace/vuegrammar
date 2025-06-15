<template>
  <div class="register-wrapper">
    <div class="register-form">
      <h2>회원가입</h2>

      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="email">아이디 (이메일)</label>
          <div class="input-with-button">
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="이메일을 입력하세요"
              required
              :class="{ 'input-error': emailChecked && !emailAvailable }"
              @input="emailChecked = false"
            />
            <button
              type="button"
              class="check-button"
              @click="checkDuplicate"
              :disabled="!form.email || emailChecking"
            >
              {{ emailChecking ? '확인중...' : emailChecked ? (emailAvailable ? '사용 가능' : '불가') : '중복확인' }}
            </button>
          </div>
          <p v-if="emailChecked && !emailAvailable" class="message error">이미 사용 중인 이메일입니다.</p>
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <div class="input-with-icon">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="form.password_hash"
              placeholder="비밀번호를 입력하세요"
              required
              @input="checkPasswordsMatch"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
            >
              <svg
                v-if="showPassword"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.168.21-2.29.6-3.34m5.5 1.34a3 3 0 104.242 4.242m1.414-1.414a3 3 0 00-4.242-4.242"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.168.21-2.29.6-3.34m5.5 1.34a3 3 0 104.242 4.242M2.458 2.458l19.084 19.084"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="passwordConfirm">비밀번호 확인</label>
          <div class="input-with-icon">
            <input
              :type="showPasswordConfirm ? 'text' : 'password'"
              id="passwordConfirm"
              v-model="passwordConfirm"
              placeholder="비밀번호를 다시 입력하세요"
              required
              @input="checkPasswordsMatch"
              :class="{ 'input-error': passwordConfirm.length > 0 && !passwordsMatch }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPasswordConfirm = !showPasswordConfirm"
              :aria-label="showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'"
            >
              <svg
                v-if="showPasswordConfirm"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.168.21-2.29.6-3.34m5.5 1.34a3 3 0 104.242 4.242m1.414-1.414a3 3 0 00-4.242-4.242"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.168.21-2.29.6-3.34m5.5 1.34a3 3 0 104.242 4.242M2.458 2.458l19.084 19.084"
                />
              </svg>
            </button>
          </div>
          <p v-if="passwordConfirm.length > 0 && !passwordsMatch" class="message error">비밀번호가 일치하지 않습니다.</p>
        </div>

        <button
          type="submit"
          class="submit-button"
          :disabled="!form.email || !emailAvailable || !form.password_hash || !passwordConfirm || !passwordsMatch"
          :class="{ disabled: !form.email || !emailAvailable || !form.password_hash || !passwordConfirm || !passwordsMatch }"
        >
          가입하기
        </button>
      </form>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: '',
  password_hash: ''
})

const passwordConfirm = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const emailAvailable = ref(false)
const emailChecked = ref(false)
const emailChecking = ref(false)

const passwordsMatch = ref(false)

const checkDuplicate = async () => {
  if (!form.value.email) {
    errorMessage.value = '이메일을 입력하세요'
    successMessage.value = ''
    return
  }
  errorMessage.value = ''
  successMessage.value = ''
  emailChecking.value = true
  try {
    const res = await axios.post('users/check-email', { email: form.value.email })
    
    // ✅ 핵심 수정 포인트
    emailAvailable.value = !res.data.exists;  // exists: false → 사용 가능
    emailChecked.value = true;

    if (emailAvailable.value) {
      successMessage.value = '사용 가능한 이메일입니다 🎉';
    } else {
      errorMessage.value = '이미 사용 중인 이메일입니다.';
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || '중복 확인 중 오류 발생';
    emailAvailable.value = false;
  } finally {
    emailChecking.value = false;
  }
};

const checkPasswordsMatch = () => {
  passwordsMatch.value = form.value.password_hash && passwordConfirm.value && form.value.password_hash === passwordConfirm.value
}

const submitForm = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!emailAvailable.value) {
    alert('이메일 중복 확인을 해주세요.')
    return
  }

  if (!passwordsMatch.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  try {
    const res = await axios.post('users/register', form.value)

    if (res.status === 201) {
      alert('회원가입이 완료되었습니다! 🎉')
      router.push('/login')
    }
  } catch (err) {
    const status = err.response?.status
    const message = err.response?.data?.message || '알 수 없는 오류가 발생했습니다.'

    if (status === 409) {
      alert('이미 존재하는 사용자입니다. 다른 이메일을 사용해주세요.')
    } else if (status === 500) {
      alert('서버 오류로 인해 회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } else {
      
    }
  }
}
</script>

<style scoped>
.register-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e0eafc, #cfdef3);
  padding: 1rem;
  animation: fadeIn 0.5s ease;
}

.register-form {
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  font-size: 1.8rem;
  text-align: center;
  color: #333;
}

/* 공통 인풋 스타일 통일 */
input {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  width: 100%;
  height: 44px; /* 높이 통일 */
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #007bff;
}

.input-error {
  border-color: #d32f2f !important;
}

/* 중복확인 버튼 포함된 필드 */
.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.check-button {
  white-space: nowrap;
  background-color: transparent;
  color: #007bff;
  border: 2px solid #007bff;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 44px; /* 버튼 높이도 인풋과 동일 */
  user-select: none;
}

.check-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check-button:hover:not(:disabled) {
  background-color: #007bff;
  color: white;
}

/* 비밀번호 입력 + 토글 아이콘 래퍼 */
.input-with-icon {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.input-with-icon input {
  padding-right: 3rem; /* 오른쪽 여유 공간 */
  width: 100%;
}

/* 토글 버튼 스타일 */
.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  width: 32px;
  padding: 0;
  user-select: none;
}

.toggle-password svg {
  stroke: currentColor;
  width: 20px;
  height: 20px;
}

/* 가입하기 버튼 */
.submit-button {
  background: linear-gradient(135deg, #007bff, #00c6ff);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 44px;
  user-select: none;
}

.submit-button:disabled,
.submit-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.2);
}

/* 메시지 */
.message {
  text-align: center;
  font-size: 0.95rem;
  padding: 0.6rem;
  border-radius: 6px;
  animation: fadeIn 0.3s ease-in;
}

.message.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.message.success {
  background-color: #e3fcef;
  color: #2e7d32;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
