<template>
  <AppLayout title="Rooms">
    <div class="card header-color">
      <h4 class="text-center header">List of rooms</h4>
      <div class="card-body card-color">

        <!-- Add Room Modal -->
        <div class="modal fade" ref="addModalEl" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Add room</h4>
                <button class="btn-close" type="button" @click="addModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input class="form-control" type="text" v-model="addForm.name" />
                </div>
                <div>
                  <label class="form-label">Description</label>
                  <input class="form-control" type="text" v-model="addForm.description" />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="addModal.hide()">Close</button>
                <button class="btn btn-primary" @click="submitAdd">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Room Modal -->
        <div class="modal fade" ref="editModalEl" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Edit room</h4>
                <button class="btn-close" type="button" @click="editModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input class="form-control" type="text" v-model="editForm.name" />
                </div>
                <div>
                  <label class="form-label">Description</label>
                  <input class="form-control" type="text" v-model="editForm.description" />
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="editModal.hide()">Close</button>
                <button class="btn btn-primary" @click="submitEdit">Edit</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Setup Room Offcanvas -->
        <div class="offcanvas offcanvas-end" ref="setupOffcanvasEl" tabindex="-1" data-bs-keyboard="false">
          <div class="offcanvas-header header-color">
            <h5 class="offcanvas-title">{{ setupRoom?.name ?? "" }} setup</h5>
            <button class="btn-close" type="button" @click="setupOffcanvas.hide()"></button>
          </div>
          <div class="offcanvas-body">
            <div class="d-flex justify-content-center gap-5 mb-5 mt-4">
              <span class="icon-thermo icon bigger cursor" title="Add thermostat" @click="openThermostatPicker"></span>
              <span class="icon-heating icon bigger cursor" title="Add thermostatic valve" @click="openValvePicker"></span>
              <span class="icon-automat-on icon bigger cursor" title="Add temperature plan" @click="openPlanPicker"></span>
              <span class="icon-user icon bigger cursor" title="Link account" @click="openAccountPicker"></span>
            </div>

            <!-- Thermostat -->
            <div class="mb-4">
              <h6 class="text-uppercase fw-bold text-muted mb-3">Thermostat</h6>
              <div v-if="setup.thermostats.length === 0" class="text-center text-muted bg-light py-3 px-2 rounded border small">No added thermostat</div>
              <table v-else class="table">
                <tbody>
                  <tr v-for="(item, i) in setup.thermostats" :key="item.dev_eui" class="align-middle">
                    <th>{{ i + 1 }}</th>
                    <td>{{ item.dev_eui }}</td>
                    <td>{{ item.description ?? "" }}</td>
                    <td class="text-end">
                      <span class="icon icon-delete cursor" @click="removeSetupItem('device', item, 'RFTC8')"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Valves -->
            <div class="mb-4">
              <h6 class="text-uppercase fw-bold text-muted mb-3">Thermostatic valves</h6>
              <div v-if="setup.valves.length === 0" class="text-center text-muted bg-light py-3 px-2 rounded border small">No added thermostatic valve</div>
              <table v-else class="table">
                <tbody>
                  <tr v-for="(item, i) in setup.valves" :key="item.dev_eui" class="align-middle">
                    <th>{{ i + 1 }}</th>
                    <td>{{ item.dev_eui }}</td>
                    <td>{{ item.description ?? "" }}</td>
                    <td class="text-end">
                      <span class="icon icon-delete cursor" @click="removeSetupItem('device', item, 'RFATV8')"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Plan -->
            <div class="mb-4">
              <h6 class="text-uppercase fw-bold text-muted mb-3">Temperature plan</h6>
              <div v-if="setup.plans.length === 0" class="text-center text-muted bg-light py-3 px-2 rounded border small">No added temperature plan</div>
              <table v-else class="table">
                <tbody>
                  <tr v-for="(item, i) in setup.plans" :key="item.plan_id" class="align-middle">
                    <th>{{ i + 1 }}</th>
                    <td>{{ item.name }}</td>
                    <td>{{ item.description ?? "" }}</td>
                    <td class="text-end">
                      <span class="icon icon-delete cursor" @click="removeSetupItem('plan', item)"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Accounts -->
            <div class="mb-4">
              <h6 class="text-uppercase fw-bold text-muted mb-3">Linked accounts</h6>
              <div v-if="setup.accounts.length === 0" class="text-center text-muted bg-light py-3 px-2 rounded border small">No linked account</div>
              <table v-else class="table">
                <tbody>
                  <tr v-for="(item, i) in setup.accounts" :key="item.account_id" class="align-middle">
                    <th>{{ i + 1 }}</th>
                    <td>{{ item.username }}</td>
                    <td>{{ item.description ?? "" }}</td>
                    <td>{{ item.enable ? "Enabled" : "Disabled" }}</td>
                    <td class="text-end">
                      <span class="icon icon-delete cursor" @click="removeSetupItem('account', item)"></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="d-flex justify-content-end">
              <button class="btn btn-light me-2" @click="setupOffcanvas.hide()">Close</button>
              <button class="btn btn-primary" @click="saveSetup">Save</button>
            </div>
          </div>
        </div>

        <!-- Thermostat Picker Modal -->
        <div class="modal fade" ref="thermostatModalEl" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">RFTC-8</h4>
                <button class="btn-close" @click="thermostatModal.hide()"></button>
              </div>
              <div class="modal-body">
                <hr />
                <div v-for="d in availableThermostats" :key="d.dev_eui" class="form-check">
                  <input class="form-check-input" type="radio" :id="'th-' + d.dev_eui" :value="d.dev_eui" v-model="pickerSelection.thermostat" />
                  <label class="form-check-label" :for="'th-' + d.dev_eui">{{ d.dev_eui }} – {{ d.description ?? "No description" }}</label>
                </div>
                <hr />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="thermostatModal.hide()">Close</button>
                <button class="btn btn-primary" @click="addThermostatToSetup">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Valve Picker Modal -->
        <div class="modal fade" ref="valveModalEl" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">RFATV-8</h4>
                <button class="btn-close" @click="valveModal.hide()"></button>
              </div>
              <div class="modal-body">
                <hr />
                <div v-for="d in availableValves" :key="d.dev_eui" class="form-check no-select">
                  <input class="form-check-input" type="checkbox" :id="'v-' + d.dev_eui" :value="d" v-model="pickerSelection.valves" />
                  <label class="form-check-label" :for="'v-' + d.dev_eui">{{ d.dev_eui }} – {{ d.description ?? "No description" }}</label>
                </div>
                <hr />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="valveModal.hide()">Close</button>
                <button class="btn btn-primary" @click="addValvesToSetup">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Plan Picker Modal -->
        <div class="modal fade" ref="planModalEl" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Temperature plan</h4>
                <button class="btn-close" @click="planModal.hide()"></button>
              </div>
              <div class="modal-body">
                <hr />
                <div v-for="p in availablePlans" :key="p.plan_id" class="form-check">
                  <input class="form-check-input" type="radio" :id="'p-' + p.plan_id" :value="p" v-model="pickerSelection.plan" />
                  <label class="form-check-label" :for="'p-' + p.plan_id">{{ p.name }} – {{ p.description ?? "No description" }}</label>
                </div>
                <hr />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="planModal.hide()">Close</button>
                <button class="btn btn-primary" @click="addPlanToSetup">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Picker Modal -->
        <div class="modal fade" ref="accountModalEl" tabindex="-1" data-bs-backdrop="static">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Link accounts</h4>
                <button class="btn-close" @click="accountModal.hide()"></button>
              </div>
              <div class="modal-body">
                <hr />
                <div v-for="a in availableAccounts" :key="a.account_id" class="form-check no-select">
                  <input class="form-check-input" type="checkbox" :id="'a-' + a.account_id" :value="a" v-model="pickerSelection.accounts" />
                  <label class="form-check-label" :for="'a-' + a.account_id">{{ a.username }}</label>
                </div>
                <hr />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="accountModal.hide()">Close</button>
                <button class="btn btn-primary" @click="addAccountsToSetup">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Rooms Table -->
        <div class="table-responsive text-nowrap" style="margin-top: 10px">
          <table class="table">
            <thead>
              <tr>
                <th class="text-start">#</th>
                <th>Name</th>
                <th>Description</th>
                <th class="text-center">ON / OFF</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(room, index) in rooms" :key="room.room_id">
                <th class="text-start">{{ index + 1 }}</th>
                <td>{{ room.name }}</td>
                <td>{{ room.description ?? "" }}</td>
                <td class="text-center"><span class="icon icon-on"></span></td>
                <td class="text-center">
                  <span class="icon icon-play cursor me-2" title="Dashboard" @click="openDashboard(room)"></span>
                  <span class="icon icon-add cursor me-2" title="Setup" @click="openSetup(room)"></span>
                  <span class="icon icon-edit cursor me-2" @click="openEdit(room)"></span>
                  <span class="icon icon-delete cursor" @click="confirmDelete(room)"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Room Dashboard -->
    <RoomDashboard ref="dashboardRef" :room="dashboardRoom" />

    <!-- FAB -->
    <div class="fixed-add-button">
      <button class="btn btn-primary btn-sm border rounded-pill btn-circle" @click="openAdd">
        <img src="@/assets/img/plus-inactive-black.svg" style="width: 28px" />
        <span class="add-text">Add</span>
      </button>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Modal, Offcanvas } from "bootstrap";
import AppLayout from "@/components/layout/AppLayout.vue";
import { defineAsyncComponent } from "vue";
const RoomDashboard = defineAsyncComponent(() => import("@/components/RoomDashboard.vue"));
import { fetchRooms, addRoom, updateRoom, deleteRoom, addRoomSetup, fetchRoomDevices, fetchRoomAccounts, fetchRoomTemperaturePlan, removeDeviceFromRoom, removeAccountFromRoom, removePlanFromRoom } from "@/services/roomService.js";
import { fetchDevices } from "@/services/deviceService.js";
import { fetchAccounts } from "@/services/accountService.js";
import { fetchTemperaturePlans } from "@/services/tempPlanService.js";

const rooms = ref([]);

// Dashboard
const dashboardRef = ref(null);
const dashboardRoom = ref(null);
function openDashboard(room) {
  dashboardRoom.value = room;
  dashboardRef.value.show();
}

// Modal/Offcanvas refs
const addModalEl = ref(null);
const editModalEl = ref(null);
const setupOffcanvasEl = ref(null);
const thermostatModalEl = ref(null);
const valveModalEl = ref(null);
const planModalEl = ref(null);
const accountModalEl = ref(null);
let addModal, editModal, setupOffcanvas, thermostatModal, valveModal, planModal, accountModal;

// Forms
const addForm = ref({ name: "", description: "" });
const editForm = ref({ name: "", description: "" });
const editingRoomId = ref(null);

// Setup state
const setupRoom = ref(null);
const setup = reactive({ thermostats: [], valves: [], plans: [], accounts: [] });

// Picker data
const availableThermostats = ref([]);
const availableValves = ref([]);
const availablePlans = ref([]);
const availableAccounts = ref([]);
const pickerSelection = reactive({ thermostat: null, valves: [], plan: null, accounts: [] });

onMounted(async () => {
  addModal = new Modal(addModalEl.value);
  editModal = new Modal(editModalEl.value);
  setupOffcanvas = new Offcanvas(setupOffcanvasEl.value);
  thermostatModal = new Modal(thermostatModalEl.value);
  valveModal = new Modal(valveModalEl.value);
  planModal = new Modal(planModalEl.value);
  accountModal = new Modal(accountModalEl.value);
  await loadRooms();
});

async function loadRooms() {
  rooms.value = await fetchRooms();
}

function openAdd() {
  addForm.value = { name: "", description: "" };
  addModal.show();
}

async function submitAdd() {
  try {
    await addRoom(addForm.value);
    await loadRooms();
    addModal.hide();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function openEdit(room) {
  editingRoomId.value = room.room_id;
  editForm.value = { name: room.name, description: room.description ?? "" };
  editModal.show();
}

async function submitEdit() {
  try {
    await updateRoom(editingRoomId.value, editForm.value);
    await loadRooms();
    editModal.hide();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function confirmDelete(room) {
  if (!confirm(`Are you sure you want to delete ${room.name}?`)) return;
  try {
    await deleteRoom(room.room_id);
    await loadRooms();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function openSetup(room) {
  setupRoom.value = room;
  setup.thermostats = [];
  setup.valves = [];
  setup.plans = [];
  setup.accounts = [];

  const [devices, plan, accounts, allDevices, allPlans, allAccounts] = await Promise.all([
    fetchRoomDevices(room.room_id),
    fetchRoomTemperaturePlan(room.room_id),
    fetchRoomAccounts(room.room_id),
    fetchDevices(),
    fetchTemperaturePlans(),
    fetchAccounts(),
  ]);

  setup.thermostats = devices.filter(d => d.device_type === "RFTC8");
  setup.valves = devices.filter(d => d.device_type === "RFATV8");
  setup.plans = plan ? [plan] : [];
  setup.accounts = accounts;

  availableThermostats.value = allDevices.filter(d => d.device_type === "RFTC8");
  availableValves.value = allDevices.filter(d => d.device_type === "RFATV8");
  availablePlans.value = allPlans;
  availableAccounts.value = allAccounts;

  setupOffcanvas.show();
}

async function removeSetupItem(type, item, deviceType = null) {
  if (!confirm("Are you sure you want to remove this item from the room?")) return;
  try {
    if (type === "device") {
      await removeDeviceFromRoom(setupRoom.value.room_id, item.dev_eui, deviceType);
      if (deviceType === "RFTC8") setup.thermostats = setup.thermostats.filter(d => d.dev_eui !== item.dev_eui);
      else setup.valves = setup.valves.filter(d => d.dev_eui !== item.dev_eui);
    } else if (type === "plan") {
      await removePlanFromRoom(setupRoom.value.room_id, item.plan_id);
      setup.plans = [];
    } else if (type === "account") {
      await removeAccountFromRoom(setupRoom.value.room_id, item.account_id);
      setup.accounts = setup.accounts.filter(a => a.account_id !== item.account_id);
    }
  } catch (err) { alert(`Error: ${err.message}`); }
}

function openThermostatPicker() { pickerSelection.thermostat = null; thermostatModal.show(); }
function openValvePicker() { pickerSelection.valves = []; valveModal.show(); }
function openPlanPicker() { pickerSelection.plan = null; planModal.show(); }
function openAccountPicker() { pickerSelection.accounts = []; accountModal.show(); }

function addThermostatToSetup() {
  const eui = pickerSelection.thermostat;
  if (!eui) { thermostatModal.hide(); return; }
  const device = availableThermostats.value.find(d => d.dev_eui === eui);
  if (device && !setup.thermostats.find(d => d.dev_eui === eui)) setup.thermostats = [device];
  thermostatModal.hide();
}

function addValvesToSetup() {
  for (const device of pickerSelection.valves) {
    if (!setup.valves.find(d => d.dev_eui === device.dev_eui)) setup.valves.push(device);
  }
  valveModal.hide();
}

function addPlanToSetup() {
  if (pickerSelection.plan) setup.plans = [pickerSelection.plan];
  planModal.hide();
}

function addAccountsToSetup() {
  for (const acc of pickerSelection.accounts) {
    if (!setup.accounts.find(a => a.account_id === acc.account_id)) setup.accounts.push(acc);
  }
  accountModal.hide();
}

async function saveSetup() {
  try {
    const payload = {
      account_id: setup.accounts.map(a => parseInt(a.account_id)),
      plan_id: setup.plans.length > 0 ? parseInt(setup.plans[0].plan_id) : null,
      rftc8_dev_eui: setup.thermostats.length > 0 ? setup.thermostats[0].dev_eui : null,
      rfatv8_dev_eui: setup.valves.map(v => v.dev_eui),
    };
    await addRoomSetup(setupRoom.value.room_id, payload);
    setupOffcanvas.hide();
  } catch (err) { alert(`Error: ${err.message}`); }
}
</script>
