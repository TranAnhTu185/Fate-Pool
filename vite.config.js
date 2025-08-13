import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {quasar, transformAssetUrls} from '@quasar/vite-plugin'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        vue({
            template: {transformAssetUrls}
        }),
        quasar({
            sassVariables: fileURLToPath(
                new URL('./src/quasar-variables.sass', import.meta.url)
            )
        }),
        nodePolyfills()
    ],
    server: {
        host: '0.0.0.0', // Cho phép truy cập từ mọi địa chỉ IP
        port: 5173, // Cổng mặc định của Vite, bạn có thể thay đổi nếu cần
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})
