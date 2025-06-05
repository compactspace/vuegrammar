<template>
  <div class="step-indicator">
    <div
      v-for="num in 5"
      :key="num"
      :class="['step', { active: num === currentStep }]"
    >
      {{ num }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStep: Number,
})
</script>

<style scoped>
.step-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.step {
  width: 36px;
  height: 36px;
  line-height: 36px;
  border-radius: 50%;
  background-color: #ccc;
  color: white;
  text-align: center;
  font-weight: bold;
}

.step.active {
  background-color: #66D9E8;
}
</style>
