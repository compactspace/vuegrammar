<template>
<h1>dfdf</h1>
<h1></h1>
</template>
<script setup>
import { useUserInfoStore } from '../../stores/examples/영속성핀냐/UserInfo.Ex01';


const userInfo=useUserInfoStore();

userInfo.saveUserInfo({name:"큐티민지"})


</script>