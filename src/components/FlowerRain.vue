<script setup>

import {onMounted, ref} from "vue";

const interval = ref(null);

onMounted(() => {
  // startRain();
  //
  // setTimeout(() => {
  //   stopRain();
  // }, 5000);
});

const startRain = () => {
  interval.value = setInterval(createRain, 300);
}

const stopRain = () => {
  clearInterval(interval.value);
  interval.value = null;
}

const createRain = () => {
  const container = document.querySelector('.petals-container');

  for(let i = 0; i < 15; i++) {
    const petal = document.createElement('img');
    petal.className = 'petal';

    petal.src = `images/effect/Vector-${Math.floor(Math.random() * 195) + 1}.png`;

    const size = Math.random() * 30 + 10;
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;

    const startX = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 200;

    const startRotate = Math.random() * 360;
    const endRotate = startRotate + (Math.random() * 720 - 360);
    const duration = Math.random() * 3 + 1;

    petal.style.setProperty('--start-x', `${startX}vw`);
    petal.style.setProperty('--drift', `${drift}px`);
    petal.style.setProperty('--start-rotate', `${startRotate}deg`);
    petal.style.setProperty('--end-rotate', `${endRotate}deg`);
    petal.style.animationDuration = `${duration}s`;

    container.appendChild(petal);

    setTimeout(() => petal.remove(), duration * 1000);
  }
}

defineExpose({
  startRain,
  stopRain
});
</script>

<template>
  <div class="petals-container">
  </div>
</template>

<style scoped lang="sass">

</style>