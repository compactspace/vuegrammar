<template>
  <div class="container">
    <h2 class="title">나의 의뢰</h2>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        :class="['tab-button', { active: activeTab === tab }]"
      >
        {{ tab }}
      </button>
    </div>

    <div class="order-list">
      <!-- 진행중: 단일 카드 -->
      <template v-if="activeTab === '진행중' && inProgressOrder">
        <div
          class="order-card special-in-progress"
          @click="goToMatchRoom(inProgressOrder.id)"
        >
          <div class="order-header status-progress">
            <h3 class="order-name">{{ inProgressOrder.name }}</h3>
            <span class="order-status">진행중</span>
          </div>
          <p class="order-info">예상 도착: <em>{{ inProgressOrder.eta }}</em></p>
        </div>
      </template>

      <!-- 완료 / 취소 -->
      <template v-else-if="filteredOrders.length">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-header" :class="statusColorClass(order.status)">
            <h3 class="order-name">{{ order.name }}</h3>
            <span class="order-status">{{ order.status }}</span>
          </div>
          <p v-if="order.deliveredAt" class="order-info completed">완료일: <em>{{ order.deliveredAt }}</em></p>
          <p v-if="order.cancelledAt" class="order-info cancelled">취소일: <em>{{ order.cancelledAt }}</em></p>
        </div>
      </template>

      <!-- 해당 상태에 데이터가 없을 때 -->
      <p v-else class="no-orders">해당 상태의 주문이 없습니다.</p>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const tabs = ["진행중", "완료", "취소"]
const activeTab = ref("진행중")

const orders = ref([
  { id: 1, name: "김치찌개", status: "진행중", eta: "10분 내 도착" },
  { id: 2, name: "된장찌개", status: "완료", deliveredAt: "2025-06-12" },
  { id: 3, name: "비빔밥", status: "취소", cancelledAt: "2025-06-10" },
])

const inProgressOrder = computed(() =>
  orders.value.find((o) => o.status === "진행중")
)

const filteredOrders = computed(() =>
  orders.value.filter((o) => o.status === activeTab.value)
)

const statusColorClass = (status) => {
  switch (status) {
    case "완료":
      return "status-completed"
    case "취소":
      return "status-cancelled"
    case "진행중":
      return "status-progress"
    default:
      return ""
  }
}

function goToMatchRoom(orderId) {
  router.push(`/match-room/${orderId}`)
}
</script>

<style scoped>
/* Container */
.container {
  max-width: 720px;
  margin: 3rem auto;
  padding: 2rem;
  background: linear-gradient(135deg, #f0f4ff, #ffe6f0);
  border-radius: 2rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none;
}

/* Title */
.title {
  font-size: 3rem;
  font-weight: 900;
  text-align: center;
  background: linear-gradient(90deg, #5a2a83, #c91f6f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 3rem;
  text-shadow: 0 2px 5px rgba(90, 42, 131, 0.3);
  letter-spacing: 0.1em;
}

/* Tabs */
.tabs {
  display: flex;
  justify-content: center;
  gap: 3rem;
  border-bottom: 3px solid #b8a0cc;
  margin-bottom: 3rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #a59ec8;
  cursor: pointer;
  position: relative;
  transition: color 0.35s ease;
}

.tab-button:hover {
  color: #7e4a99;
}

.tab-button.active {
  color: #5a2a83;
  font-size: 1.55rem;
  font-weight: 900;
}

.tab-button.active::after {
  content: "";
  position: absolute;
  bottom: -3px;
  left: 20%;
  right: 20%;
  height: 5px;
  background: linear-gradient(90deg, #c91f6f, #5a2a83);
  border-radius: 3px;
  animation: underline-grow 0.4s ease forwards;
}

@keyframes underline-grow {
  from {
    width: 0;
    left: 50%;
    right: 50%;
  }
  to {
    left: 20%;
    right: 20%;
  }
}

/* Order List */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Order Card */
.order-card {
  background: #fff;
  padding: 1.8rem 2.4rem;
  border-radius: 1.5rem;
  border: 2px solid #cbbde2;
  box-shadow: 0 12px 24px rgba(90, 42, 131, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  cursor: pointer;
}

.order-card:hover {
  box-shadow:
    0 20px 30px rgba(100, 60, 160, 0.3),
    0 10px 15px rgba(220, 50, 90, 0.2);
  transform: translateY(-5px);
}

/* Order Header */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
  font-weight: 900;
}

.order-name {
  font-size: 1.75rem;
  color: #4a3a7a;
  user-select: text;
}

.order-status {
  font-size: 1rem;
  padding: 0.35rem 1.1rem;
  border-radius: 9999px;
  font-weight: 900;
  user-select: none;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.04em;
}

/* Status colors */
.status-progress .order-status {
  background: #c1bae4;
  color: #5a2a83;
  border: 1px solid #9a7fc4;
}

.status-completed .order-status {
  background: #cdf0d8;
  color: #2f8b3d;
  border: 1px solid #4eaf5a;
}

.status-cancelled .order-status {
  background: #f8d3d3;
  color: #b72b2b;
  border: 1px solid #d65c5c;
}

/* Order Info */
.order-info {
  font-size: 1.1rem;
  color: #6a5299;
  margin: 0.2rem 0;
}

.order-info em {
  font-style: italic;
  color: #9b7fb0;
}

.order-info.completed {
  color: #2f8b3d;
  font-weight: 700;
}

.order-info.completed em {
  color: #196622;
}

.order-info.cancelled {
  color: #b72b2b;
  font-weight: 700;
}

.order-info.cancelled em {
  color: #7f1f1f;
}

/* No orders message */
.no-orders {
  font-size: 1.4rem;
  font-style: italic;
  color: #b3a1c4;
  text-align: center;
  margin-top: 6rem;
  user-select: none;
}

/* Responsive */
@media (max-width: 600px) {
  .container {
    padding: 1.5rem;
    margin: 2rem 1rem;
  }

  .title {
    font-size: 2.6rem;
  }

  .tabs {
    gap: 1.5rem;
  }

  .tab-button {
    font-size: 1.1rem;
    padding: 0.6rem 1.2rem;
  }

  .tab-button.active {
    font-size: 1.25rem;
  }

  .order-name {
    font-size: 1.4rem;
  }

  .order-info {
    font-size: 1rem;
  }
}

/* 추가: 씹간지 진행중 스타일 */
.special-in-progress {
  background: linear-gradient(135deg, #fef6ff, #e0d4ff);
  border: 2px solid #b999f2;
  box-shadow: 0 0 25px rgba(90, 42, 131, 0.4);
  animation: pulse 1.4s ease-in-out infinite;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.special-in-progress:hover {
  transform: scale(1.02);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(150, 110, 240, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(150, 110, 240, 0.6);
  }
}
</style>
