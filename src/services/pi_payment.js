import {BASE_API_URL} from "@/const.js";
import i18n from '@/i18n';

export default {

    async pay(network, user_id, amount, data) {
        console.log(`${user_id} pay ${amount} - data: ${JSON.stringify(data)}, on network: ${network}`);
        const result = await this.orderProduct(data.msg, amount, data);
        console.log("----> payResult: " + JSON.stringify(result));
        return {
            rc: result.success ? 0 : 1,
            rd: result.msg,
            amount: result.data?.data?.amount,
            network: network,
            tx: result.data?.data?.transaction?.txid,
            reference: result.data?.data?.identifier,
            extra: result.data
        }
    },

    orderProduct(memo, amount, paymentMetadata) {
        const vm = this;

        return new Promise((resolve, reject) => {
            const paymentData = {amount, memo, metadata: paymentMetadata};
            const callbacks = {
                onIncompletePaymentFoundFound: this.onIncompletePaymentFound,
                onReadyForServerApproval: (paymentId) => {
                    vm.onReadyForServerApproval(paymentId, resolve);
                },
                onReadyForServerCompletion: (paymentId, txid) => {
                    vm.onReadyForServerCompletion(paymentId, txid, resolve);
                },
                onCancel: (paymentId) => {
                    vm.onCancel(paymentId, resolve);
                },
                onError: (error, payment) => {
                    vm.onError(error, payment, resolve);
                },
            };
            window.Pi.createPayment(paymentData, callbacks);
        });
    },

    async onIncompletePaymentFound(payment) {
        console.log("onIncompletePaymentFound: " + JSON.stringify(payment));
        let resp = await fetch(`${BASE_API_URL}/pi/incomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payment),
        }).then(async (data) => {
            return await data.json();
        }).catch((error) => {
            console.log("error: " + JSON.stringify(error))
            return null;
        })
        console.log("onIncompletePaymentFound: ", resp);
    },

    onReadyForServerApproval(paymentId, resolve) {
        console.log("onReadyForServerApproval: ", paymentId);
        fetch(`${BASE_API_URL}/pi/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({paymentId}),
        }).then(async (data) => {
            return await data.json();
        }).catch((error) => {
            console.log("error: " + JSON.stringify(error))
            resolve({
                'success': false,
                'msg': i18n.global.t('pi_payment_error_msg'),
                'data': null
            })
        })
    },

    onReadyForServerCompletion(paymentId, txid, resolve) {
        console.log("onReadyForServerCompletion", paymentId, txid);
        fetch(`${BASE_API_URL}/pi/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({paymentId, txid}),
        }).then(async (data) => {
            resolve({
                'success': true,
                'msg': i18n.global.t('pi_payment_success_msg'),
                'data': await data.json()
            });
        }).catch((error) => {
            console.log("error: " + JSON.stringify(error))
            resolve({
                'success': false,
                'msg': i18n.global.t('pi_payment_error_msg'),
                'data': null
            });
        })
    },

    onCancel(paymentId, resolve) {
        console.log("onCancel", paymentId);
        fetch(`${BASE_API_URL}/pi/cancelled_payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({paymentId}),
        }).then(async (data) => {
            await data.json();
            resolve({
                'success': false,
                'msg': i18n.global.t('pi_payment_cancel_msg'),
                'data': null
            });
        }).catch((error) => {
            console.log("error: " + JSON.stringify(error))
            resolve({
                'success': false,
                'msg': i18n.global.t('pi_payment_error_msg'),
                'data': null
            });
        })
    },

    onError(error, payment, resolve) {
        console.log("onError", error);
        if (payment) {
            console.log(payment);
        }
        resolve({
            'success': false,
            'msg': i18n.global.t('pi_payment_error_msg'),
            'data': null
        })
    }
}