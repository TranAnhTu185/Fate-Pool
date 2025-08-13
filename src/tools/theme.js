import {THEME_DARK, THEME_LIGHT} from "../../config/themes.js";

export default {
    changeTheme(type) {
        type = type.toUpperCase();
        console.log('Changing theme to: ', type);
        if (type === 'LIGHT') {
            console.log('Changing theme to light');
            THEME_LIGHT.forEach((item) => {
                document.documentElement.style.setProperty(item.cssVar, item.color);
            })
        } else {
            console.log('Changing theme to dark');
            THEME_DARK.forEach((item) => {
                document.documentElement.style.setProperty(item.cssVar, item.color);
            })
        }
    }
}