<template>
  <div class="modal fade" ref="modalEl" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header header-color">
          <h4 class="modal-title">{{ room?.name ?? "Room" }}</h4>
          <button class="btn-close" type="button" @click="modal?.hide()"></button>
        </div>

        <div class="modal-body">
          <!-- Tabs -->
          <ul class="nav nav-tabs mb-3" role="tablist">
            <li class="nav-item">
              <button class="nav-link" :class="{ active: activeTab === 'control' }" @click="activeTab = 'control'" type="button">Control</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" :class="{ active: activeTab === 'graph' }" @click="onOpenGraph" type="button">Graph</button>
            </li>
          </ul>

          <!-- Control tab -->
          <div v-show="activeTab === 'control'">
            <div class="row">
              <!-- Left: temperature control -->
              <div class="col">
                <div class="d-flex flex-column align-items-center mb-4">
                  <img :src="thermometerIcon" alt="temperature" style="width: 36px; height: 36px; margin-bottom: 6px" />
                  <div style="font-size: 2rem; font-weight: 700">{{ setTemp.toFixed(1) }}°C</div>
                  <div class="text-muted small">Set temp.</div>
                  <div class="text-primary small fw-bold mt-1">{{ heatingStatus }}</div>
                </div>

                <div class="d-flex align-items-center justify-content-center gap-3">
                  <button class="btn btn-sm btn-light rounded-circle" style="width:40px;height:40px;font-size:1.2rem" @click="adjustActualTemp(-1)">−</button>
                  <div class="text-center">
                    <div style="font-size:1.1rem; color:#888; font-size:0.8rem">Actual temp.</div>
                    <div style="font-size:1.5rem; font-weight:600">{{ actualTemp.toFixed(1) }} °C</div>
                  </div>
                  <button class="btn btn-sm btn-light rounded-circle" style="width:40px;height:40px;font-size:1.2rem" @click="adjustActualTemp(1)">+</button>
                </div>
              </div>

              <div class="col-auto d-none d-md-block">
                <div style="width:1px;background:#ddd;height:100%"></div>
              </div>

              <!-- Right: mode + controls -->
              <div class="col">
                <div class="mb-3">
                  <div class="text-muted small mb-2 fw-bold">Select mode</div>
                  <div class="d-flex gap-2 flex-wrap">
                    <button
                      v-for="m in modes"
                      :key="m.key"
                      class="btn btn-sm rounded-pill"
                      :class="activeMode === m.key ? 'btn-primary' : 'btn-outline-secondary'"
                      @click="selectMode(m)"
                      style="min-width:62px"
                    >{{ m.temp }}°C</button>
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-2" v-if="activeMode">
                    <span :class="`color-indicator ${activeMode}`"></span>
                    <span class="small fw-bold text-capitalize">{{ activeMode }}</span>
                  </div>
                </div>

                <div class="mt-3">
                  <div class="text-muted small mb-2 fw-bold">Control</div>
                  <div class="d-flex flex-wrap gap-2">
                    <button
                      v-for="ctrl in controls"
                      :key="ctrl.key"
                      class="btn btn-sm btn-light d-flex flex-column align-items-center"
                      style="width:72px;min-height:64px;font-size:0.7rem"
                      :class="{ 'border-primary': activeControl === ctrl.key }"
                      @click="activeControl = ctrl.key"
                    >
                      <img v-if="ctrl.icon" :src="ctrl.icon" style="width:28px;height:28px;margin-bottom:4px" />
                      <span v-else style="font-size:1.2rem;margin-bottom:4px">{{ ctrl.emoji }}</span>
                      <span>{{ ctrl.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Graph tab -->
          <div v-show="activeTab === 'graph'" style="position:relative;height:280px">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-light" @click="modal?.hide()">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { Modal } from "bootstrap";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";

import thermometerIcon from "@/assets/img/device/thermometer.svg";
import onIcon from "@/assets/img/device/on.svg";
import automatIcon from "@/assets/img/device/automat_on.svg";
import heatingIcon from "@/assets/img/device/heating.svg";

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Tooltip);

const props = defineProps({ room: Object });

const modalEl = ref(null);
const chartCanvas = ref(null);
let modal = null;
let chartInstance = null;

const activeTab = ref("control");
const actualTemp = ref(20.0);
const setTemp = ref(28.0);
const activeMode = ref("comfort");
const activeControl = ref("on");
const heatingStatus = ref("Heating");

const modes = [
  { key: "minimum",    temp: 15 },
  { key: "attenuation", temp: 20 },
  { key: "normal",     temp: 24 },
  { key: "comfort",    temp: 28 },
];

const controls = [
  { key: "on",       label: "On/Off",          icon: onIcon },
  { key: "automat",  label: "Automat",         icon: automatIcon },
  { key: "holiday",  label: "Holiday",         icon: null, emoji: "🏖" },
  { key: "manual",   label: "Manual",          icon: null, emoji: "✋" },
  { key: "temp-man", label: "Temp. manual",    icon: null, emoji: "⏱" },
  { key: "heat",     label: "Heat",            icon: heatingIcon },
];

onMounted(() => {
  modal = new Modal(modalEl.value);
});

function show() {
  activeTab.value = "control";
  modal.show();
}

function adjustActualTemp(delta) {
  actualTemp.value = parseFloat((actualTemp.value + delta).toFixed(1));
}

function selectMode(m) {
  activeMode.value = m.key;
  setTemp.value = m.temp;
}

function onOpenGraph() {
  activeTab.value = "graph";
  nextTick(() => buildChart());
}

function buildChart() {
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const now = Date.now();
  const POINTS = 288;
  const INTERVAL = 5 * 60 * 1000;

  const labels = Array.from({ length: POINTS }, (_, i) => now - (POINTS - 1 - i) * INTERVAL);
  const data = generateTemp(POINTS, actualTemp.value, 2);

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "T1",
        data,
        borderColor: "#0091ea",
        borderWidth: 3,
        radius: 0,
        cubicInterpolationMode: "monotone",
        fill: "start",
        backgroundColor: (ctx) => {
          const { chartArea, ctx: c } = ctx.chart;
          if (!chartArea) return null;
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, "rgba(255,255,255,0.2)");
          g.addColorStop(1, "rgba(0,145,234,0.5)");
          return g;
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 10, bottom: 10 } },
      scales: {
        x: {
          type: "time",
          time: { unit: "minute", tooltipFormat: "HH:mm", displayFormats: { minute: "HH:mm" } },
          ticks: { source: "data", autoSkip: true, maxTicksLimit: 8, maxRotation: 0 },
          grid: { display: false },
        },
        y: {
          afterDataLimits: ax => { ax.max += 3; ax.min -= 3; },
          ticks: { callback: v => v + " °C" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}°C` } },
      },
    },
  });
}

function generateTemp(count, start, variance) {
  const data = [start];
  for (let i = 1; i < count; i++) {
    data.push(parseFloat((data[i - 1] + (Math.random() - 0.5) * variance).toFixed(1)));
  }
  return data;
}

defineExpose({ show });
</script>
