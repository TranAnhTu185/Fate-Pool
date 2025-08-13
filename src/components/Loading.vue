<script setup>

import {onMounted, onUnmounted} from "vue";

onMounted(() => {
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.body.style.overflow = 'auto';
});

</script>

<template>
  <div class="loading">
    <div class="loading-container">
      <q-spinner
          size="3em"
      />
    </div>
  </div>
</template>

<style scoped lang="sass">
.loading
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100vh
  background: rgba(0, 0, 0, 0.5)
  z-index: 30

  .loading-container
    position: absolute
    top: 50%
    left: 50%
    transform: translate(-50%, -50%)
</style>

<style lang="sass">
@import "@/quasar-variables.sass"

.loading-container svg
  color: $textPrimary

</style>