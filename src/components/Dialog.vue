<template>
  <q-dialog v-model="showDialog" position="bottom">
    <q-card class="bottom-sheet" v-pull-to-close>
      <div class="drag-handle"></div>
      <q-card-section>
        <p>Kéo handle phía trên để đóng</p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
// Auto-import đã xử lý, không cần import thủ công
import {ref} from "vue";

const showDialog = ref(true)
</script>

<style scoped>
.drag-handle {
  width: 40px;
  height: 4px;
  background: #ddd;
  margin: 8px auto;
  border-radius: 2px;
}

.bottom-sheet {
  border-radius: 20px 20px 0 0;
}
</style>