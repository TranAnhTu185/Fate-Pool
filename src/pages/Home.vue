<script setup>

import Rank from "@/tabs/Rank.vue";
import Header from "@/components/layouts/Header.vue";
import Home from "@/tabs/Home.vue";
import {inject, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

const setTitle = inject('setTitle');
const {t} = useI18n();
const tab = ref('home');

onMounted(() => {
  setTitle(t('current_pool'));
});

watch(() => tab.value, (value) => {
  if (value === 'home') {
    setTitle(t('current_pool'));
  } else if (value === 'rank') {
    setTitle(t('rank'));
  }
});

</script>

<template>
  <div>
    <div class="custom-panel">
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="home">
          <Home/>
        </q-tab-panel>

        <q-tab-panel name="rank">
          <Rank/>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div id="ton-connect"></div>
    <div class="main-menu">
      <q-tabs v-model="tab" class="text-teal custom-tab">
        <q-tab name="home" :label="t('home')"/>
        <q-tab name="rank" :label="t('rank')"/>
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