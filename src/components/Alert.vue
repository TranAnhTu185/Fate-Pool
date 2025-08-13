<script setup>

const props = defineProps({
  message: String,
});

</script>

<template>
  <div class="alert">
    {{ message }}
  </div>
</template>

<style scoped lang="sass">
.alert
  color: #856404
</style>