<script setup>

import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue";
import PotBox from "@/tabs/Home/PotBox.vue";
import LastRound from "@/tabs/Home/LastRound.vue";
import Countdown from "@/components/Countdown.vue";
import web3_helper from "@/tools/web3_helper.js";
import VsToast from "@vuesimple/vs-toast";
import { useI18n } from "vue-i18n";
import { BASE_API_URL, CURRENCY } from "@/const.js";
import m_utils from "@/tools/m_utils.js";
import app from "@/tools/app.js";
import Modal from "@/components/Modal.vue";
import telegram_payment from "@/services/telegram_payment.js";
import { useAuthStore } from "@/stores/store.js";
import api from "@/tools/api.js";
import number_utils from "@/tools/number_utils.js";
import FlowerRain from "@/components/FlowerRain.vue";
import { PRODUCTION_MODE } from "../const";

import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";

const { t } = useI18n();
const count_down = ref(0);
const currentPool = ref({
  "pool": 0,
  "total": 0,
  "tickets": 0
});
const allPosts = ref(10);
const allTickets = ref(10);

const prompt = ref(false);
const amount = ref(0);
const alert = ref(false);
const showModal = ref(false);
const isLoadingPay = ref(false);
const resultPay = ref(null);
const connectedWallet = ref("");
const payAmount = ref(0);
const authStore = useAuthStore();

const current_bet_value = ref(0);
const last_balance = ref(0);

const ws = inject('websocket');
let loadInfoInterval = null;
const showVictory = ref(false);
const refFlowerRain = ref(null);

const token = computed(() => authStore.token);
const userId = computed(() => authStore?.user?.user_id);

const setLoading = inject('setLoading');

watch(token, (newVal, oldVal) => {
  loadInfo(true)
});

onUnmounted(() => {
  if (loadInfoInterval != null) {
    clearInterval(loadInfoInterval);
  }
  ws.off('message', onWsMessage);
  if (refFlowerRain.value) {
    refFlowerRain.value.stopRain();
  }
})

onMounted(() => {
  loadInfo(false);
  loadInfoInterval = setInterval(() => {
    loadInfo(true);
  }, 60000);
  ws.register('Home', 'message', onWsMessage);
})

const showVictoryDialog = () => {
  if (refFlowerRain.value) {
    refFlowerRain.value.startRain();
  }
  showVictory.value = true;
}

const handleCloseVictory = () => {
  showVictory.value = false;
  if (refFlowerRain.value) {
    refFlowerRain.value.stopRain();
  }
}

const onWsMessage = (data) => {
  const dt = JSON.parse(data.data);
  console.log("ws message on home: " + JSON.stringify(dt));
  const c = dt.c;
  if (c !== undefined && c !== null) {
    if (c === 'victory') {
      showVictoryDialog();
    } else if (c === 'winner' && userId.value !== dt.p.user_id) {
      VsToast.success(t('winner_is', { username: dt.p.username }));
    } else if ('s' === c) {
      loadInfo();
      current_bet_value.value = 0;
    } else if ('p' === c) {
      const p = dt.p.data.current_game_info;
      parseBetResp(p);
    } else if ('self_bet' === c) {
      const p = dt.p;
      parseSelfBet(p);
    } else if ('bc' === c) {
      last_balance.value = dt.p.balance;
    }
  }
}

const parseSelfBet = (data) => {
  if (data.current_bet_value) {
    current_bet_value.value = data.current_bet_value;
  }
  if (data.last_balance) {
    last_balance.value = data.last_balance;
  }
}

const loadInfo = async (need_auth) => {
  let wallet;
  if (need_auth) {
    let user = await web3_helper.get_user_info();
    if (user === undefined || user === null || !m_utils.checkString(user.wallet)) {
      wallet = '0x0';
    } else {
      wallet = user.wallet;
    }
  } else {
    wallet = '0x0';
  }
  let url = `${BASE_API_URL}/game/board`;
  let params = {
    wallet_id: wallet,
    network: app.get_current_network()
  }
  let resp = await api.get(url, params);
  let data = resp.data;
  if (data === undefined || data === null) {
    return;
  }
  parseInfo(data);
}

const parseInfo = (data) => {
  console.log("parseInfo", JSON.stringify(data));
  if (data === undefined || data === null) {
    return;
  }
  const board = data.board;
  count_down.value = board.remain_time;
  currentPool.value = {
    pool: data.round,
    total: board.total_value,
    tickets: board.ticket_count
  };
  allPosts.value = data.total_round;
  allTickets.value = data.total_tickets;
  console.log("data.current_bet_value: " + data.current_bet_value)
  if (data.current_bet_value) {
    current_bet_value.value = data.current_bet_value;
  }
  console.log("data.last_balance: " + data.last_balance)
  if (data.last_balance) {
    last_balance.value = data.last_balance;
  }
}

const onBetClicked = async () => {
  if (amount.value === undefined || amount.value <= 0) {
    VsToast.error(t('amount_invalid'));
    return;
  }
  prompt.value = false;
  let val = parseFloat(amount.value);
  await playGame(val);
}

const parseBetResp = (data) => {
  currentPool.value = {
    pool: data.round,
    total: data.total_value,
    tickets: data.ticket_count
  };
  count_down.value = data.remain_time;
}

const playGameVer2 = async (amount) => {

  if (PRODUCTION_MODE) {
    if (!MiniKit.isInstalled()) {
      return
    }
  }

  const user = await web3_helper.get_user_info();
  if (user === undefined || user === null || !m_utils.checkString(user.wallet)) {
    return
  }

  let walletAddress = user.wallet;
  console.log("walletAddress = " + walletAddress);

  setLoading(true);


  let resp = await fetch(`${BASE_API_URL}/payment/init?address=${walletAddress}&amount=${amount}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(async (data) => {
    return await data.json();
  }).catch((error) => {
    console.log("error: " + JSON.stringify(error))
    VsToast.error('Failed to make transaction');
    return null;
  })

  setLoading(false);

  console.log("resp: ", JSON.stringify(resp))
  const rc = m_utils.get_str(resp, "rc", -1);
  if (rc !== 0) {
    console.log("error: " + JSON.stringify(resp))
    const rd = m_utils.get_str(resp, "rd", "Init payment failed");
    VsToast.error(rd);
    return
  }

  const reference = m_utils.get_str(resp, "reference", "");
  const to = m_utils.get_str(resp, "to", "");
  console.log("reference: ", reference)
  console.log("to: ", to)

  const pay = amount || 0.5;
  const payload = {
    reference: reference,
    to: to,
    tokens: [
      {
        symbol: Tokens.WLD,
        token_amount: tokenToDecimals(pay, Tokens.WLD).toString(),
      }
    ],
    description: `Pay ${pay} WLD`,
  }

  const { finalPayload } = await MiniKit.commandsAsync.pay(payload);
  const username = user.username;
  console.log('Final payload: ' + JSON.stringify(finalPayload))

  if (finalPayload.status === 'success') {
    let params = {
      address: walletAddress,
      username: username,
      amount: amount,
      network: "world_coin",
      reference: finalPayload.reference,
      transaction_id: finalPayload.transaction_id
    }

    const body = { "amount": amount };
    const response = await api.post('/api/play', body, params);
    if (response.data) {
      const data = response.data;
      console.log("play game response: " + JSON.stringify(data));
      if (data === undefined || data == null) {
        console.log("dt is null")
        remove_payment_error(walletAddress, reference).then(() => {
          console.log("remove_payment_error -> ok")
        }).catch((e) => {
          console.log("remove_payment_error -> error: " + e)
        });
        return
      }


      let rc = data.rc;
      if (rc === 0) {
        VsToast.success(data.rd);
        let game_info = data.game_info;
        parseBetResp(game_info);
        if (data.last_balance) {
          last_balance.value = data.last_balance;
        }
        if (data.current_bet_value) {
          current_bet_value.value = data.current_bet_value;
        }
      } else {
        console.log("verify failed")
        VsToast.error('Bet failed');
        remove_payment_error(walletAddress, reference).then(() => {
          console.log("remove_payment_error -> ok")
        }).catch((e) => {
          console.log("remove_payment_error -> error: " + e)
        });
      }
    } else {
      console.log("play game is not ok: " + response.status + " - " + response.statusText)
      remove_payment_error(walletAddress, reference).then(() => {
        console.log("remove_payment_error -> ok")
      }).catch((e) => {
        console.log("remove_payment_error -> error: " + e)
      });
      return
    }
  }
}

const playGame = async (amount) => {
  return playGameVer2(amount);
}

const handleJumpOne = async () => {
  await playGame(1);
};

const handleAuthenticate = async () => {
  console.log("authenticate");
  let res = await web3_helper.get_user_info();
  console.log("res: " + JSON.stringify(res));
  if (res === undefined || res === null) {
    VsToast.error(t('auth_failed'));
  }
}

const remove_payment_error = async (wallet, reference) => {
  let params = {
    address: wallet,
    reference: reference,
    network: app.get_current_network()
  }
  const response = await fetch(`${BASE_API_URL}/payment/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  console.log("remove_payment_error: ", response.status)
}

const resetPayment = () => {
  isLoadingPay.value = false;
  resultPay.value = null;
  showModal.value = false;
}

const disconnectWallet = () => {
  if (window.tonConnectUI) {
    window.tonConnectUI.disconnect();
  }
  resetPayment();
}

const handlePay = async () => {
  const user = await web3_helper.get_user_info();
  isLoadingPay.value = true;
  let result = await telegram_payment.executePay(payAmount.value, user.wallet + "");
  console.log(result);
  isLoadingPay.value = false;
  resetPayment();
}

</script>

<template>
  <div class="home-tab">
    <div class="common-info t-radius">
      <div></div>
      <div>
        <div>
          <q-icon name="adjust" />
          {{ t("all_pools") }}: {{ allPosts }}
        </div>

        <div>
          <q-icon name="confirmation_number" />
          {{ t("all_tickets") }}: {{ number_utils.formatNumberExFloatV2(allTickets) }}
        </div>
      </div>
    </div>

    <PotBox :pot="currentPool" />

    <div class="text-center box-jump-button">
      <p>
        {{ t('current_bet') }}
        <span class="text-bold">{{ number_utils.formatNumberExFloatV2(current_bet_value) }} {{ CURRENCY }}</span>
      </p>
      <p>{{ t("result_in") }}</p>

      <Countdown :time-in-ms="count_down" />

      <q-btn-group :disable="!token" push class="button-group-jump" :class="!token ? 'disabled' : ''">
        <q-btn :disable="!token" push :label="`${t('jump_in', { 'currency': CURRENCY })}`" class="jump-one-button"
          @click="handleJumpOne()" />
        <q-btn :disable="!token" push icon="east" @click="prompt = true" class="jump-more-button" />
      </q-btn-group>

      <div>
        <q-btn class="btn-help" flat rounded @click="alert = true">
          <q-icon name="list_alt" /> &nbsp;
          {{ t('how_it_works') }}
        </q-btn>

        <q-dialog class="dialog-help" v-model="alert">
          <q-card>
            <q-card-section class="box-text-help">
              <div class="text-h6">{{ t('how_it_works') }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none box-text-help">
              <p v-html='t("how_it_works_content", { "currency": CURRENCY })'>

              </p>
            </q-card-section>

            <q-card-actions class="box-text-help" align="right">
              <q-btn flat label="OK" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>

    <LastRound />

    <q-dialog v-model="prompt" persistent class="buy-ticket-dialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ t("buy_ticket") }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input type="number" class="input-amount" dense v-model="amount" />
        </q-card-section>

        <q-card-section class="dia-log-option">
          <button class="button-option-by t-radius" @click="amount = 2">
            2
            <q-icon name="confirmation_number" />
          </button>

          <button class="button-option-by t-radius" @click="amount = 5">
            5
            <q-icon name="confirmation_number" />
          </button>

          <button class="button-option-by t-radius" @click="amount = 10">
            10
            <q-icon name="confirmation_number" />
          </button>

          <button class="button-option-by t-radius" @click="amount = 15">
            15
            <q-icon name="confirmation_number" />
          </button>
        </q-card-section>

        <q-card-actions class="box-by-tickets" align="right">
          <button @click="onBetClicked" class="button-by-ticket btn-effect">{{ t("buy_ticket") }}</button>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <Modal :is-open="showModal" @close="showModal = false">
      <div class="payment-box">
        <button class="btn-disconnect btn-effect" @click.prevent="disconnectWallet">Disconnect</button>

        <h6>{{ t('wallet_address') }}</h6>
        <p class="wallet-addr">{{ connectedWallet }}</p>
        <div class="payment-message">
          <img src="/favicon.ico" alt="Fate Pool" />
          <div>
            <p class="text-bold">Fate Pool</p>
            <p class="msg-64ggf">Pay {{ payAmount }} {{ CURRENCY }} for one ticket</p>
          </div>
        </div>
        <div class="div-4rfaa1">
          <div>{{ t('pay') }}</div>
          <div class="div-11da3">
            <p>{{ payAmount }} {{ CURRENCY }}</p>
            <p class="balance-text">{{ t('balance') }}: {{ payAmount }} {{ CURRENCY }}</p>
          </div>
        </div>
        <q-btn class="btn-pay" v-if="resultPay === null" :loading="isLoadingPay" @click="handlePay" color="primary"
          label="Pay" />
        <div v-else class="result-pay">
          <p v-if="resultPay" class="pay-success">
            <q-icon name="check_circle" color="green" />
            {{ t('pi_payment_success_msg') }}
          </p>
          <p v-else class="pay-failure">
            <q-icon name="cancel" color="red" />
            {{ t('pay_invalid') }}
          </p>
        </div>
      </div>
    </Modal>

    <q-dialog v-model="showVictory" persistent class="victory-dialog">
      <q-card style="min-width: 350px">
        <q-card-section class="q-pt-none">
          <img src="/images/victory.png" alt="Victory" class="victory-image" />
        </q-card-section>

        <q-card-actions class="box-by-tickets" align="center">
          <q-btn color="primary" @click="handleCloseVictory" class="button-close" rounded>Close</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <FlowerRain ref="refFlowerRain" />
  </div>
</template>

<style scoped lang="sass">
@import "@/quasar-variables.sass"

.button-close
  padding: 0px 40px
  background: #1B9FD5 !important

.victory-image
  width: 100%
  height: auto
  margin: auto

.button-group-jump.disabled
  opacity: 0.5

.payment-box
  color: $buttonTextPrimary
  text-align: center
  padding-bottom: 50px
  font-family: -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, Tahoma, Verdana, sans-serif
  position: relative

  .btn-disconnect
    outline: none
    border: none
    background: none
    position: absolute
    top: 0
    left: 0
    transform: translateY(-100%)
    color: #7A8999
    background: #F1F3F5
    border-radius: 8px
    padding: 4px 10px

  h6
    font-weight: 500

  .wallet-addr
    font-size: 16px
    color: #6A7785
    word-break: break-all
    max-width: 350px
    margin: auto
    margin-bottom: 30px

  .payment-message
    display: flex
    justify-content: flex-start
    align-items: flex-start
    gap: 10px
    margin-bottom: 15px
    text-align: left

    img
      border-radius: 8px

    .msg-64ggf
      color: #6A7785

    p
      margin: 0

  .result-pay
    height: 47px
    display: flex
    justify-content: center
    align-items: center

    .pay-success
      color: green

    .pay-failure
      color: red

    p
      margin: 0

  .div-4rfaa1
    display: flex
    justify-content: space-between
    align-items: center
    background: rgb(248 131 175 / 30%)
    border-radius: 8px
    padding: 5px 15px
    margin-bottom: 15px

    p
      margin: 0

    .div-11da3
      text-align: right

      .balance-text
        font-size: 12px
        opacity: 0.8
  //color: $textSecondary

  .btn-pay
    width: 100%
    background: #1B9FD5
    color: #FFFFFF
    padding: 10px
    font-size: 16px
    transition: 0.3s
    border: none
    border-radius: 25px

    &:active
      scale: 0.95

.box-jump-button
  margin-bottom: 20px

.button-authen
  background: #1B9FD5
  color: $textPrimary
  outline: none
  font-size: 16px
  font-weight: bold
  border: 1px #1B9FD5 solid
  border-radius: 25px
  padding: 0px 50px
  margin: 6px 0px

  &:active
    scale: 0.98

.button-group-jump
  background: $buttonDangerBG
  margin: 6px 0px
  border-radius: 25px
  color: $buttonTextPrimary

  .jump-one-button
    background-color: #F883AF

  .jump-more-button
    background-color: #ED4B86

  .q-btn-item
    padding: 8px 16px

  .q-btn-item:before
    border: none

.common-info
  display: flex
  justify-content: space-between

.home-tab
  margin-bottom: 70px

.jump-button
  background: $buttonDangerBG
  color: $textPrimary
  outline: none
  font-size: 16px
  font-weight: bold
  border: 1px $buttonDangerBG solid
  border-radius: 6px
  margin: 15px 0px
  padding: 0px 10px

  .jump-button-content
    display: flex
    justify-content: space-between

    div
      padding: 10px 15px

    .jump-button-icon
      border-left: 1px dashed $buttonTextSecondary
      position: relative

    .jump-button-icon::after, .jump-button-icon::before
      content: ""
      display: block
      width: 10px
      height: 10px
      position: absolute
      border-radius: 50%
      background: $backgroundPrimary

    .q-icon
      font-size: 18px
      margin-left: 5px

.btn-help
  text-transform: none

button
  text-transform: none
</style>

<style lang="sass">
@import "@/quasar-variables.sass"

.buy-ticket-dialog
  .q-card
    background: $backgroundSecondary
    border-radius: 16px
    color: $textPrimary

    input
      color: $textPrimary
      font-size: 18px
      text-align: center

    .q-field--standard .q-field__control:hover:before, .q-field--standard .q-field__control:before
      border-color: $textPrimary

  .input-amount
    width: 50px
    margin: auto
    text-align: center

  .button-option-by
    background: #FFAA551A
    color: $textUp
    padding: 5px 0px
    outline: none
    border: none
    width: 100%
    text-align: center
    font-size: 15px
    transition: 0.3s

    &:active
      scale: 0.95

  .dia-log-option
    display: flex
    justify-content: space-around
    padding: 15px
    flex-wrap: nowrap
    gap: 10px

  .box-by-tickets
    padding: 15px

  .q-icon
    line-height: 2

.button-by-ticket
  width: 100%
  background: #1B9FD5
  color: #FFFFFF
  padding: 10px
  font-size: 16px
  transition: 0.3s
  border: none
  border-radius: 25px

  &:active
    scale: 0.98

.box-text-help
  color: $buttonTextPrimary

.dialog-help
  .q-card
    background: $textPrimary

.victory-dialog
  .q-card
    background: none
</style>