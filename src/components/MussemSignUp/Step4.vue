<template>
  <div class="address-step">
    <h2>주소지 및 활동지역, 이동수단 선택</h2>

    <label>
      주소지: 1차 행정구역
      <input
        type="text"
        v-model="address"
        placeholder="주소 입력"
        :class="{ invalid: addressTouched && !address }"
        @blur="addressTouched = true"
        readonly
      />
      <button type="button" @click="openDaumPostcode" class="btn-postcode">
        주소 검색
      </button>
    </label>

    <label>
      활동지역: 2차 행정구역
      <input
        type="text"
        v-model="activityArea"
        placeholder="활동지역 입력"
        :class="{ invalid: activityAreaTouched && !activityArea }"
        @blur="activityAreaTouched = true"
      />
    </label>



  <label>
      활동지역: 3차 행정구역
      <input
        type="text"
        v-model="activityAreaGu"
        placeholder="활동지역 입력"
        :class="{ invalid: activityAreaTouched && !activityArea }"
        @blur="activityAreaTouched = true"
      />
    </label>




    <label>
      이동수단:
      <select
        v-model="transport"
        :class="{ invalid: transportTouched && !transport }"
        @blur="transportTouched = true"
      >
        <option disabled value="">선택하세요</option>
        <option value="bicycle">자전거</option>
         <option value="motorcycle">오토바이</option>
        <option value="scooter">전동 킥보드</option>
        <option value="car">자동차</option>
        <option value="walking">도보</option>
      </select>
    </label>

    <label v-if="requiresLicense">
      운전면허번호:
      <input
        type="text"
        v-model="licenseNum"
        placeholder="운전면허번호 입력"
        :class="{ invalid: licenseTouched && !licenseNum }"
        @blur="licenseTouched = true"
      />
    </label>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <button
      :disabled="!canProceed || loading"
      @click="continueStep"
      class="btn-continue"
    >
      {{ loading ? '처리중...' : '계속하기' }}
    </button>

    <!-- 다음 우편번호 서비스 표시 영역 -->
    <div
      v-if="showPostcode"
      id="postcode-container"
      style="position: relative; width: 100%; height: 400px; margin-top: 1rem;"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useSignupStore } from '../../stores/useSignupStore.js';
import axios from 'axios';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

const emits = defineEmits(['next']);
const signupStore = useSignupStore();

const address = ref(signupStore.activeRegions[0] || '');
const activityArea = ref(signupStore.activeRegions[1] || '');
const activityAreaGu=ref(signupStore.activeRegions[2] || '');
const transport = ref(signupStore.vehicleType || '');
const licenseNum = ref(signupStore.licenseNum || '');

const addressTouched = ref(false);
const activityAreaTouched = ref(false);
const transportTouched = ref(false);
const licenseTouched = ref(false);

const error = ref('');
const loading = ref(false);

const showPostcode = ref(false);
const isDaumLoaded = ref(false);

onMounted(() => {
  const script = document.createElement('script');
  script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  script.async = true;
  script.onload = () => {
    isDaumLoaded.value = true;
  };
  document.body.appendChild(script);
});

const openDaumPostcode = async () => {
  if (!isDaumLoaded.value) {
    alert('주소 검색 기능을 불러오는 중입니다. 잠시만 기다려주세요.');
    return;
  }
  showPostcode.value = true;
  await nextTick();

  new window.daum.Postcode({
    oncomplete(data) {

      console.log(data)
      // 예: "경기도 안양시 동안구"
      const firstAdmin = data.query.trim().split(' ')[0]; // "경기도"
      const gu = data.query.trim().split(' ')[2]; // "경기도"
      signupStore.activeRegions[0] = firstAdmin;
      
      
      //1차 최상위 행정구역
      address.value = firstAdmin
      signupStore.activeRegions[0] = address.value;

      //2차 행정구역
            const secondAdmin = data.query.trim().split(' ')[1] || '';
            activityArea.value = secondAdmin;
            signupStore.activeRegions[1] = secondAdmin;


      //3차 행정구역 
  signupStore.activeRegions[2] = activityAreaGu.value=gu;

      showPostcode.value = false;
    },
    onclose() {
      showPostcode.value = false;
    },
  }).embed(document.getElementById('postcode-container'));
};

const requiresLicense = computed(() =>
  ['bike', 'scooter', 'car'].includes(transport.value)
);

const canProceed = computed(() =>
  address.value.trim() !== '' &&
  activityArea.value.trim() !== '' &&
  transport.value !== '' &&
  (!requiresLicense.value || licenseNum.value.trim() !== '')
);

watch(address, val => {
  signupStore.activeRegions[0] = val.trim();
});
watch(activityArea, val => {
  signupStore.activeRegions[1] = val.trim();
});
watch(transport, val => {
  signupStore.vehicleType = val;
  if (val === 'walk') {
    licenseNum.value = '';
    signupStore.licenseNum = null;
  }
});
watch(licenseNum, val => {
  if (transport.value !== 'walk') {
    signupStore.licenseNum = val.trim();
  }
});

async function continueStep() {
  if (!canProceed.value) {
    error.value = '모든 정보를 정확히 입력해주세요.';
    toast.error(error.value);
    return;
  }

  error.value = '';
  loading.value = true;

  const payload = {
    email: signupStore.email,
    password: signupStore.password,
    licenseNum: signupStore.licenseNum,
    vehicleType: signupStore.vehicleType,
    activeRegions: signupStore.activeRegions,
    agreedTermIds: signupStore.agreedTermIds,
  };

  console.log('📤 전송 데이터:', payload);

  try {
    await axios.post('users/mussemSignup', payload);
    toast.success('회원가입 정보가 성공적으로 저장되었습니다!');
    // emits('next');
  } catch (err) {
    console.error('서버 오류:', err);
    toast.error('서버 저장 실패!');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.address-step {
  max-width: 480px;
  margin: 2rem auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none;
}

h2 {
  font-weight: 700;
  color: #222;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
}

label {
  display: block;
  margin: 1rem 0 0.5rem 0;
  font-weight: 600;
  color: #333;
  position: relative;
}

input,
select {
  width: 100%;
  padding: 0.6rem 0.9rem;
  font-size: 1.05rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

input.invalid,
select.invalid {
  border-color: #f44336;
  background-color: #ffebee;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 8px #2196f3aa;
}

.error-msg {
  color: #f44336;
  font-weight: 700;
  margin-top: 0.6rem;
  user-select: none;
}

.btn-continue {
  margin-top: 1.8rem;
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 1.15rem;
  font-weight: 800;
  border-radius: 12px;
  background: linear-gradient(135deg, #66d9e8 0%, #00bcd4 100%);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 16px #00bcd477;
  transition: background-color 0.3s ease, transform 0.2s ease;
  user-select: none;
}

.btn-continue:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-continue:not(:disabled):hover {
  background: linear-gradient(135deg, #00bcd4 0%, #00acc1 100%);
  transform: scale(1.05);
}

.btn-postcode {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: #2196f3;
  border: none;
  color: white;
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
}

.btn-postcode:hover {
  background: #1976d2;
}
</style>
