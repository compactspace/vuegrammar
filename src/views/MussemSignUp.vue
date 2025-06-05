<template>
  <div class="signup-container">
    <StepIndicator :currentStep="currentStep" />
    <component :is="currentComponent" @next="nextStep" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'



import Step1 from '../components/MussemSignUp/Step1.vue'
import Step2 from '../components/MussemSignUp/Step2.vue'
import Step3 from '../components/MussemSignUp/Step3.vue'
import Step4 from '../components/MussemSignUp/Step4.vue'
import Step5 from '../components/MussemSignUp/Step5.vue'
import StepIndicator from '../components/MussemSignUp/StepIndicator.vue'

const currentStep = ref(1)

const componentsMap = {
  1: Step1,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
}

const currentComponent = computed(() => componentsMap[currentStep.value])

function nextStep() {
  if (currentStep.value < 5) {
    currentStep.value++
  }
}
</script>

<style scoped>
.signup-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1rem;
}
</style>
