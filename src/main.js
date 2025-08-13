import './assets/main.css'

import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import {Quasar} from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import WebSocketService from "./services/websocket.js";
import i18n from './i18n';
import router from './router'

const app = createApp(App)
import eruda from "eruda";

// Tạo instance WebSocket toàn cục
const ws = new WebSocketService();
ws.connect(); // Kết nối WebSocket

app.use(createPinia())
app.use(router)
app.use(Quasar, {
    plugins: {},
})
app.provide('websocket', ws);
// eruda.init();
app.use(i18n)
app.mount('#app')
