import { createApp } from "vue";
import PrimeVue from "primevue/config";
import { definePreset } from "@primevue/themes";
import Aura from "@primevue/themes/aura";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "chart.js/auto";
import "./assets/main.css";
import App from "./App.vue";
import router from "./router/index.js";

const DashPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
      950: "#1e1b4b",
    },
  },
});

const sharedDialogPt = {
  header: { style: "background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 1rem 1.5rem;" },
  title:  { style: "color: #ffffff; font-weight: 700; font-size: 1rem; letter-spacing: -0.01em;" },
  closeButton: { style: "color: rgba(255,255,255,0.8);" },
};

createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: { preset: DashPreset },
    pt: {
      dialog: sharedDialogPt,
      drawer: sharedDialogPt,
    },
  })
  .mount("#app");
