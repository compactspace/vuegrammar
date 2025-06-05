<template>
  <div>
    <h2>휴대폰 인증</h2>
    <p>휴대폰 번호를 입력하고 인증번호를 받아주세요.</p>
    <input type="tel" v-model="phone" placeholder="휴대폰 번호 입력" />
    <button :disabled="!validPhone" @click="sendCode">인증번호 받기</button>

    <div v-if="codeSent" style="margin-top: 1rem;">
      <input type="text" v-model="code" placeholder="인증번호 입력" />
      <button :disabled="!code" @click="verifyCode">인증 완료</button>
    </div>

    <p v-if="message" :style="{ color: messageColor, marginTop: '1rem' }">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch ,computed} from 'vue'

const emits = defineEmits(['next'])

const phone = ref('')
const code = ref('')
const codeSent = ref(false)
const message = ref('')
const messageColor = ref('red')

const validPhone = computed(() => {
  return /^\d{10,11}$/.test(phone.value.replace(/-/g, ''))
})

function sendCode() {
  if (!validPhone.value) {
    message.value = '올바른 휴대폰 번호를 입력해주세요.'
    messageColor.value = 'red'
    return
  }
  codeSent.value = true
  message.value = '인증번호가 발송되었습니다.'
  messageColor.value = '#66D9E8'
}

function verifyCode() {
  // 간단 검증 (실제론 서버통신 필요)
  if (code.value === '1234') {
    message.value = '인증 성공!'
    messageColor.value = '#66D9E8'
    emits('next')
  } else {
    message.value = '인증번호가 올바르지 않습니다.'
    messageColor.value = 'red'
  }
}
</script>

<style scoped>
input {
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  box-sizing: border-box;
}

button {
  background-color: #66D9E8;
  border: none;
  color: white;
  padding: 0.5rem 1.5rem;
  margin-top: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
