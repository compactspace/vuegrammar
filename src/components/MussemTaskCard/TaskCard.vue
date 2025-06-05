<template>
  <div class="task-card">
    <div class="task-info">
      <h4>{{ task.title }}</h4>
      <p v-if="task.distance">📍 거리: {{ task.distance }} km</p>
      <p v-if="task.reward">💰 보수: {{ task.reward.toLocaleString() }}원</p>
      <p v-if="task.time">⏱️ 요청 시간: {{ task.time }}</p>
    </div>

    <button class="accept-button" @click="$emit('accept', task.id)">
      수락하기 ✅
    </button>
  </div>
</template>

<script setup>
defineProps({
  task: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.task-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-info h4 {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.task-info p {
  margin: 0.25rem 0;
  font-size: 0.95rem;
  color: #444;
}

.accept-button {
  background-color: #007bff;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.accept-button:hover {
  background-color: #0056b3;
}
</style>
