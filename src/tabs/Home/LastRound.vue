<script setup>

import {inject, onMounted, onUnmounted, ref} from "vue";
import {BASE_API_URL, CURRENCY} from "@/const.js";
import number_utils from "../../tools/number_utils.js";
import app from "@/tools/app.js";
import {useI18n} from "vue-i18n";
import FlowerRain from "@/components/FlowerRain.vue";

const ws = inject('websocket');

const lastRound = ref([])
const roundDetail = ref(null);
const showRoundDetail = ref(false);
const {t} = useI18n();
const refFlowerRain = ref(null);

onMounted(() => {
  loadHistory();
  ws.on('message', listenLoadHistory);
});

onUnmounted(() => {
  ws.off('message', listenLoadHistory);
});

const startRain = () => {
  if (refFlowerRain.value) {
    refFlowerRain.value.startRain();
  }
};

const listenLoadHistory = (data) => {
  const dt = JSON.parse(data.data);
  const c = dt.c;
  if (c !== undefined && c !== null) {
    if ('s' === c) {
      loadHistory();
    }
  }
};

const loadHistory = async () => {
  let resp = await fetch(`${BASE_API_URL}/round/history/${app.get_current_network()}`, {
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
  // console.log("loadHistory: ", resp.data)
  if (resp && resp.data) {
    lastRound.value = resp.data;
  }
}

const handleShowRoundDetail = (item) => {
  roundDetail.value = item;
  showRoundDetail.value = true;
};

const get_avatar_image = (avatar) => {
  return avatar ? avatar : '/images/default.jpg';
}

</script>

<template>
  <div>
    <FlowerRain ref="refFlowerRain"/>
    <h5>{{ t("last_pool") }}</h5>
    <div>
      <div v-for="item in lastRound" :key="item.id" @click="handleShowRoundDetail(item)" class="t-radius round-item">
        <div class="box-info">
          <p># Pool {{ number_utils.formatNumberExFloatV2(item.round_id) }}</p>
          <p>
            <b>{{ number_utils.formatNumberExFloatV2(item.value) }}</b> {{ CURRENCY }}
          </p>
        </div>
        <div class="box-ctrl">
          <q-btn flat round icon="east"/>
        </div>
      </div>
    </div>

    <q-dialog v-model="showRoundDetail" persistent class="buy-ticket-dialog round-detail-dialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-center">{{ t("winner") }}</div>
          <q-space/>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-card-section>

        <q-card-section>
          <div class="winner-info-box">
            <q-avatar size="80px" class="avatar">
              <img :src="get_avatar_image(roundDetail.winner.avatar)" :alt="roundDetail.winner.username">
            </q-avatar>
            <div class="text-h6 text-center">{{ roundDetail.winner.username }}</div>
          </div>

          <div class="text-h6 text-center">
            <span class="winning-amount">+ {{
                number_utils.formatNumberExFloatV2(roundDetail.winner.win_value)
              }} {{ CURRENCY }}</span>

            <div class="bet-info">
              <div>
                <p class="text-14asdg">{{ t("winner_ticket") }}</p>
                <h5 class="text-bold">{{ number_utils.formatNumberEx(roundDetail.winner.tickets) }}</h5>
              </div>

              <div>
                <p class="text-14asdg">{{ t("winner_profit") }}</p>
                <h5 class="text-bold">{{ number_utils.formatNumberExFloatV2(roundDetail.winner.profit) }}%</h5>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="sass">

.bet-info
  display: flex
  justify-content: space-around
  margin-top: 20px

.round-item
  display: flex
  justify-content: space-between
  padding: 10px
  margin-top: 10px
  background: $backgroundSecondary

  .box-info
    b
      font-weight: bold

    p
      margin: 0

  .box-ctrl
    max-width: 50px
    min-width: 50px

.text-14asdg
  font-size: 14px
  color: $textSecondary
  margin-bottom: 0

.mt-411f
  margin-top: 12px
</style>

<style lang="sass">
.round-detail-dialog
  .winner-info-box
    display: flex
    flex-direction: column
    align-items: center
    margin-bottom: 20px

    .avatar
      margin-bottom: 10px

  .winning-amount
    background: linear-gradient(45deg, #1A1F2C, #FFD369, #0A0E17)
    background-size: 400% 400%
    animation: gradientFlow 12s ease infinite
    border-radius: 40px
    padding: 10px 25px
    color: white
    margin-top: 10px
    font-size: 28px
    font-weight: bold

@keyframes gradientFlow
  0%
    background-position: 0 50%
  50%
    background-position: 100% 50%
  100%
    background-position: 0 50%
</style>