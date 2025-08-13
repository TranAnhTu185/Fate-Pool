<script setup>

import {onMounted, ref} from "vue";
import {BASE_API_URL, CURRENCY} from "../const.js";
import app from "@/tools/app.js";
import number_utils from "../tools/number_utils.js";
import {useI18n} from "vue-i18n";

const ranks = ref([]);
const {t} = useI18n();

onMounted(async () => {
  let resp = await fetch(`${BASE_API_URL}/round/ranking/${app.get_current_network()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (data) => {
    return await data.json();
  }).catch((error) => {
    console.log("error: " + JSON.stringify(error))
    return null;
  })
  ranks.value = resp.data;
});

const get_avatar_image = (avatar) => {
  return avatar ? avatar : '/images/default.jpg';
}

</script>

<template>
  <div class="rank-tab">
    <div class="title">
      <h4 class="text-center">{{t('rank')}}</h4>
    </div>
    <q-card class="rank-card t-radius">
      <div v-if="ranks && ranks.length > 0">
        <div v-for="(item, index) in ranks" :key="item.user_id" :class="index > 0 ? 'rank-item-border-top' : ''"
             class="rank-item">
          <div class="item-index">
            <span>{{ index + 1 }}</span>
          </div>

          <div class="user-info">
            <q-avatar size="26px" class="avatar">
              <img :src="get_avatar_image(item.avatar)" :alt="item.username">
            </q-avatar>
            <span>
              {{ item.username }}
            </span>
          </div>

          <div class="amount">
            <span>+ {{ number_utils.formatNumberExFloatV2(item.profit) }} {{ CURRENCY }}</span>
          </div>
        </div>
      </div>

      <div v-else>
        <q-card-section class="text-center">
          {{ t("no_data")}}
        </q-card-section>
      </div>
    </q-card>
  </div>
</template>

<style scoped lang="sass">
.rank-tab
  .title
    margin-bottom: 15px
  .rank-card
    background: $backgroundSecondary
    overflow: hidden

  .rank-item
    display: flex
    padding: 15px
    background: $backgroundSecondary

    &.rank-item-border-top
      border-top: 5px solid $backgroundPrimary

    .amount
      text-align: right
      width: 100%
      max-width: 100px
      color: $textUp

    .user-info
      width: 100%
      display: flex

      .avatar
        margin-right: 10px

    .item-index
      min-width: 50px
      max-width: 50px

      span
        background: black
        padding: 3px 8px
        border-radius: 20px
        line-height: 25px

    span
      margin-right: 10px
      font-weight: bold
      color: $textPrimary
</style>