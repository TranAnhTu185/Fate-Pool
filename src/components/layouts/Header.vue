<script setup>

import {computed, onMounted, ref} from "vue";
import { useRouter, useRoute } from 'vue-router';
import {useAuthStore} from "@/stores/store.js";
const authStore = useAuthStore();

const router = useRouter()
const props = defineProps({
  title: String,
});

const profile = ref(null);
const userInfo = computed(() => authStore.user);
const routeName = computed(() => router?.currentRoute?.value?.name);

onMounted(() => {
  getProfile();
});

const getProfile = () => {
  profile.value = {
    avatar: "/images/default.jpg",
    username: "JohnDoe",
  }
}

const goToProfile = () => {
  router.push({name: 'profile'});
}

const goToHome = () => {
  router.push({name: 'home'});
}

</script>

<template>
  <div>
    <div class="box-header w-full relative">
      <button class="button-home btn-effect" v-if="routeName !== 'home'" @click="goToHome">
        <q-icon name="home"/>
      </button>
      <div v-if="userInfo && userInfo.user_id && routeName !== 'profile'" class="profile btn-effect" @click="goToProfile">
        <img :src="userInfo.avatar" alt="avatar" class="avatar"/>
        <p class="mb-0 username">{{userInfo.display_name}}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
@import "@/quasar-variables.sass"

.button-home
  color: $textPrimary
  background: none
  outline: none
  position: absolute
  left: 0
  top: 0
  font-size: 22px
  border: 1px solid
  border-radius: 50%
  line-height: 16px
  padding: 5px 6px

.username
  max-width: 80px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.profile
  display: flex
  align-items: center
  gap: 10px
  justify-content: flex-end
  position: absolute
  left: 0
  top: 0
  cursor: pointer
  border: 1px solid
  padding: 0px
  border-radius: 30px
  padding-right: 8px

  .avatar
    width: 30px
    height: 30px
    border-radius: 50%

.box-header
  position: relative
  background: $backgroundPrimary
  z-index: 99

  .header-title
    padding: 15px
    padding-top: 0px
    font-size: 20px
</style>