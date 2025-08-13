<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">
            <button @click="handleClose" class="button-close-modal btn-effect"><q-icon name="close"/></button>
            <!-- Modal content -->
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import {onMounted, onBeforeUnmount, watch} from 'vue';

const props = defineProps({
  isOpen: Boolean
});
const emit = defineEmits(['close']);

// Chặn scroll khi modal mở
const disableScroll = () => {
  document.body.style.overflow = 'hidden';
};

const enableScroll = () => {
  document.body.style.overflow = '';
};

const handleClose = () => {
  emit('close');
};

// Xử lý khi component mount/unmount
onMounted(() => {
  if (props.isOpen) disableScroll();
});

onBeforeUnmount(() => {
  enableScroll();
});

// Theo dõi sự thay đổi của isOpen
watch(() => props.isOpen, (val) => {
  if (val) disableScroll();
  else enableScroll();
});
</script>

<style scoped>

.button-close-modal {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
  background: #F1F3F5;
  border-radius: 15px;
  font-size: 16px;
  padding: 3px 8px;
  color: #7A8999;
}

.modal-mask {
  position: fixed;
  z-index: 30;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end; /* Hiện từ dưới lên */
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-container {
  width: 100%;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 15px;
  transition: all 0.3s ease;
  position: relative;
  padding-top: 40px;
}

/* Hiệu ứng xuất hiện */
.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}
</style>