<script setup>

import {computed, onMounted, onUnmounted, ref, watch} from "vue";

const props = defineProps({
  timeInMs: {
    type: Number,
    required: true
  }
});

const remainingTime = ref(props.timeInMs);

const days = computed(() => Math.floor(remainingTime.value / (1000 * 60 * 60 * 24)));
const hours = computed(() => Math.floor((remainingTime.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
const minutes = computed(() => Math.floor((remainingTime.value % (1000 * 60 * 60)) / (1000 * 60)));
const seconds = computed(() => Math.floor((remainingTime.value % (1000 * 60)) / 1000));

let interval;

const startCountdown = () => {
  interval = setInterval(() => {
    if (remainingTime.value > 0) {
      let val = remainingTime.value - 1000;
      if (val < 0) {
        val = 0;
      }
      remainingTime.value = val;
    } else {
      clearInterval(interval);
    }
  }, 1000);
};

onMounted(() => {
  startCountdown();
});

onUnmounted(() => {
  clearInterval(interval);
});

watch(() => props.timeInMs, (newVal) => {
  remainingTime.value = newVal;
  clearInterval(interval);
  startCountdown();
});

</script>

<template>
  <h5>{{ hours }}h {{ minutes }}m {{ seconds }}s</h5>
</template>

<style scoped lang="sass">

</style>