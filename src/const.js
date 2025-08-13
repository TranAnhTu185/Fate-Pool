import {config} from "../config/index.js";

export const BUILD_ENV_WORLD_COIN = 1
export const BUILD_ENV_PI_NET_WORK = 2
export const BUILD_ENV_TELEGRAM = 3
export const BUILD_BUNDLE = BUILD_ENV_WORLD_COIN

// export const BASE_API_URL = "http://127.0.0.1:8887"
export const BASE_API_URL = config.apiUrl;
export const CURRENCY = "WLD"
export const PRODUCTION_MODE = true
export const D_WALLET = "0x8af0b6687bfadc2bb926bb1b145747755e925f86"
export const TESTNET = true