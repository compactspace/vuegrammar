<template>
  <div class="email-check-container">
    <label for="email">이메일</label>
    <input
      id="email"
      v-model="email"
      type="email"
      placeholder="example@domain.com"
      :class="inputClass"
      autocomplete="off"
      @keyup.enter="onCheckEmail"
      @input="resetStatus"
    />

    <button
      :disabled="!isValidEmail || loading"
      @click="onCheckEmail"
      class="btn-check"
    >
      {{ loading ? '확인 중...' : '중복 확인' }}
    </button>

    <p class="status-message" :class="statusClass">
      {{ statusMessage }}
    </p>

    <label for="password" class="mt-2">비밀번호</label>
    <input
      id="password"
      type="password"
      v-model="password"
      placeholder="6자 이상 입력"
      autocomplete="new-password"
    />
    <p v-if="password && password.length < 6" class="error-msg">6자 이상 입력하세요.</p>

    <label for="passwordConfirm" class="mt-2">비밀번호 확인</label>
    <input
      id="passwordConfirm"
      type="password"
      v-model="passwordConfirm"
      placeholder="비밀번호 확인"
      autocomplete="new-password"
    />
    <p v-if="passwordConfirm && password !== passwordConfirm" class="error-msg">비밀번호가 일치하지 않습니다.</p>

    <button
      class="btn-submit"
      :disabled="!canProceed"
      @click="submit"
    >
      다음 단계로
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { useSignupStore } from '../../stores/useSignupStore'

const emits = defineEmits(['next'])
const signupStore = useSignupStore()

const email = ref(signupStore.email)
const password = ref(signupStore.password || '')
const passwordConfirm = ref('')
const exists = ref(null) // null = 미확인, true = 중복, false = 사용가능
const loading = ref(false)
const error = ref(null)

const isValidEmail = computed(() => {
  const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  return strictEmailRegex.test(email.value.trim())
})

const canProceed = computed(() => 
  isValidEmail.value &&
  exists.value === false &&
  password.value.length >= 6 &&
  password.value === passwordConfirm.value
)

const inputClass = computed(() => {
  if (email.value === '') return ''
  if (!isValidEmail.value) return 'invalid'
  if (exists.value === true) return 'invalid'
  if (exists.value === false) return 'valid'
  return ''
})

const statusMessage = computed(() => {
  if (email.value === '') return '이메일을 입력해주세요.'
  if (!isValidEmail.value) return '유효한 이메일 형식을 입력해주세요.'
  if (loading.value) return '중복 확인 중입니다... ⏳'
  if (exists.value === null) return '중복 확인 버튼을 눌러주세요.'
  if (exists.value === true) return '❌ 이미 사용 중인 이메일입니다.'
  if (exists.value === false) return '✅ 사용 가능한 이메일입니다!'
  return ''
})

const statusClass = computed(() => {
  if (!isValidEmail.value) return 'error'
  if (exists.value === true) return 'error'
  if (exists.value === false) return 'success'
  if (loading.value) return 'loading'
  return 'info'
})

async function onCheckEmail() {
  if (!isValidEmail.value) {
    exists.value = null
    toast.error('이메일 형식을 먼저 올바르게 맞춰주세요.')
    return
  }

  loading.value = true
  exists.value = null
  error.value = null

  try {
    const res = await axios.post('users/check-email', { email: email.value.trim() })
    exists.value = res.data.exists
    if (exists.value) toast.warning('이미 사용 중인 이메일입니다.')
    else toast.success('사용 가능한 이메일입니다!')
  } catch (e) {
    error.value = '중복 확인 중 오류가 발생했습니다.'
    exists.value = null
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function resetStatus() {
  exists.value = null
  error.value = null
}

function submit() {
  if (!canProceed.value) {
    toast.error('입력 정보를 다시 확인해주세요.')
    return
  }

  // Pinia 상태 동기화
  signupStore.email = email.value.trim()
  signupStore.password = password.value

  toast.success('다음 단계로 이동합니다.')
  emits('next')
}

// 이메일이 바뀌면 중복 상태 초기화 + Pinia도 동기화
watch(email, (val) => {
  resetStatus()
  signupStore.email = val.trim()
})

// 비밀번호 변경시 Pinia도 동기화
watch(password, (val) => {
  signupStore.password = val
})
</script>

<style scoped>
.email-check-container {
  max-width: 420px;
  margin: 3rem auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none;
}

label {
  display: block;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.3rem;
  color: #222;
  font-size: 1.1rem;
}

input {
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 1.1rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

input.valid {
  border-color: #4caf50;
  background-color: #e8f5e9;
}

input.invalid {
  border-color: #f44336;
  background-color: #ffebee;
}

input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 8px #2196f3aa;
}

.btn-check {
  margin-top: 0.7rem;
  padding: 0.55rem 1.2rem;
  font-weight: 700;
  font-size: 1rem;
  background: linear-gradient(135deg, #2196f3 0%, #1e88e5 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease, transform 0.15s ease;
}

.btn-check:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-check:not(:disabled):hover {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  transform: scale(1.05);
}

.status-message {
  margin-top: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  min-height: 26px;
  user-select: none;
}

.status-message.info {
  color: #666;
}

.status-message.loading {
  color: #ffa726;
  animation: pulse 1.5s infinite;
}

.status-message.error {
  color: #f44336;
}

.status-message.success {
  color: #4caf50;
}

.error-msg {
  color: #f44336;
  font-weight: 600;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  user-select: none;
}

.btn-submit {
  margin-top: 2rem;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1.15rem;
  font-weight: 800;
  border-radius: 12px;
  background: linear-gradient(135deg, #66d9e8 0%, #00bcd4 100%);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 16px #00bcd477;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-submit:not(:disabled):hover {
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  transform: scale(1.05);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
