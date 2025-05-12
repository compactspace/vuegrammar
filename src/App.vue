<script setup>
import HelloWorld from './components/HelloWorld.vue';
import Ex01 from './examplecompo/리엑티브/Ex01.vue';
import Ex02 from './examplecompo/리엑티브/Ex02.vue';
import PinEx01 from './examplecompo/상태관리/PinEx01.vue';
import PersistencePinEx01 from './examplecompo/영구상태관리/PersistencePinEx01.vue';
import LocalJavaEx01 from './examplecompo/로컬자바서버/LocalJavaEx01.vue';
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <!-- <HelloWorld msg="Vite + Vue" /> -->
  <LocalJavaEx01/>

</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
