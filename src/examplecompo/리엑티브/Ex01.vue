<template>
  <div>
    <input v-model="myInfo.firstName" name="firstName" placeholder="First Name" @change="updateMyInfo" />
    <input v-model="myInfo.age" name="age" placeholder="Age" @change="updateMyInfo" />
  </div>
</template>

<script setup>
import { reactive ,watch ,watchEffect} from 'vue';
const myInfo = reactive({
  firstName: '입력바람',
  age: '입력바람'
});

// 입력값이 바뀔 때마다 호출되는 함수
const updateMyInfo = (e) => {
  const { name, value } = e.target;

  // name에 해당하는 값을 동적으로 업데이트
  myInfo[name] = value;
  console.log(`name: ${name} value: ${value}`);
  console.log('Updated myInfo:', myInfo);
};

watch(
  () => myInfo,
  (newVal, oldVal) => {
    console.log('myInfo 전체 변경 감지!', newVal);
  },
  { deep: true }
);

watchEffect(()=>{

    //상태 객체의 속성에 접근해야 반응 단 순참조  let x=myInfo 이러한 행위는 반응 x
    let x=myInfo.firstName;
    console.log(`무조건실행 ${myInfo}`);
})



</script>
