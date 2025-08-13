import {BUILD_BUNDLE, BUILD_ENV_PI_NET_WORK, BUILD_ENV_TELEGRAM, BUILD_ENV_WORLD_COIN} from "@/const.js";

export default {
    get_current_network() {
        if (BUILD_BUNDLE === BUILD_ENV_WORLD_COIN) {
            return "world_coin";
        } else if (BUILD_BUNDLE === BUILD_ENV_PI_NET_WORK) {
            return "pi_network";
        } else if (BUILD_BUNDLE === BUILD_ENV_TELEGRAM) {
            return "telegram";
        } else {
            return "unknown";
        }
    }
}