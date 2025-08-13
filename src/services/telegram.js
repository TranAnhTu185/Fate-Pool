import api from "@/tools/api.js";
import {useAuthStore} from "@/stores/store.js";
import m_utils from "@/tools/m_utils.js";
import theme from "@/tools/theme.js";

export default {
    async get_user_info() {
        if (window.Telegram.WebApp) {
            // const init = window.Telegram.WebApp.initData;
            const init = "user=%7B%22id%22%3A1947091390%2C%22first_name%22%3A%22Fate%22%2C%22last_name%22%3A%22Pool%22%2C%22username%22%3A%22smartcontractvn%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F_2R0k0Fy9AKyUc68kMwTvDl2KYDtvnc8Q7USmDuqhRM.svg%22%7D&chat_instance=72110939729512580&chat_type=sender&auth_date=1744812353&signature=Uc9EGJ6QLUxPHJsbK6FsHjFVOZn31FV7gGRw6t5ENHJzysNgdwKaUnUPbjYMrkspJP8x3v2Be8ztS0dpR_LLCQ&hash=e038ff680613c3960a1badc766657d9519b2c47554220381a0e1c022f4b5ca64";

            const authStore = useAuthStore();
            let auth_user = authStore.user;
            let token = authStore.token;

            if (auth_user && token && m_utils.checkString(token)) {
                return {
                    ...auth_user,
                    wallet: auth_user.user_id,
                    username: auth_user.username,
                    profile_picture_url: auth_user.avatar,
                    token: token,
                };
            }

            console.log("initData", init);
            if (init.length === 0) {
                console.log("initData is empty")
                return null;
            }

            const params = {
                network: "telegram",
            };
            let url = `/tl/auth`;
            const res = await api.post(url, {"init_data": init}, params);
            console.log("res", res);

            if (res.data.rc === 0) {
                authStore.setToken(res.data.token);
                let auth_user = res.data.user_info;
                authStore.setUser(auth_user);
                return {
                    ...auth_user,
                    wallet: auth_user.user_id,
                    username: auth_user.username,
                    profile_picture_url: auth_user.avatar,
                    token: res.data.token,
                };
            }

            return null;
        } else {
            console.log("window.Telegram.WebApp is null")
        }
        return null;
    },
    setThemeByTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            theme.changeTheme(window.Telegram.WebApp.colorScheme);

            window.Telegram.WebApp.onEvent('themeChanged', () => {
                theme.changeTheme(window.Telegram.WebApp.colorScheme);
            });
        }
    }
}