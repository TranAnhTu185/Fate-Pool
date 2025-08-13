<script setup>

import Rank from "@/tabs/Rank.vue";
import Home from "@/tabs/Home.vue";
import { inject, onMounted, ref, watch, provide } from "vue";
import { useI18n } from "vue-i18n";
import web3_helper from "../tools/web3_helper.js";
import { D_WALLET, PRODUCTION_MODE } from "../const.js";
import {useAuthStore} from "../stores/store.js";

const setTitle = inject('setTitle');
const { t } = useI18n();
const tab = ref('home');
const authStore = useAuthStore();

const isLoading = ref(false);
const showPopupLogin = ref(false);

const signInWithWallet = async () => {
  let user = await web3_helper.get_user_info(this);
  if (user && m_utils.checkString(user.wallet)) {
    if (user.wallet === D_WALLET) {
      eruda.init();
    }
    console.log("auth user: ", JSON.stringify(user))
  } else {
    console.log("user not found")
  }
}

const setLoading = (loading) => {
  isLoading.value = loading;
};

provide('setLoading', setLoading);

onMounted(() => {
  showPopupLogin.value = false;
  authStore.updateStatus(true);
  if (PRODUCTION_MODE) {
    MiniKit.install("app_5eac984fd1d8dd0ffe9daf76e3a9b95b")
    console.log("MiniKit.isInstalled() = " + MiniKit.isInstalled());
  }
  signInWithWallet();
  setTitle(t('current_pool'));
});

watch(() => authStore.status, (newStatus) => {
  showPopupLogin.value = !newStatus;
  setTitle(t('current_pool'));
});

</script>

<template>
  <div>
    <Loading :isLoading="isLoading" />
    <Popup :is-visible="showPopupLogin">
      <template #body>
        <div class="pb-6">
          <div class="bg-[#F4F5F6] pt-6 pb-[2px] rounded-t-md">
            <p class="mb-4 text-xl text-[#565b69]">You need to authenticate to proceed with further actions.</p>
          </div>

          <button @click="signInWithWallet"
            class="bg-[#2fb600] text-white text-base font-book mt-8 mb-1 min-w-[120px] py-2 px-6 rounded-md">
            Authentication
          </button>
        </div>
      </template>
    </Popup>
    <div class="custom-panel">
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="home">
          <Home />
        </q-tab-panel>

        <q-tab-panel name="rank">
          <Rank />
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div id="ton-connect"></div>
    <div class="main-menu">
      <q-tabs v-model="tab" class="text-teal custom-tab">
        <q-tab name="home" :label="t('home')" />
        <q-tab name="rank" :label="t('rank')" />
      </q-tabs>
    </div>
  </div>
</template>

<style scoped lang="sass">

.main-menu
  position: fixed
  bottom: 0
  width: 100%
  margin: 0px -15px
  padding: 15px

</style>