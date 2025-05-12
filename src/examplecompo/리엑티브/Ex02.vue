<template>
  <div>
    <h1>Products</h1>
    <div v-if="products.length != 0">
      <!-- 제품 리스트를 v-for로 순회 -->
      <div v-for="(product, index) in products" :key="product.id" class="product-item">
        <h3>{{ product.title }}</h3>
        <p>{{ product.description }}</p>
        <p>Price: ${{ product.price }}</p>

        <!-- 이미지가 있으면 표시 -->
        <div v-if="product.images && product.images.length != 0">
          <img :src="product.images[0]" alt="Product Image" />
        </div>

        <!-- 리뷰 출력 -->
        <div v-if="product.reviews && product.reviews.length > 0">
          <h4>Reviews</h4>
          <div v-for="(review, index) in product.reviews" :key="index">
            <p>
              {{ review.reviewerName }}: {{ review.comment }} (Rating:
              {{ review.rating }})
            </p>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>No products available</p>
    </div>
  </div>
</template>

<script setup lang="js">
import axios from 'axios';
import { onMounted } from 'vue';
import { reactive ,watch ,ref} from 'vue';


// 상태 변수로 제품 리스트 관리
const products = reactive([]);

// 컴포넌트가 마운트될 때 데이터 요청
onMounted(async () => {
  try {
    // axios를 통해 데이터 받아오기
    const response = await axios.get('https://dummyjson.com/products');
    // 데이터에서 products 배열을 상태 변수에 할당
    products.push(...response.data.products); // spread 연산자를 사용하여 데이터 삽입
  } catch (error) {
    console.error("Error fetching products:", error);
  }
});
</script>
