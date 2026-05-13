<template>
  <Dialog
    v-model:visible="visible"
    :header="room?.name ?? 'Room'"
    :modal="true"
    :style="{ width: '640px' }"
    @show="onShow"
  >
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="control">Control</Tab>
        <Tab value="graph">Graph</Tab>
      </TabList>

      <TabPanels>
        <!-- ── Control ── -->
        <TabPanel value="control">
          <div class="ctrl-layout">
            <div class="ctrl-temp-col">
              <div class="temp-card">
                <div class="temp-label">Set temperature</div>
                <div class="temp-value">{{ setTemp.toFixed(1) }}<span class="temp-unit">°C</span></div>
                <div class="temp-status">{{ heatingStatus }}</div>
              </div>
              <div class="actual-row">
                <Button icon="pi pi-minus" text rounded @click="adjustActualTemp(-1)" />
                <div class="actual-readout">
                  <div class="actual-label">Actual</div>
                  <div class="actual-value">{{ actualTemp.toFixed(1) }} °C</div>
                </div>
                <Button icon="pi pi-plus" text rounded @click="adjustActualTemp(1)" />
              </div>
            </div>

            <div class="ctrl-divider"></div>

            <div class="ctrl-right-col">
              <div class="section-label">Mode</div>
              <SelectButton
                v-model="activeMode"
                :options="modeOptions"
                optionLabel="label"
                optionValue="key"
                @change="onModeChange"
              />
              <div v-if="activeMode" class="mode-indicator">
                <span :class="`color-indicator ${activeMode}`"></span>
                <span class="mode-name">{{ activeMode }}</span>
              </div>

              <div class="section-label mt-3">Control</div>
              <div class="ctrl-buttons">
                <button
                  v-for="ctrl in controls"
                  :key="ctrl.key"
                  type="button"
                  class="ctrl-btn"
                  :class="{ 'ctrl-btn--active': activeControl === ctrl.key }"
                  @click="activeControl = ctrl.key"
                >
                  <img v-if="ctrl.icon" :src="ctrl.icon" class="ctrl-btn-icon" />
                  <span v-else class="ctrl-btn-emoji">{{ ctrl.emoji }}</span>
                  <span class="ctrl-btn-label">{{ ctrl.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ── Graph ── -->
        <TabPanel value="graph">
          <div class="graph-panel">
            <div class="graph-stats">
              <div class="stat-chip">
                <span class="stat-label">Min</span>
                <span class="stat-value">{{ chartMin }}°C</span>
              </div>
              <div class="stat-chip">
                <span class="stat-label">Avg</span>
                <span class="stat-value">{{ chartAvg }}°C</span>
              </div>
              <div class="stat-chip">
                <span class="stat-label">Max</span>
                <span class="stat-value">{{ chartMax }}°C</span>
              </div>
            </div>
            <div class="chart-wrapper">
              <Chart type="line" :data="chartData" :options="chartOptions" style="height:100%;width:100%;" />
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import Dialog       from "primevue/dialog";
import Tabs         from "primevue/tabs";
import TabList      from "primevue/tablist";
import Tab          from "primevue/tab";
import TabPanels    from "primevue/tabpanels";
import TabPanel     from "primevue/tabpanel";
import Button       from "primevue/button";
import SelectButton from "primevue/selectbutton";
import Chart        from "primevue/chart";

import onIcon      from "@/assets/img/device/on.svg";
import automatIcon from "@/assets/img/device/automat_on.svg";
import heatingIcon from "@/assets/img/device/heating.svg";

const props = defineProps({ room: Object, visible: Boolean });
const emit  = defineEmits(["update:visible"]);

const visible = computed({
  get: () => props.visible,
  set: (v) => emit("update:visible", v),
});

const activeTab     = ref("control");
const actualTemp    = ref(20.0);
const setTemp       = ref(28.0);
const activeMode    = ref("comfort");
const activeControl = ref("on");
const heatingStatus = ref("Heating");

const modeOptions = [
  { key: "minimum",     label: "15°C" },
  { key: "attenuation", label: "20°C" },
  { key: "normal",      label: "24°C" },
  { key: "comfort",     label: "28°C" },
];
const modeTemps = { minimum: 15, attenuation: 20, normal: 24, comfort: 28 };

const controls = [
  { key: "on",       label: "On/Off",       icon: onIcon },
  { key: "automat",  label: "Automat",      icon: automatIcon },
  { key: "holiday",  label: "Holiday",      emoji: "🏖️" },
  { key: "manual",   label: "Manual",       emoji: "✋" },
  { key: "temp-man", label: "Temp. manual", emoji: "⏱️" },
  { key: "heat",     label: "Heat",         icon: heatingIcon },
];

function onShow() { activeTab.value = "control"; }
function adjustActualTemp(d) { actualTemp.value = parseFloat((actualTemp.value + d).toFixed(1)); }
function onModeChange(e) { setTemp.value = modeTemps[e.value] ?? setTemp.value; }

function generateTemp(count, start, variance) {
  const d = [start];
  for (let i = 1; i < count; i++)
    d.push(parseFloat((d[i - 1] + (Math.random() - 0.5) * variance).toFixed(1)));
  return d;
}

const rawData  = computed(() => generateTemp(288, actualTemp.value, 2));
const chartMin = computed(() => Math.min(...rawData.value).toFixed(1));
const chartMax = computed(() => Math.max(...rawData.value).toFixed(1));
const chartAvg = computed(() => (rawData.value.reduce((a, b) => a + b, 0) / rawData.value.length).toFixed(1));

const chartData = computed(() => ({
  labels: Array.from({ length: 288 }, (_, i) => {
    const h = Math.floor(i * 5 / 60), m = (i * 5) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }),
  datasets: [{
    label: "Temperature",
    data: rawData.value,
    borderColor: "#6366f1",
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.4,
    fill: true,
    backgroundColor: "rgba(99,102,241,0.08)",
  }],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  scales: {
    x: {
      ticks: { autoSkip: true, maxTicksLimit: 8, maxRotation: 0, color: "#94a3b8", font: { size: 11 } },
      grid: { display: false },
      border: { color: "#e2e8f0" },
    },
    y: {
      ticks: { callback: v => v + "°C", color: "#94a3b8", font: { size: 11 } },
      grid: { color: "#f1f5f9" },
      border: { color: "#e2e8f0" },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1e293b",
      titleColor: "#94a3b8",
      bodyColor: "#f1f5f9",
      borderColor: "#334155",
      borderWidth: 1,
      callbacks: { label: ctx => ` ${ctx.raw}°C` },
    },
  },
};
</script>

<style scoped>
.ctrl-layout { display: flex; gap: 1.5rem; padding: 1rem 0; align-items: flex-start; flex-wrap: wrap; }
.ctrl-temp-col { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1rem; min-width: 160px; }
.ctrl-divider { width: 1px; background: #e2e8f0; align-self: stretch; }
@media (max-width: 500px) { .ctrl-divider { display: none; } }
.ctrl-right-col { flex: 1; min-width: 0; }

.temp-card { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 16px; padding: 1.25rem 1.5rem; text-align: center; color: #fff; width: 100%; }
.temp-label { font-size: 0.72rem; font-weight: 600; opacity: 0.75; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.25rem; }
.temp-value { font-size: 2.75rem; font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
.temp-unit  { font-size: 1.25rem; font-weight: 500; }
.temp-status{ font-size: 0.75rem; font-weight: 600; opacity: 0.8; margin-top: 0.25rem; }

.actual-row { display: flex; align-items: center; gap: 0.5rem; }
.actual-readout { text-align: center; }
.actual-label { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }
.actual-value { font-size: 1.25rem; font-weight: 700; color: #0f172a; }

.section-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.5rem; }
.mt-3 { margin-top: 1rem; }
.mode-indicator { display: flex; align-items: center; gap: 6px; margin-top: 0.5rem; }
.mode-name { font-size: 0.8rem; font-weight: 600; color: #475569; text-transform: capitalize; }

.ctrl-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ctrl-btn { width: 70px; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; padding: 6px 4px; gap: 4px; transition: border-color 0.15s, background 0.15s; }
.ctrl-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.ctrl-btn--active { border-color: #6366f1; background: #eef2ff; }
.ctrl-btn-icon  { width: 26px; height: 26px; object-fit: contain; }
.ctrl-btn-emoji { font-size: 1.15rem; }
.ctrl-btn-label { font-size: 0.65rem; font-weight: 600; color: #64748b; text-align: center; line-height: 1.2; }
.ctrl-btn--active .ctrl-btn-label { color: #4f46e5; }

.graph-panel { padding: 0.75rem 0; }
.graph-stats { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
.stat-chip { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.6rem 0.75rem; text-align: center; }
.stat-label { display: block; font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-value { display: block; font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 2px; }
.chart-wrapper { position: relative; height: 260px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.5rem; }
</style>
