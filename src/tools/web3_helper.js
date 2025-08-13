import {useAuthStore} from "../stores/store.js";
import m_utils from "./m_utils.js";
import {
    BASE_API_URL,
    BUILD_BUNDLE,
    BUILD_ENV_PI_NET_WORK,
    BUILD_ENV_TELEGRAM,
    BUILD_ENV_WORLD_COIN,
    PRODUCTION_MODE
} from "../const.js";
import {v4 as uuidv4} from "uuid";
import {MiniKit} from "@worldcoin/minikit-js";
import VsToast from "@vuesimple/vs-toast";
import {wldCoinConfig} from "@/config/world_coin_config.js";
import {piNetworkConfig} from "@/config/pi_network_config.js";
import pi from "@/services/pi.js";
import app from "@/tools/app.js";
import telegram from "@/services/telegram.js";
import {TonConnectUI} from '@tonconnect/ui'
import i18n from '@/i18n';

export default {

    async init_app() {
        if (!PRODUCTION_MODE) {
            return {
                "init": true,
                "env": "development"
            }
        }
        if (BUILD_BUNDLE === BUILD_ENV_WORLD_COIN) {
            MiniKit.install(wldCoinConfig.APP_ID);
            console.log("MiniKit.isInstalled() = " + MiniKit.isInstalled());
            return {
                "init": MiniKit.isInstalled(),
                "env": "world_coin"
            }
        }
        if (BUILD_BUNDLE === BUILD_ENV_PI_NET_WORK) {
            let sandbox = piNetworkConfig.SAND_BOX;
            if (sandbox) {
                Pi.init({version: "2.0", sandbox: true});
            } else {
                Pi.init({version: "2.0"});
            }
            return {
                "init": true,
                "env": "pi_network"
            }
        }
        if (BUILD_BUNDLE === BUILD_ENV_TELEGRAM) {
            if (window.Telegram && window.Telegram.WebApp) {
                console.log("Starting Telegram WebApp");
                const tg = window.Telegram.WebApp;
                tg.ready();
                tg.expand();
                // i18n.global.t('pi_payment_success_msg'),
                tg.onEvent("backButtonClicked", () => {
                    if (confirm(i18n.global.t('telegram_close_app'))) {
                        tg.close();
                    }
                });
                tg.MainButton.hide();
                tg.BackButton.show();

                window.tonConnectUI = new TonConnectUI({
                    manifestUrl: 'https://fate-pool-tg.bytebuffer.co/tonconnect-manifest.json',
                    buttonRootId: 'ton-connect',
                    uiPreferences: {
                        borderRadius: 's',
                        theme: 'SYSTEM'
                    },
                    network: "testnet"
                });
                window.tonConnectUI.onStatusChange((walletInfo) => {
                    if (walletInfo) {
                        console.log("User connected:", JSON.stringify(walletInfo));
                        const authStore = useAuthStore();
                        authStore.setWalletInfo(walletInfo);
                    }
                });
                return {
                    "init": true,
                    "env": "telegram"
                }
            } else {
                console.log("Can not found Telegram WebApp");
                return {
                    "init": false,
                    "env": "telegram"
                }
            }
        }
        return {
            "init": false,
            "env": "unknown"
        };
    },

    async get_user_info() {

        if (!PRODUCTION_MODE) {
            return {
                wallet: "0xE4644a29c8F7763913607895F5DdF4bf05e24d54".toLowerCase(),
                username: "godfather.1999",
                profile_picture_url: "https://www.google.com"
            }
        }

        const authStore = useAuthStore();
        let auth_user = authStore.user;
        if (auth_user && m_utils.checkString(auth_user.wallet)) {
            return auth_user;
        }

        let nonce = "";
        const need_nonce = BUILD_BUNDLE !== BUILD_ENV_TELEGRAM;

        if (need_nonce) {
            let resp = await fetch(`${BASE_API_URL}/get-nonce?network=${app.get_current_network()}`, {
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
            console.log("get nonce resp: ", JSON.stringify(resp))
            nonce = m_utils.get_str(resp, "data", "");
            console.log("nonce: ", nonce);
            if (nonce === undefined || nonce == null || nonce.length === 0) {
                console.log("nonce is empty")
                return null;
            }
        }

        if (BUILD_BUNDLE === BUILD_ENV_PI_NET_WORK) {
            return await pi.get_user_info(nonce);
        }

        if (BUILD_BUNDLE === BUILD_ENV_TELEGRAM) {
            return await telegram.get_user_info(nonce);
        }

        const uuid = uuidv4();
        const {finalPayload, commandPayload} = await MiniKit.commandsAsync.walletAuth({
            nonce: nonce,
            requestId: uuid,
            expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            statement: 'Authentication for link https://bigxsmall.bytebuffer.co',
        })

        if (finalPayload.status === 'error') {
            let desc = finalPayload.description || 'Authentication failed';
            VsToast.error(desc);
            return;
        }

        // const walletAddress = MiniKit.walletAddress;
        const walletAddress = finalPayload.address;
        const user = await MiniKit.getUserByAddress(walletAddress)
        console.log('user: ' + JSON.stringify(user))
        if (user === null || user === undefined) {
            console.log("user is null")
            return
        }

        const username = user.username
        const profilePictureUrl = user.profilePictureUrl

        const params = {
            payload: finalPayload,
            nonce,
            username,
            profile_picture_url: profilePictureUrl,
            wallet_address: walletAddress,
        };

        console.log("params: ", JSON.stringify(params))

        const response = await fetch(`${BASE_API_URL}/verify-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        })

        if (!response.ok) {
            console.log("response is not ok: " + response.status + " - " + response.statusText)
            return
        }

        let dt = await response.json();
        console.log("response: ", JSON.stringify(dt))

        if (dt === undefined || dt == null) {
            console.log("dt is null")
            return
        }

        let rc = dt.rc;
        if (rc === 0) {
            authStore.updateStatus(true);
            let user = {
                wallet: walletAddress,
                username: username,
                profile_picture_url: profilePictureUrl,
            }
            authStore.user = user;
            return user;
        }
        return null;
    }

}