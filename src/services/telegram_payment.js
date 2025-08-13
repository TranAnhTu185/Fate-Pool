import {toUserFriendlyAddress} from "@tonconnect/ui";
import {telegramConfig} from "@/config/telegram.js";
import {beginCell, Cell, toNano} from '@ton/core'
import {TESTNET} from "@/const.js";
import VsToast from "@vuesimple/vs-toast";
import i18n from '@/i18n';

export default {

    async executePay(amount, username) {
        let currentBalance = 0;
        try {
            const currentAccount = tonConnectUI.account;
            const address = currentAccount.address;
            console.log("Wallet address:", address);
            console.log("Wallet address friendly:", toUserFriendlyAddress(address, TESTNET));
            let url = `${telegramConfig.apiUrl}/api/v2/getAddressBalance?address=${address}`;
            const response = await fetch(url);
            const data = await response.json();
            console.log("wallet resp: " + JSON.stringify(data));
            if (data.ok) {
                currentBalance = parseFloat(data.result) / 10 ** 9;
            }
            let total = 0.05;
            console.log(`-->Current balance: ${currentBalance} TON, amount: ${amount}`);
            if (currentBalance > total) {
                const payload = beginCell()
                    .storeUint(0, 32)
                    .storeStringTail(username)
                    .endCell();
                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 180,
                    messages: [
                        {
                            address: "EQASKnMp6ycSqy8s5-zjP7dHHBRl3LfC6TOtiKXLZLRaXYiq", // W4
                            amount: toNano(amount).toString(),
                            payload: payload.toBoc().toString("base64")
                        }
                    ]
                }
                const result = await tonConnectUI.sendTransaction(transaction);
                console.log("result: " + JSON.stringify(result));
                const bocBase64 = result.boc;
                const cell = Cell.fromBase64(bocBase64);
                const hash = cell.hash().toString("hex");
                let tx = `${telegramConfig.scanUrl}/${hash}`;
                console.log("tx: " + tx);
                return {
                    ...result,
                    hash: hash,
                    result: true,
                    currentBalance: currentBalance
                };
            } else {
                VsToast.error(i18n.global.t('error_balance_insufficient'));
                return {
                    result: false,
                    currentBalance: currentBalance,
                }
            }
        } catch (error) {
            console.error("Error when pay:", error);
            VsToast.error(i18n.global.t('error_when_pay'));
            return {
                result: false,
                currentBalance: currentBalance,
            }
        }
    },

    async pay(network, user_id, amount, data) {
        console.log(`${user_id} pay ${amount} - data: ${JSON.stringify(data)}, on network: ${network}`);
        if (window.tonConnectUI) {
            const tonConnectUI = window.tonConnectUI;
            tonConnectUI.uiOptions = {
                twaReturnUrl: 'https://t.me/fatepool_bot/fate_pool'
            };
            const currentWallet = tonConnectUI.wallet;
            const currentWalletInfo = tonConnectUI.walletInfo;
            const currentAccount = tonConnectUI.account;
            const currentIsConnectedStatus = tonConnectUI.connected;
            console.log("currentIsConnectedStatus: ", currentIsConnectedStatus);
            if (!currentIsConnectedStatus) {
                const connectedWallet = await window.tonConnectUI.openModal();
                console.log("connectedWallet", connectedWallet);
                return {
                    connectingWallet: true
                }
            } else {
                console.log("currentWallet: " + JSON.stringify(currentWallet));
                console.log("currentWalletInfo: " + JSON.stringify(currentWalletInfo));
                console.log("currentAccount: " + JSON.stringify(currentAccount));

                const address = currentAccount.address;
                return {
                    showConfirm: true,
                    wallet: toUserFriendlyAddress(address, TESTNET),
                    amount: amount,
                }
            }
        } else {
            console.log("TON Connect UI not found");
            return {
                rc: 10001,
                rd: "Payment TON not success",
                amount: amount,
                network: network,
                tx: "0x" + Math.random().toString(36).substring(7),
                reference: Math.random().toString(36).substring(7)
            }
        }

    }
}