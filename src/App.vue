<script setup>

import {computed, inject, onMounted, onUnmounted, provide, ref, watch} from "vue";
import Header from "@/components/layouts/Header.vue";
import web3_helper from "@/tools/web3_helper.js";
import VsToast from "@vuesimple/vs-toast";
import {useI18n} from "vue-i18n";
import Loading from "@/components/Loading.vue";
import {useCommonStore} from "@/stores/store.js";
import {CURRENCY} from "@/const.js";

const {t} = useI18n();

const isLoading = ref(false);
const ws = inject('websocket');
const title = ref('');
const commonStore = useCommonStore();
const loadingFromStore = computed(() => commonStore.loading);

onUnmounted(() => {
  ws.off('message', onWsMessage);
});

onMounted(() => {
  authentication();
  ws.on('message', onWsMessage);
});

const onWsMessage = (data) => {
  const dt = JSON.parse(data.data);
  const c = dt.c;
  if (c !== undefined && c !== null) {
    if ('deposit' === c) {
      const value = dt.p.value;
      let msg = `${t('deposit_succeed', {'value': value, 'currency': CURRENCY})}`;
      VsToast.success(msg);
    }else if ('withdraw' === c) {
      const value = dt.p.value;
      let msg = `${t('withdraw_succeed', {'value': value, 'currency': CURRENCY})}`;
      VsToast.success(msg);
    }
  }
}

watch(loadingFromStore, (newLoading) => {
  setLoading(newLoading);
});

const setLoading = (loading) => {
  isLoading.value = loading;
};

const setTitle = (rawTitle) => {
  title.value = rawTitle;
};

provide('setLoading', setLoading);
provide('setTitle', setTitle);

const authentication = async () => {
  let init_app = await web3_helper.init_app();
  console.log("init_app: " + JSON.stringify(init_app));
  if (init_app.init === true) {
    let user = await web3_helper.get_user_info();
    console.log("user: ", user);
    if (user === undefined || user === null) {
      VsToast.error(t("auth_failed"))
    } else {
      ws.newToken(user.token);
    }
  }
}

</script>

<template>
  <div style="display: none" id="ton-connect"></div>
  <Loading v-if="isLoading"/>
  <div class="main">
    <Header :title="title"/>
    <router-view/>
  </div>
</template>

<style lang="sass">
@import "@/quasar-variables.sass"

body
  background: $backgroundPrimary
  color: $textPrimary

  .custom-panel

    .q-tab-panel
      padding: 0
      margin: 0

.custom-tab
  background: $backgroundSecondary

  .q-tab.q-tab--active
    background: #1B9FD5

.t-box-shadow
  box-shadow: 0 0 10px rgb(148 145 155 / 30%)


.t-gradient
  background: linear-gradient(135deg, #0A0E17 0%, #1A1F2C 100%)

.t-radius
  border-radius: 16px

.main
  .q-tab-panels
    background: none

.custom-tab
  border-radius: 30px
  overflow: hidden
  margin: auto
  border: 1px solid $buttonBGBorderSecondary
  color: white

  .q-tab
    margin: 0
    padding: 0px 40px
    border-radius: 30px

  .q-tab__label
    color: #FFFFFF

  .q-tab__indicator
    display: none
</style>

<style lang="sass">
.btn-effect
  transition: all 0.3s ease
  position: relative

  &:hover
    transform: scale(1.02)

  &:active
    transform: scale(0.98)

    &:before
      opacity: 1

  &:before
    content: ''
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%
    background: rgb(0 0 0 / 10%)
    border-radius: 6px
    opacity: 0
</style>