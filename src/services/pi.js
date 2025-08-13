import {BASE_API_URL} from "@/const.js";
import {useAuthStore} from "@/stores/store.js";

export default {
    async get_user_info(nonce) {

        const scopes = ['username', 'payments', 'wallet_address'];
        console.log("start SingIn");
        const authResult = await window.Pi.authenticate(scopes, this.onIncompletePaymentFound);
        console.log("authResult: " + JSON.stringify(authResult));
        if (authResult === undefined || authResult === null) {
            console.log("authResult is null")
            return null;
        }

        let params = {
            ...authResult,
            nonce,
        }

        const result = await fetch(`${BASE_API_URL}/pi/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        }).then(async (data) => {
            return await data.json();
        }).catch((error) => {
            console.log("error: " + JSON.stringify(error))
            return null;
        });

        console.log("sign in result: " + JSON.stringify(result));
        if (result === undefined || result === null) {
            return null;
        }

        const authStore = useAuthStore();
        let rc = result.rc;
        if (rc === 0) {
            let user = authResult.user;
            if (user !== undefined && user !== null) {
                let u = {
                    wallet: user.uid,
                    username: user.username,
                    profile_picture_url: ""
                };
                authStore.user = u;
                return u;
            }
        }
        return null;
    },

    async onIncompletePaymentFound(payment) {
        console.log("1onIncompletePaymentFound: " + JSON.stringify(payment));
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
        console.log("1onIncompletePaymentFound: ", resp);
    }
}