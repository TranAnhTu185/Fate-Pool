import {defineStore} from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        status: false,
        token: '',
        user: {},
        walletInfo: null,
    }),
    actions: {
        updateStatus(value) {
            this.status = value;
        },
        setUser(value) {
            this.user = value;
        },
        setToken(value) {
            this.token = value;
        },
        setWalletInfo(value) {
            this.walletInfo = value;
        }
    },
    getters: {
        getStatus() {
            return this.status;
        },
        getUser() {
            return this.user;
        }
    },
});

export const useCommonStore = defineStore('common', {
    state: () => ({
        loading: false,
    }),
    actions: {
        setLoading(value) {
            this.loading = value;
        }
    },
    getters: {
        getLoading() {
            return this.loading;
        }
    },
});