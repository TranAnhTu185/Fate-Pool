import axios from 'axios'
import {BASE_API_URL} from '../const.js'
import {useAuthStore} from "@/stores/store.js";

export default {
    DEFAULT_TIME_OUT: 300000,
    BASE_URL: BASE_API_URL,

    async call(endpoint, options = {}) {
        return fetch(`${BASE_API_URL}${endpoint}`, options);
    },

    post(url, data, params = null, headers = [], tm = this.DEFAULT_TIME_OUT) {
        return this.request(url, 'POST', params, data, headers, tm);
    },

    get(url, params, headers, tm = this.DEFAULT_TIME_OUT) {
        return this.request(url, 'GET', params, null, headers, tm);
    },

    put(url, data, params = null, headers = [], tm = this.DEFAULT_TIME_OUT) {
        return this.request(url, 'PUT', params, data, headers, tm);
    },

    delete(url, data, params, headers, tm = this.DEFAULT_TIME_OUT) {
        return this.request(url, 'DELETE', params, data, headers, tm);
    },

    request(url, method, queryParams, bodyData, headers = null, timeout = this.DEFAULT_TIME_OUT) {
        const config = {
            method: method,
            url: url,
            baseURL: this.BASE_URL,
            timeout: timeout
        };
        if (queryParams) {
            config.params = queryParams;
        }
        if (bodyData) {
            config.data = bodyData;
        }
        let defaultHeaders = {
            authorization: this._getToken()
        }
        if (headers) {
            defaultHeaders = {...defaultHeaders, ...headers}
        }
        config.headers = defaultHeaders
        const response = axios(config);

        response
            .then((response) => {
                this._processResponse(response)
            })
            .catch((error) => {
                this._processError(error)
            })

        return response;
    },

    _processError(err) {
        console.log('Error: ',err)
        if (err.response.status === 401) {
            const authStore = useAuthStore();
            authStore.setToken(null);
            authStore.setUser({});
        }
    },
    _processResponse(response) {
        if (response?.status === 401) {
            const authStore = useAuthStore();
            authStore.setToken(null);
            authStore.setUser({});
        }
    },
    _getToken() {
        const authStore = useAuthStore();
        return authStore.token;
    }
}
