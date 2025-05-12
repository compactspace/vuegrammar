<template>
  <div>
    <button @click="loadProducts">Load Products</button>
    <ul>
      <li v-for="product in productStore.products" :key="product.id">
        {{ product.name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useProductStore } from "../../stores/examples/핀냐Ex01/PiniaEx1";

const productStore = useProductStore(); // 스토어 가져오기

console.log(productStore.productCount);

// 컴포넌트에서 사용하는 함수

const loadProducts = async () => {
  await productStore.fetchProducts(); // 스토어의 action 호출

  console.log(productStore.products);
};
</script>
