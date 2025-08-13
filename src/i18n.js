import {createI18n} from 'vue-i18n';
import en from './locales/en.json';
import vi from './locales/vi.json';
import ru from './locales/ru.json';

const userLang = navigator.language || "en";
console.log("userLang", userLang);
const locale = userLang.startsWith("vi") ? "vi" : (userLang.startsWith("ru") ? "ru" : "en");

const i18n = createI18n({
    legacy: false,
    locale: locale,
    fallbackLocale: 'en',
    messages: {en, vi, ru},
});

export default i18n;
