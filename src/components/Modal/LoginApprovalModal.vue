<!-- components/LoginApprovalModal.vue -->
<template>
  <div class="modal-backdrop">
    <div class="modal-container">
      <h3>{{ message }}</h3>
      <div class="button-group">
        <button @click="handleApprove">✅ 허용</button>
        <button class="danger" @click="handleReport">🚨 신고</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: String
})

const emit = defineEmits(['response'])

const handleApprove = () => emit('response', true)
const handleReport = () => emit('response', false)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  text-align: center;
  max-width: 400px;
}

.button-group {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

button {
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

button.danger {
  background-color: #e53935;
  color: white;
}

button:not(.danger) {
  background-color: #4caf50;
  color: white;
}
</style>
