<template>
  <div>
    <h2>약관 동의</h2>

    <div v-for="term in terms" :key="term.id" style="margin-bottom: 1rem;">
    
      <label>
        <input
          type="checkbox"
          :checked="agreedTermIds.includes(term.term_id)"
          @change="toggleAgreement(term.term_id, $event.target.checked)"
        />
        <strong>[{{ term.required ? '필수' : '선택' }}]</strong> {{ term.title }}
        <button @click="openTerm(term)">보기</button>
      </label>
    </div>

    <p v-if="error" style="color: red;">{{ error }}</p>
    <button :disabled="!canProceed" @click="continueStep">계속하기</button>

    <div v-if="selectedTerm" style="background:#f9f9f9; padding:1rem; margin-top:1rem;">
      <h3>{{ selectedTerm.title }} (v{{ selectedTerm.version }})</h3>
      <p style="white-space: pre-wrap;">{{ selectedTerm.content }}</p>
      <button @click="selectedTerm = null">닫기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSignupStore } from '../../stores/useSignupStore'
import axios from 'axios'

const emits = defineEmits(['next'])

const signupStore = useSignupStore()

const terms = ref([])
const selectedTerm = ref(null)
const error = ref('')

const agreedTermIds = computed({
  get() {
    return signupStore.agreedTermIds
  },
  set(val) {
    signupStore.agreedTermIds = val
  }
})

function toggleAgreement(termId, checked) {
  if (checked) {
    if (!agreedTermIds.value.includes(termId)) {
      agreedTermIds.value = [...agreedTermIds.value, termId]
    }
  } else {
    agreedTermIds.value = agreedTermIds.value.filter(id => id !== termId)
  }
}

const canProceed = computed(() => {
  return terms.value
    .filter(t => t.required)
    .every(t => agreedTermIds.value.includes(t.id))
})

function continueStep() {
  if (!canProceed.value) {
    error.value = '필수 항목에 모두 동의해주세요.'
    return
  }
  error.value = ''
  emits('next')
}

function openTerm(term) {
  selectedTerm.value = term
}

// ✅ 실제 API 호출로 약관 가져오기
onMounted(async () => {
  try {
    const response = await axios.get('/users/getTermList')
    if (response.data.success && Array.isArray(response.data.termList)) {
      terms.value = response.data.termList
    } else {
      error.value = '약관 데이터를 불러오지 못했습니다.'
    }
  } catch (err) {
    console.error('약관 불러오기 실패:', err)
    error.value = '서버 오류로 약관을 불러오지 못했습니다.'
  }
})
</script>

<style scoped>
button {
  background-color: #66D9E8;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
