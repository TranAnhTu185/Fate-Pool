<script setup>

import {computed, inject, onMounted, onUnmounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import number_utils from "@/tools/number_utils.js";
import {CURRENCY, TESTNET} from "@/const.js";
import {toUserFriendlyAddress} from "@tonconnect/ui";
import VsToast from "@vuesimple/vs-toast";
import {useAuthStore} from "@/stores/store.js";
import api from "@/tools/api.js";
import {telegramConfig} from "@/config/telegram.js";
import telegram_payment from "@/services/telegram_payment.js";
import web3_helper from "@/tools/web3_helper.js";
import Alert from "@/components/Alert.vue";
import {useRouter} from "vue-router";
import m_utils from "@/tools/m_utils.js";

const router = useRouter()

const ws = inject('websocket');
const setTitle = inject('setTitle');
const {t} = useI18n();
const balance = ref(0);
const tonBalance = ref(0);
const showTopUpPopup = ref(false);
const showWithdrawPopup = ref(false);
const topUpAmount = ref(null);
const withdrawAmount = ref(null);
const withdrawOTP = ref(null);
const withdrawWallet = ref(null);
const listWallet = ref([]);
const history = ref([]);
const walletAddress = ref(null);
const authStore = useAuthStore();

const walletInfo = computed(() => authStore.walletInfo);
const walletBalance = ref(0);
const reloadingMe = ref(false);
const errorDeposit = ref(null);
const errorWithdrawWallet = ref(null);
const errorWithdrawAmount = ref(null);
const errorWithdrawOTP = ref(null);
const isLoadingDeposit = ref(false);
const isLoadingWithdraw = ref(false);

const walletAddFormat = computed(() => {
  return formatWalletAddress(walletAddress.value);
});

watch(walletInfo, (newWalletInfo) => {
  console.log("newWalletInfo: ", newWalletInfo);
  if (newWalletInfo) {
    checkConnectedWallet();
  }
});

watch(showTopUpPopup, (newVal) => {
  if (!newVal) {
    topUpAmount.value = 0;
    isLoadingDeposit.value = false;
  }
});

watch(showWithdrawPopup, (newVal) => {
  if (!newVal) {
    withdrawAmount.value = 0;
    isLoadingWithdraw.value = false;
    withdrawWallet.value = null;
  }
});

onUnmounted(() => {
  ws.off('message', onWsMessage);
});

onMounted(async () => {
  setTitle(t('profile'));
  checkConnectedWallet();
  ws.on('message', onWsMessage);
});

const formatWalletAddress = (address) => {
  if (address) {
    return address.length > 20 ? address.slice(0, 10) + "..." + address.slice(-10) : address;
  }
  return "";
}

const getWalletBalance = async () => {
  if (walletInfo) {
    await getMe();
    walletBalance.value = await get_wallet_balance();
  } else {
    balance.value = 0;
    tonBalance.value = 0;
    listWallet.value = []
    history.value = []
  }
}

const onWsMessage = (data) => {
  const dt = JSON.parse(data.data);
  console.log("ws message: " + JSON.stringify(dt));
  const c = dt.c;
  if (c !== undefined && c !== null) {
    if ('bc' === c) {
      const bl = dt.p.balance;
      let coin_price = dt.p.coin_price;
      let coin_in_usd = bl * coin_price;
      balance.value = coin_in_usd;
      tonBalance.value = bl;
      history.value = [
        {id: 1, amount: bl, balance: coin_in_usd},
      ]
    }
  }
}

const setListWallet = (listAddress) => {
  if (listAddress) {
    listWallet.value = listAddress.map((address) => {
      return {
        label: formatWalletAddress(address),
        value: address,
      }
    });
  } else {
    listWallet.value = []
  }
}

const reloadMe = async () => {
  reloadingMe.value = true;
  await getMe();
  reloadingMe.value = false;
}

const getMe = async () => {
  try {
    const resp = await api.post("/api/me");
    if (resp.data) {
      let bl = resp.data.balance;
      let coin_price = resp.data.coin_price;
      let coin_in_usd = bl * coin_price;
      balance.value = coin_in_usd;
      tonBalance.value = bl;
      history.value = [
        {id: 1, amount: bl, balance: coin_in_usd},
      ]
    }
  } catch (e) {
    if (e.status && e.status === 401) {
      VsToast.error(t('unauthorized_please_re_authentication'));
      router.push({name: 'home'});
    }
  }
}


const checkConnectedWallet = () => {
  if (window.tonConnectUI) {
    const tonConnectUI = window.tonConnectUI;
    const currentIsConnectedStatus = tonConnectUI.connected;
    if (currentIsConnectedStatus) {
      const currentAccount = tonConnectUI.account;
      let address = currentAccount.address;
      address = toUserFriendlyAddress(address, TESTNET);
      console.log("checkConnectedWallet: " + address);
      walletAddress.value = address;
      setListWallet([address]);
      // listWallet.value = [
      //   address
      // ]
      console.log("listWallet: ", listWallet.value);
      getWalletBalance();
    } else {
      walletAddress.value = null;
      listWallet.value = []
    }
  } else {
    console.log("Wallet not connected");
  }
}

const connectWallet = async () => {
  if (window.tonConnectUI) {
    const currentIsConnectedStatus = window.tonConnectUI.connected;
    if (currentIsConnectedStatus) {
      return
    }
    await window.tonConnectUI.openModal()
  } else {
    VsToast.error("Please install TonConnect extension");
  }
}

const clickTopUp = async () => {
  try {
    const user = await web3_helper.get_user_info();
    if (user === undefined || user === null || !user.wallet) {
      errorDeposit.value = t('error_connect_wallet');
      return;
    }
    if (!topUpAmount.value) {
      errorDeposit.value = t('error_enter_amount');
      return;
    }
    const currentIsConnectedStatus = window.tonConnectUI.connected;
    if (!currentIsConnectedStatus) {
      errorDeposit.value = t('error_connect_ton_ext');
      topUpAmount.value = 0;
      return;
    }
    if (topUpAmount.value <= 0) {
      errorDeposit.value = t('error_enter_amount_gt_1');
      topUpAmount.value = 0;
      return;
    }

    isLoadingDeposit.value = true;

    // get wallet balance
    const currentAccount = tonConnectUI.account;
    let address = currentAccount.address;
    let currentBalance = await get_wallet_balance();
    walletBalance.value = currentBalance;

    if (currentBalance < topUpAmount.value) {
      errorDeposit.value = t('error_balance_insufficient');
      topUpAmount.value = 0;
      isLoadingDeposit.value = false;
      return;
    }

    address = toUserFriendlyAddress(address, TESTNET);
    console.log("clickTopUp: " + address + " value: " + topUpAmount.value);
    showTopUpPopup.value = false;
    let result = await telegram_payment.executePay(topUpAmount.value, user.wallet + "");
    topUpAmount.value = 0;
    console.log("payment result: ", result);
    if (!result.result && result.currentBalance) {
      isLoadingDeposit.value = false;
      walletBalance.value = currentBalance;
    } else {
      walletBalance.value = await get_wallet_balance();
      isLoadingDeposit.value = false;
    }
  } catch (e) {
    console.log("clickTopUp: " + e);
    VsToast.error(t('error_when_pay'));
    isLoadingDeposit.value = false;
    topUpAmount.value = 0;
  }
}

const onBtnMaxClicked = () => {
  console.log("onBtnMaxClicked");
  topUpAmount.value = walletBalance.value;
}

const get_wallet_balance = async () => {
  const currentAccount = tonConnectUI.account;
  let address = currentAccount.address;
  let url = `${telegramConfig.apiUrl}/api/v2/getAddressBalance?address=${address}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.ok) {
    return parseFloat(data.result) / 10 ** 9;
  }
  return 0;
}

const clickWithdraw = async () => {
  try {
    if (!withdrawWallet.value || !withdrawWallet.value.value) {
      console.log("clickWithdraw: " + withdrawWallet.value + " is valid");
      errorWithdrawWallet.value = t('error_withdraw_select_wallet');
      return;
    }
    if (!withdrawAmount) {
      console.log("clickWithdraw: " + withdrawAmount.value + " is valid");
      errorWithdrawAmount.value = t('error_enter_amount');
      return;
    }
    if (withdrawAmount.value < 1) {
      console.log("clickWithdraw: " + withdrawAmount.value + " is valid");
      errorWithdrawAmount.value = t('error_enter_amount_gt_1') + ' ' + CURRENCY;
      return;
    }
    if (withdrawAmount.value > tonBalance.value) {
      console.log("clickWithdraw: " + withdrawAmount.value + " is valid");
      errorWithdrawAmount.value = t('error_balance_insufficient');
      return;
    }

    if (withdrawOTP.value === null || withdrawOTP.value === undefined || withdrawOTP.value === "") {
      console.log("clickWithdraw: " + withdrawOTP.value + " is valid");
      errorWithdrawOTP.value = t('error_enter_otp');
      return;
    }

    isLoadingWithdraw.value = true;
    const params = {
      address: withdrawWallet.value?.value,
      amount: parseFloat(withdrawAmount.value),
      otp: withdrawOTP.value
    }
    console.log("clickWithdraw: " + JSON.stringify(params));
    const resp = await api.post("/api/withdraw", params);
    isLoadingWithdraw.value = false;
    if (resp.data) {
      console.log("data: ", resp.data);
      if (resp.data.rc === 0) {
        withdrawAmount.value = 0;
        withdrawOTP.value = "";
        let bl = resp.data.last_balance;
        let coin_price = resp.data.coin_price;
        let coin_in_usd = bl * coin_price;
        balance.value = coin_in_usd;
        tonBalance.value = bl;
        history.value = [
          {id: 1, amount: bl, balance: coin_in_usd},
        ]

        VsToast.success(t('withdraw_in_processing'));
        showWithdrawPopup.value = false;
      } else {
        VsToast.error(resp.data.rd);
      }
      return;
    }
    // display message response
    let msg_info = m_utils.getMessageResponse2(resp);
    let msg = msg_info.notify;
    if (msg_info.success) {
      VsToast.success(msg);
    } else {
      VsToast.error(msg);
    }

  } catch (e) {
    console.log("clickWithdraw: " + e);
    VsToast.error(t('error_when_withdraw'));
    isLoadingWithdraw.value = false;
    withdrawAmount.value = 0;
    withdrawOTP.value = "";
    if (e.status && e.status === 401) {
      VsToast.error(t('unauthorized_please_re_authentication'));
      router.push({name: 'home'});
    }
  }
}

const onBtnGetOTPClicked = async () => {
  try {
    const resp = await api.post("/api/otp", {});
  } catch (e) {
  }
}

const clickDisconnect = () => {
  if (window.tonConnectUI) {
    window.tonConnectUI.disconnect();
    VsToast.success(t('disconnected_wallet'))
    authStore.setWalletInfo(null);
  }
}

const copyToClipboard = (string) => {
  const el = document.createElement('textarea');
  el.value = string;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

</script>

<template>
  <div class="text-center">
    <h4>{{ t('wallet') }}</h4>
    <p>{{ t('stay_connected_msg') }}</p>
  </div>

  <div v-if="!walletInfo" class="text-center">
    <div class="wallet-image-box">
      <img src="/images/wallet.png" alt="wallet" class="wallet-img"/>
    </div>
    <button class="button-connect btn-effect" @click="connectWallet()">{{ t('connect_wallet') }}</button>
  </div>
  <div v-else>
    <div class="balance-box" v-if="balance >= 0">
      <div class="assets-box">
        <p class="mb-0">{{ t('total_assets') }}</p>
        <p class="mb-0 text-hjg77g">$ {{ number_utils.formatNumberExFloatV2(balance) }}</p>
        <button class="button-copy btn-effect" @click="copyToClipboard(walletAddress)">
          <q-icon name="content_copy"/>
        </button>
      </div>

      <div class="action">
        <div class="action-group">
          <button class="button-action btn-effect" @click="showTopUpPopup = true">
            {{ t('deposit') }}
          </button>
        </div>

        <div class="action-group">
          <button class="button-action btn-effect" @click="showWithdrawPopup = true">
            {{ t('withdraw') }}
          </button>
        </div>
      </div>
    </div>

    <div class="history">
      <h5 class="history-title">{{ t('assets') }}</h5>
      <button @click="reloadMe()" class="reload-button btn-effect" :class="reloadingMe ? 'loading' : ''">
        <q-icon name="refresh"/>
      </button>
      <div class="history-list">
        <template v-if="history && history.length > 0">
          <div class="history-item" v-for="item in history" :key="item.id">
            <div class="history-info">
              <div class="history-type">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                  <path fill="#fff"
                        d="M19.011 9.201L12.66 19.316a.857.857 0 0 1-1.453-.005L4.98 9.197a1.8 1.8 0 0 1-.266-.943a1.856 1.856 0 0 1 1.881-1.826h10.817c1.033 0 1.873.815 1.873 1.822c0 .334-.094.664-.274.951M6.51 8.863l4.632 7.144V8.143H6.994c-.48 0-.694.317-.484.72m6.347 7.144l4.633-7.144c.214-.403-.005-.72-.485-.72h-4.148z"/>
                </svg>
              </div>
              <p class="mb-0 history-amount">{{ number_utils.formatNumberExFloatV2(item.amount) }} {{ CURRENCY }}</p>
            </div>
            <p class="mb-0 history-time">${{ number_utils.formatNumberExFloatV2(item.balance) }}</p>
          </div>
        </template>

        <template v-else>
          <div class="history-item">
            <p class="mb-0">{{ t('no_data') }}</p>
          </div>
        </template>
      </div>
    </div>

    <div class="wallet-info">
      <div class="div-fh7daga">
        <q-icon name="account_balance_wallet"/>
        <p class="mb-0 wallet-addr">{{ walletAddFormat }}</p>
      </div>
      <button class="button-disconnect btn-effect" @click="clickDisconnect">
        <q-icon name="link_off"/>
      </button>
    </div>

    <q-dialog v-model="showTopUpPopup" persistent class="popup-profile buy-ticket-dialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-center">
            {{ t('deposit') }}
          </div>
          <q-space/>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-card-section>
        <q-card-section>
          <q-input class="amount-input" @keydown="errorDeposit = null" v-model="topUpAmount" type="number"
                   :label="t('amount')"/>
          <Alert v-if="errorDeposit" :message="errorDeposit"/>
          <div class="balance-box-34fsa">
            <p class="mini-balance">{{ t('balance') }}: {{ number_utils.formatNumberExFloatV2(walletBalance) }}
              {{ CURRENCY }}</p>
            <button class="button-max btn-effect" @click="onBtnMaxClicked">Max</button>
          </div>
          <q-btn :loading="isLoadingDeposit" @click="clickTopUp" class="button-by-ticket button-afhjtt">{{
              t("deposit")
            }}
          </q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showWithdrawPopup" persistent class="popup-profile buy-ticket-dialog">
      <q-card style="min-width: 350px">

        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-center">{{ t('withdraw') }}</div>
          <q-space/>
          <q-btn icon="close" flat round dense v-close-popup/>
        </q-card-section>

        <q-card-section>

          <q-item-label>{{ `${t('total_amount')} ${tonBalance} ${CURRENCY}` }}</q-item-label>

          <q-select class="amount-input"
                    popup-content-class="option-wallet"
                    :popup-no-route-dismiss="false"
                    behavior="menu"
                    @focus="errorWithdrawWallet = null"
                    v-model="withdrawWallet"
                    :options="listWallet"
                    :label="t('wallet_address')"/>
          <Alert v-if="errorWithdrawWallet" :message="errorWithdrawWallet"/>

          <q-input class="amount-input" @keydown="errorWithdrawAmount = null" v-model="withdrawAmount" type="number"
                   :label="t('amount')"/>
          <Alert v-if="errorWithdrawAmount" :message="errorWithdrawAmount"/>

          <q-input type="number" class="amount-input input-otp" @keydown="errorWithdrawOTP = null" bottom-slots
                   v-model="withdrawOTP" :label="t('otp')" maxlength="12">
            <template v-slot:append>
              <q-btn class="button-get-otp q-pa-sm" @click="onBtnGetOTPClicked" color="white" flat
                     :label="t('get_otp')"/>
            </template>
          </q-input>
          <Alert v-if="errorWithdrawOTP" :message="errorWithdrawOTP"/>

          <q-btn :loading="isLoadingWithdraw" @click="clickWithdraw" class="button-by-ticket button-afhjtt">
            {{ t("withdraw") }}
          </q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="sass">
@import "@/quasar-variables.sass"

.button-get-otp
  text-transform: none
  padding: 0px 10px
  border-radius: 8px
  background: #ffffff30

.balance-box-34fsa
  display: flex
  justify-content: space-between

  .button-max
    margin: 0
    outline: none
    line-height: 16px
    padding: 2px 10px
    border-radius: 6px
    border: none
    background: #414859d6
    color: white

.mini-balance
  padding: 0
  margin: 0
  font-size: 12px
  opacity: 0.8

.wallet-image-box
  position: absolute
  top: 50%
  transform: translateY(-50%)

.wallet-img
  width: 40%
  margin-bottom: 15px

.button-connect
  background: linear-gradient(to right, #B866CC, #FB8B81)
  border: none
  outline: none
  border-radius: 16px
  width: calc(100% - 30px)
  padding: 10px
  position: fixed
  bottom: 15px
  left: 15px
  color: white

.assets-box
  text-align: left
  background: $backgroundSecondary
  padding: 10px 15px
  border-radius: 16px
  position: relative

  .text-hjg77g
    color: $textUp

  .button-copy
    background: none
    border: none
    outline: none
    color: $textPrimary
    cursor: pointer
    position: absolute
    right: 15px
    top: 50%
    padding: 0
    transform: translateY(-50%)

.history
  margin-top: 15px
  position: relative

  .history-title
    margin-bottom: 15px

  .reload-button
    background: none
    border: none
    outline: none
    color: $textPrimary
    position: absolute
    right: 15px
    font-size: 18px
    top: 4px

    &.loading
      animation: spin 0.3s linear infinite

@keyframes spin
  0%
    transform: rotate(0deg)
  100%
    transform: rotate(360deg)

.history-item
  display: flex
  background: $backgroundSecondary
  padding: 10px 15px
  margin-bottom: 15px
  border-radius: 8px
  align-items: center
  justify-content: space-between

  .history-info
    display: flex
    align-items: center
    gap: 10px

  .history-time
    text-align: right

  .history-amount
    color: $textUp

.amount-input
  margin-bottom: 10px

.button-by-ticket
  margin-bottom: 25px
  margin-top: 15px

.balance-box
  text-align: center

.action
  display: flex
  justify-content: center
  margin-top: 20px
  gap: 15px

  .action-group
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    width: 100%

  .button-action
    border: 1px solid transparent
    background: linear-gradient($backgroundPrimary, $backgroundPrimary) padding-box, linear-gradient(45deg, #ff6b6b, #4ecdc4) border-box
    background-clip: padding-box, border-box
    outline: none
    border-radius: 16px
    color: $textPrimary
    cursor: pointer
    padding: 10px 35px
    margin-bottom: 10px
    width: 100%

.wallet-info
  display: flex
  justify-content: space-between
  background: rgba(255, 255, 255, 0.05)
  padding: 10px 15px
  border-radius: 20px
  position: fixed
  bottom: 15px
  width: calc(100% - 30px)

  .wallet-addr
    overflow: auto
    white-space: nowrap

  .div-fh7daga
    display: flex
    align-items: center
    gap: 10px
    max-width: calc(100% - 60px)

  .button-disconnect
    background: none
    border: none
    outline: none
    color: $textPrimary
    font-size: 18px
</style>

<style lang="sass">
@import "@/quasar-variables.sass"

.button-by-ticket.button-afhjtt .q-btn__content
  text-transform: none

.popup-profile
  .amount-input
    .q-field__control
      &:before
        border-color: $textPrimary

    .q-field__label, .q-field__native, .q-select__dropdown-icon
      color: $textPrimary

    input
      text-align: left

.q-menu.option-wallet
  background: $backgroundPrimary
  color: $textPrimary
</style>

<style>
</style>