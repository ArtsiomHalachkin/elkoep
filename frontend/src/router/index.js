import { createRouter, createWebHistory } from "vue-router";
import RoomsView from "../views/RoomsView.vue";
import DevicesView from "../views/DevicesView.vue";
import AccountsView from "../views/AccountsView.vue";
import TempPlansView from "../views/TempPlansView.vue";

const routes = [
    { path: "/", redirect: "/rooms" },
    { path: "/rooms", component: RoomsView },
    { path: "/devices", component: DevicesView },
    { path: "/accounts", component: AccountsView },
    { path: "/temp-plans", component: TempPlansView },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
