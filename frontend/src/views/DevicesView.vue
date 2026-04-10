<template>
  <AppLayout title="Devices">
    <div class="card header-color" style="margin-bottom: 24px">
      <h4 class="text-center header">Device List</h4>
      <div class="card-body card-color">
        <div class="table-responsive text-nowrap">
          <table class="table">
            <thead>
              <tr>
                <th class="text-start">#</th>
                <th>DEV EUI</th>
                <th>Device Type</th>
                <th>Description</th>
                <th class="text-center">Active</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(device, index) in devices" :key="device.dev_eui">
                <th class="text-start">{{ index + 1 }}</th>
                <td>{{ device.dev_eui }}</td>
                <td>{{ device.device_type }}</td>
                <td>{{ device.description ?? "" }}</td>
                <td class="text-center">
                  <input type="checkbox" class="form-check-input small align-middle mt-0" :checked="device.active" disabled />
                </td>
                <td class="text-center">
                  <span class="icon icon-edit cursor me-2" @click="openEdit(device)"></span>
                  <span class="icon icon-delete cursor" @click="confirmDelete(device)"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add Modal -->
        <div class="modal fade" ref="addModalEl" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Add Device</h4>
                <button class="btn-close" type="button" @click="addModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Device Model:</label>
                  <select class="form-select" v-model="addForm.deviceModel">
                    <option value="1">RFTC-8</option>
                    <option value="2">RFATV-8</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">DEV EUI:</label>
                  <input class="form-control" type="text" v-model="addForm.eui" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description:</label>
                  <input class="form-control" type="text" v-model="addForm.description" />
                </div>
                <div v-if="addForm.deviceModel === '2'" class="mb-3">
                  <label class="form-label fs-5 fw-bold mb-2">RFATV Settings</label>
                  <div class="mb-3">
                    <label class="form-label">Heating</label>
                    <select class="form-select" v-model="addForm.heating">
                      <option value="1">Enabled</option>
                      <option value="2">Disabled - valve closed</option>
                      <option value="3">Disabled - valve open</option>
                    </select>
                  </div>
                  <div v-if="addForm.heating === '1'">
                    <div class="row mb-3">
                      <div class="col">
                        <label class="form-label">Refresh interval [min]</label>
                        <input class="form-control" type="number" v-model.number="addForm.refresh_interval" min="0.5" step="0.5" />
                      </div>
                      <div class="col">
                        <label class="form-label">Temperature hysteresis [°C]</label>
                        <input class="form-control" type="number" v-model.number="addForm.temperature_hysteresis" min="0" max="20" step="0.1" />
                      </div>
                    </div>
                    <div class="mb-2">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="add-freezing" v-model="addForm.freezingDetection" />
                        <label class="form-check-label" for="add-freezing">Freezing detection</label>
                      </div>
                    </div>
                    <div v-if="addForm.freezingDetection" class="mb-3">
                      <label class="form-label">Freezing temperature [°C]</label>
                      <input class="form-control" type="number" v-model.number="addForm.freezing_temperature" min="0" max="20" step="0.1" />
                    </div>
                    <div class="mb-2">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="add-window" v-model="addForm.windowDetection" />
                        <label class="form-check-label" for="add-window">Window detection</label>
                      </div>
                    </div>
                    <div v-if="addForm.windowDetection" class="row mb-3">
                      <div class="col">
                        <label class="form-label">Window sensitivity [°C]</label>
                        <input class="form-control" type="number" v-model.number="addForm.window_sensitivity" min="0" max="20" step="0.1" />
                      </div>
                      <div class="col">
                        <label class="form-label">Window time [min]</label>
                        <input class="form-control" type="number" v-model.number="addForm.window_time" min="0" step="0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" type="button" @click="addModal.hide()">Close</button>
                <button class="btn btn-primary" type="button" @click="submitAdd">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Modal -->
        <div class="modal fade" ref="editModalEl" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Edit Device</h4>
                <button class="btn-close" type="button" @click="editModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Device Model:</label>
                  <select class="form-select" v-model="editForm.deviceModel" disabled>
                    <option value="1">RFTC-8</option>
                    <option value="2">RFATV-8</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">DEV EUI:</label>
                  <input class="form-control" type="text" v-model="editForm.dev_eui" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Description:</label>
                  <input class="form-control" type="text" v-model="editForm.description" />
                </div>
                <div v-if="editForm.deviceModel === '2'" class="mb-3">
                  <label class="form-label fs-5 fw-bold mb-3">RFATV Settings</label>
                  <div class="mb-3">
                    <label class="form-label">Heating</label>
                    <select class="form-select" v-model="editForm.heating">
                      <option value="1">Enabled</option>
                      <option value="2">Disabled - valve closed</option>
                      <option value="3">Disabled - valve open</option>
                    </select>
                  </div>
                  <div v-if="editForm.heating === '1'">
                    <div class="row mb-3">
                      <div class="col">
                        <label class="form-label">Refresh time [min]</label>
                        <input class="form-control" type="number" v-model.number="editForm.refresh_interval" min="0.5" step="0.5" />
                      </div>
                      <div class="col">
                        <label class="form-label">Temperature hysteresis [°C]</label>
                        <input class="form-control" type="number" v-model.number="editForm.temperature_hysteresis" min="0" max="20" step="0.1" />
                      </div>
                    </div>
                    <div class="mb-2">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="edit-freezing" v-model="editForm.freezingDetection" />
                        <label class="form-check-label" for="edit-freezing">Freezing detection</label>
                      </div>
                    </div>
                    <div v-if="editForm.freezingDetection" class="mb-3">
                      <label class="form-label">Freezing temperature [°C]</label>
                      <input class="form-control" type="number" v-model.number="editForm.freezing_temperature" min="0" max="20" step="0.1" />
                    </div>
                    <div class="mb-2">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="edit-window" v-model="editForm.windowDetection" />
                        <label class="form-check-label" for="edit-window">Window detection</label>
                      </div>
                    </div>
                    <div v-if="editForm.windowDetection" class="row mb-3">
                      <div class="col">
                        <label class="form-label">Window sensitivity [°C]</label>
                        <input class="form-control" type="number" v-model.number="editForm.window_sensitivity" min="0" max="20" step="0.1" />
                      </div>
                      <div class="col">
                        <label class="form-label">Delay [min]</label>
                        <input class="form-control" type="number" v-model.number="editForm.window_time" min="0" step="0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" type="button" @click="editModal.hide()">Close</button>
                <button class="btn btn-primary" type="button" @click="submitEdit">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <div class="fixed-add-button">
      <button class="btn btn-primary btn-sm border rounded-pill btn-circle" type="button" @click="openAdd">
        <img src="@/assets/img/plus-inactive-black.svg" style="width: 28px" />
        <span class="add-text">Add</span>
      </button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Modal } from "bootstrap";
import AppLayout from "@/components/layout/AppLayout.vue";
import { fetchDevices, fetchDeviceDetails, addDevice, updateDevice, deleteDevice } from "@/services/deviceService.js";

const HEATING_MAP = { "1": "Enabled", "2": "Disabled - valve closed", "3": "Disabled - valve open" };
const HEATING_MAP_REVERSE = { Enabled: "1", "Disabled - valve closed": "2", "Disabled - valve open": "3" };

const devices = ref([]);
const addModalEl = ref(null);
const editModalEl = ref(null);
let addModal, editModal;

const defaultAddForm = () => ({
  deviceModel: "1",
  eui: "",
  description: "",
  heating: "1",
  refresh_interval: 0.5,
  temperature_hysteresis: 0,
  freezingDetection: false,
  freezing_temperature: 5,
  windowDetection: false,
  window_sensitivity: 0.4,
  window_time: 10,
});

const addForm = ref(defaultAddForm());
const editForm = ref({
  deviceModel: "1",
  dev_eui: "",
  description: "",
  heating: "1",
  refresh_interval: null,
  temperature_hysteresis: null,
  freezingDetection: false,
  freezing_temperature: null,
  windowDetection: false,
  window_sensitivity: null,
  window_time: null,
});
const editingEui = ref("");

onMounted(async () => {
  addModal = new Modal(addModalEl.value);
  editModal = new Modal(editModalEl.value);
  await loadDevices();
});

async function loadDevices() {
  devices.value = await fetchDevices();
}

function openAdd() {
  addForm.value = defaultAddForm();
  addModal.show();
}

async function submitAdd() {
  try {
    const f = addForm.value;
    const deviceData = { dev_eui: f.eui, device_type: f.deviceModel === "1" ? "RFTC8" : "RFATV8", description: f.description || "" };
    const payload = { device: deviceData };
    if (f.deviceModel === "2") {
      payload.rfatv8_settings = {
        heating: HEATING_MAP[f.heating],
        refresh_interval: f.heating === "1" ? f.refresh_interval || null : null,
        temperature_hysteresis: f.heating === "1" ? f.temperature_hysteresis ?? null : null,
        freezing_temperature: f.heating === "1" && f.freezingDetection ? f.freezing_temperature : null,
        window_sensitivity: f.heating === "1" && f.windowDetection ? f.window_sensitivity : null,
        window_time: f.heating === "1" && f.windowDetection ? f.window_time : null,
      };
    }
    await addDevice(payload);
    await loadDevices();
    addModal.hide();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function openEdit(device) {
  try {
    const d = await fetchDeviceDetails(device.dev_eui);
    if (!d) return;
    editingEui.value = d.dev_eui;
    editForm.value = {
      deviceModel: d.device_type === "RFTC8" ? "1" : "2",
      dev_eui: d.dev_eui,
      description: d.description ?? "",
      heating: HEATING_MAP_REVERSE[d.heating] || "1",
      refresh_interval: d.refresh_interval || null,
      temperature_hysteresis: d.temperature_hysteresis ?? null,
      freezingDetection: d.freezing_temperature != null,
      freezing_temperature: d.freezing_temperature ?? null,
      windowDetection: d.window_sensitivity != null,
      window_sensitivity: d.window_sensitivity ?? null,
      window_time: d.window_time ?? null,
    };
    editModal.show();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function submitEdit() {
  try {
    const f = editForm.value;
    const deviceType = f.deviceModel === "1" ? "RFTC8" : "RFATV8";
    const deviceData = { dev_eui: f.dev_eui, device_type: deviceType, description: f.description || "" };
    const payload = { device: deviceData };
    if (f.deviceModel === "2") {
      payload.rfatv8_settings = {
        heating: HEATING_MAP[f.heating],
        refresh_interval: f.heating === "1" ? f.refresh_interval || null : null,
        temperature_hysteresis: f.heating === "1" ? f.temperature_hysteresis ?? null : null,
        freezing_temperature: f.heating === "1" && f.freezingDetection ? f.freezing_temperature : null,
        window_sensitivity: f.heating === "1" && f.windowDetection ? f.window_sensitivity : null,
        window_time: f.heating === "1" && f.windowDetection ? f.window_time : null,
      };
    }
    await updateDevice(deviceType, editingEui.value, payload);
    await loadDevices();
    editModal.hide();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function confirmDelete(device) {
  if (!confirm(`Are you sure you want to delete ${device.device_type} ${device.dev_eui}?`)) return;
  try {
    await deleteDevice(device.device_type, device.dev_eui);
    await loadDevices();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
</script>
