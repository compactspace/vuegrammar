// stores/productStore.js
import { defineStore } from "pinia";
import axios from "axios";
export const useProductStore = defineStore("product", {
  state: () => ({
    products: [], // 상태 초기값
  }),

  getters: {
    // products 배열 길이를 반환하는 예제
    productCount: (state) => state.products.length,
  },

  actions: {
    // 상태 변경과 비동기 작업을 처리하는 예제
    async fetchProducts() {
      const res = await axios.get("https://dummyjson.com/products");
      this.products = res.data.products;
    },

    addProduct(product) {
      this.products.push(product);
    },
  },
});
