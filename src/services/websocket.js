import {config} from "../../config/index.js";
import app from "@/tools/app.js";

export default class WebSocketService {
    constructor() {
        this.url = config.websocketUrl + "?network=" + app.get_current_network();
        this.socket = null;
        this.autoReconnect = true;
        this.listeners = {};
        this.timeoutReconnect = 500;
    }

    connect() {
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.timeoutReconnect = 500;
            this.emit('connected');
        };

        this.socket.onmessage = (event) => {
            this.emit('message', event);
        };

        this.socket.onclose = (r) => {
            console.log('WebSocket disconnected', r);
            this.timeoutReconnect = this.timeoutReconnect + 500;
            if (this.timeoutReconnect >= 15000) {
                this.timeoutReconnect = 15000;
            }
            if (this.autoReconnect) {
                console.log('Reconnecting...');
                let tm = setTimeout(() => {
                    this.connect();
                    clearTimeout(tm);
                }, this.timeoutReconnect);
            }
            this.emit('disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        };
    }

    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    register(from, event, callback) {
        console.log("register from: " + from + ', listener: ' + event);
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(listener => listener !== callback);
        }
    }

    emit(event, ...args) {
        if (this.listeners[event]) {
            this.listeners[event].forEach((callback) => callback(...args));
        }
    }

    newToken(token) {
        console.log("newToken: " + token);
        if (token !== undefined && token !== null) {
            const wsUrl = new URL(this.url);
            let found = false;
            if (!wsUrl.searchParams.has("token")) {
                wsUrl.searchParams.append("token", token);
                found = true;
            }
            if (!wsUrl.searchParams.has("network")) {
                wsUrl.searchParams.append("network", app.get_current_network());
                found = true;
            }
            if (found) {
                this.url = wsUrl.toString();
                this.disconnect();
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}