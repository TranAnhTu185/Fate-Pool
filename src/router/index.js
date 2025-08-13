import { createRouter, createWebHistory } from 'vue-router'
import Home from "@/pages/Home.vue";
import Profile from "@/pages/Profile.vue";

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/profile',
        name: 'profile',
        component: Profile
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router