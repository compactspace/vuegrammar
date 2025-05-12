<template>

</template>

<script setup>
import axios from 'axios';

axios.get('api/dfsdf').then((res)=>{
    console.log(res.data)
})


</script>