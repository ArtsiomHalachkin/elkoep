<template>
  <AppLayout title="Temperature plans">
    <div class="card header-color" style="margin-bottom: 24px">
      <h4 class="text-center header">List of plans</h4>
      <div class="card-body card-color">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th class="text-center">Edit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(plan, index) in plans" :key="plan.plan_id">
                <th class="text-start">{{ index + 1 }}</th>
                <td>{{ plan.name }}</td>
                <td>{{ plan.description ?? "" }}</td>
                <td class="text-center">
                  <span class="icon icon-edit cursor me-2" @click="openEdit(plan)"></span>
                  <span class="icon icon-delete cursor" @click="confirmDelete(plan)"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add Plan Modal -->
        <div class="modal fade" ref="addModalEl" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Add temperature plan</h4>
                <button class="btn-close" @click="addModal.hide()"></button>
              </div>
              <div class="modal-body">
                <!-- FIX #2: unique prefix "add" scopes all radio IDs -->
                <PlanModalBody
                  prefix="add"
                  v-model:form="addForm"
                  v-model:slots="addSlots"
                  @open-add-slot="openAddSlot('add', $event)"
                />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="addModal.hide()">Close</button>
                <button class="btn btn-primary" @click="submitAdd">Add</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Plan Modal -->
        <div class="modal fade" ref="editModalEl" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Edit temperature plan</h4>
                <button class="btn-close" @click="editModal.hide()"></button>
              </div>
              <div class="modal-body">
                <!-- FIX #2: unique prefix "edit" scopes all radio IDs -->
                <PlanModalBody
                  prefix="edit"
                  v-model:form="editForm"
                  v-model:slots="editSlots"
                  @open-add-slot="openAddSlot('edit', $event)"
                />
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="editModal.hide()">Close</button>
                <button class="btn btn-primary" @click="submitEdit">Save</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Slot Sub-modal -->
        <div class="modal fade" ref="slotModalEl" tabindex="-1" data-bs-backdrop="false">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header header-color">
                <h4 class="modal-title">Add time slot</h4>
                <button class="btn-close" @click="slotModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Mode</label>
                  <select class="form-select" v-model="slotForm.mode">
                    <option value="minimum">Minimum</option>
                    <option value="attenuation">Attenuation</option>
                    <option value="normal">Normal</option>
                    <option value="comfort">Comfort</option>
                  </select>
                </div>
                <div class="row">
                  <div class="col">
                    <label class="form-label">Start time</label>
                    <input class="form-control" type="time" v-model="slotForm.startTime" />
                  </div>
                  <div class="col">
                    <!-- FIX #5: label clarifies 23:59 = midnight -->
                    <label class="form-label">End time <span class="text-muted small">(23:59 = midnight)</span></label>
                    <input class="form-control" type="time" v-model="slotForm.endTime" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-light" @click="slotModal.hide()">Close</button>
                <button class="btn btn-primary" @click="submitAddSlot">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted, defineComponent, computed, h } from "vue";
import { Modal } from "bootstrap";
import AppLayout from "@/components/layout/AppLayout.vue";
import { fetchTemperaturePlans, fetchTempPlan, addTempPlan, updateTempPlan, deleteTempPlan } from "@/services/tempPlanService.js";

// ─── Time utilities ──────────────────────────────────────────────────────────
function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  if (h === 24 && m === 0) return 1440;
  return h * 60 + m;
}
function fromMinutes(mins) {
  if (mins === 1440) return "24:00";
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

const DAY_SHORT  = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };
const SHORT_TO_NUM = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

// ─── Slot manipulation (pure data, no DOM) ───────────────────────────────────
function emptySlots() {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
}

function sortDay(day) {
  day.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

function mergeDay(day) {
  if (!day.length) return;
  sortDay(day);
  const merged = [];
  let cur = { ...day[0] };
  for (let i = 1; i < day.length; i++) {
    const next = day[i];
    if (next.mode === cur.mode && toMinutes(next.startTime) === toMinutes(cur.endTime)) {
      cur = { ...cur, endTime: next.endTime, slotId: null };
    } else {
      merged.push(cur);
      cur = { ...next };
    }
  }
  merged.push(cur);
  day.splice(0, day.length, ...merged);
}

function adjustDay(day) {
  if (!day.length) return;
  sortDay(day);
  if (day[0].startTime !== "00:00") day[0] = { ...day[0], startTime: "00:00" };
  const last = day[day.length - 1];
  if (last.endTime !== "24:00") day[day.length - 1] = { ...last, endTime: "24:00" };
  for (let i = 1; i < day.length; i++) {
    const prev = day[i - 1];
    const cur  = day[i];
    if (toMinutes(prev.endTime) !== toMinutes(cur.startTime)) {
      day[i - 1] = { ...prev, endTime: cur.startTime };
    }
  }
  sortDay(day);
  mergeDay(day);
}

function handleConflicts(day, newStart, newEnd) {
  const result = [];
  for (const slot of day) {
    const s    = toMinutes(slot.startTime);
    const eRaw = toMinutes(slot.endTime);
    const e    = eRaw === 0 && s !== 0 ? 1440 : eRaw;
    if (newStart >= e || newEnd <= s) {
      result.push(slot);
    } else if (newStart <= s && newEnd >= e) {
      // fully covered — drop
    } else if (newStart > s && newEnd < e) {
      result.push({ ...slot, endTime: fromMinutes(newStart), slotId: null });
      result.push({ ...slot, startTime: fromMinutes(newEnd),  slotId: null });
    } else if (newStart <= s) {
      result.push({ ...slot, startTime: fromMinutes(newEnd) });
    } else {
      result.push({ ...slot, endTime: fromMinutes(newStart) });
    }
  }
  day.splice(0, day.length, ...result);
}

function addSlotToDay(day, mode, startTime, endTime) {
  const newStart = toMinutes(startTime);
  const newEnd   = toMinutes(endTime);
  const existing = day.find(s => toMinutes(s.startTime) === newStart && toMinutes(s.endTime) === newEnd);
  if (existing) {
    existing.mode = mode;
  } else {
    handleConflicts(day, newStart, newEnd);
    day.push({ mode, startTime, endTime, slotId: null });
  }
  sortDay(day);
  mergeDay(day);
  adjustDay(day);
}

function initDefaultSlots(slots) {
  for (const day of Object.values(slots)) {
    if (day.length === 0) day.push({ mode: "minimum", startTime: "00:00", endTime: "24:00", slotId: null });
  }
}

// ─── PlanModalBody component ──────────────────────────────────────────────────
// FIX #2: accepts `prefix` prop to namespace all radio/label IDs uniquely
const PlanModalBody = defineComponent({
  name: "PlanModalBody",
  props: { form: Object, slots: Object, prefix: { type: String, required: true } },
  emits: ["update:form", "update:slots", "open-add-slot"],
  setup(props, { emit }) {
    const selectedDay  = ref(1);
    const currentView  = ref("time-schedule");

    const currentDaySlots = computed(() => props.slots[selectedDay.value] ?? []);

    function updateForm(key, value) {
      emit("update:form", { ...props.form, [key]: value });
    }

    function removeSlot(index) {
      const updated = { ...props.slots };
      const dayArr  = [...updated[selectedDay.value]];
      dayArr.splice(index, 1);
      // FIX #3: restore default if day becomes empty
      if (dayArr.length === 0) {
        dayArr.push({ mode: "minimum", startTime: "00:00", endTime: "24:00", slotId: null });
      } else {
        adjustDay(dayArr);
      }
      updated[selectedDay.value] = dayArr;
      emit("update:slots", updated);
    }

    function slotStyle(slot) {
      const start  = toMinutes(slot.startTime) / 1440 * 100;
      const height = (toMinutes(slot.endTime) - toMinutes(slot.startTime)) / 1440 * 100;
      return { top: start + "%", height: height + "%", position: "absolute", width: "100%" };
    }

    const weekdays   = [1, 2, 3, 4, 5, 6, 7];
    const timeLabels = [0, 3, 6, 9, 12, 15, 18, 21, 24];

    // FIX #2: prefix all IDs with the instance prefix
    const pid = (id) => `${props.prefix}-${id}`;

    return () => h("div", [
      // Name & Description
      h("div", { class: "row mb-3" }, [
        h("div", { class: "col" }, [
          h("label", { class: "form-label" }, "Name:"),
          h("input", { class: "form-control form-control-sm", type: "text", value: props.form.name,
            onInput: e => updateForm("name", e.target.value) }),
        ]),
        h("div", { class: "col" }, [
          h("label", { class: "form-label" }, "Description:"),
          h("input", { class: "form-control form-control-sm", type: "text", value: props.form.description,
            onInput: e => updateForm("description", e.target.value) }),
        ]),
      ]),
      h("hr"),
      h("div", { class: "row" }, [
        // Left: temperature settings
        h("div", { class: "col-12 col-lg-6 pb-4 pb-lg-0 custom-border-right custom-border-bottom" }, [
          h("div", { class: "heating-cooling-switch mb-4" }, [
            h("div", { class: "heating-cooling-label-container" }, h("label", { class: "heating" }, "Heating")),
          ]),
          h("div", { class: "row form-group mb-2" }, [
            h("div", { class: "col" }, [
              h("label", { class: "form-label" }, "Minimum [°C]:"),
              h("input", { class: "form-control form-control-sm", type: "number", value: props.form.min_temp, min: 0, max: 50, step: 1,
                onInput: e => updateForm("min_temp", parseFloat(e.target.value)) }),
            ]),
            h("div", { class: "col" }, [
              h("label", { class: "form-label" }, "Attenuation [°C]:"),
              h("input", { class: "form-control form-control-sm", type: "number", value: props.form.attenuation_temp, min: 0, max: 50, step: 1,
                onInput: e => updateForm("attenuation_temp", parseFloat(e.target.value)) }),
            ]),
          ]),
          h("div", { class: "row form-group" }, [
            h("div", { class: "col" }, [
              h("label", { class: "form-label" }, "Normal [°C]:"),
              h("input", { class: "form-control form-control-sm", type: "number", value: props.form.normal_temp, min: 0, max: 50, step: 1,
                onInput: e => updateForm("normal_temp", parseFloat(e.target.value)) }),
            ]),
            h("div", { class: "col" }, [
              h("label", { class: "form-label" }, "Comfort [°C]:"),
              h("input", { class: "form-control form-control-sm", type: "number", value: props.form.comfort_temp, min: 0, max: 50, step: 1,
                onInput: e => updateForm("comfort_temp", parseFloat(e.target.value)) }),
            ]),
          ]),
        ]),

        // Right: schedule
        h("div", { class: "col-12 col-lg-6 pt-4 pt-lg-0 custom-border-left custom-border-top" }, [
          // View toggle — FIX #2: IDs prefixed
          h("div", { class: "time-weekly-switch mb-4" }, [
            h("div", { class: "time-weekly-label-container" }, [
              h("input", { class: "btn-check", type: "radio", id: pid("ts"), value: "time-schedule",
                checked: currentView.value === "time-schedule", onChange: () => { currentView.value = "time-schedule"; } }),
              h("label", { class: "time-weekly-label", for: pid("ts") }, "Time Schedule"),
            ]),
            h("div", { class: "time-weekly-label-container" }, [
              h("input", { class: "btn-check", type: "radio", id: pid("wo"), value: "weekly-overview",
                checked: currentView.value === "weekly-overview", onChange: () => { currentView.value = "weekly-overview"; } }),
              h("label", { class: "time-weekly-label", for: pid("wo") }, "Weekly Overview"),
            ]),
          ]),

          currentView.value === "time-schedule"
            ? h("div", [
                // Day picker — FIX #2: IDs prefixed
                h("div", { class: "temp-plan-container mb-4" },
                  weekdays.flatMap(d => [
                    h("input", { class: "btn-check", type: "radio", id: pid(`d${d}`), value: d,
                      checked: selectedDay.value === d, onChange: () => { selectedDay.value = d; } }),
                    h("label", { class: "temp-plan-day-btn", for: pid(`d${d}`) }, DAY_SHORT[d]),
                  ])
                ),
                // Slot list
                h("div", { class: "mb-3" },
                  currentDaySlots.value.map((slot, i) =>
                    h("div", { key: i, class: "d-flex justify-content-between align-items-center border p-2 mb-2 small" }, [
                      h("div", { class: "d-flex align-items-center" }, [
                        h("span", { class: `color-indicator ${slot.mode}` }),
                        h("span", { class: "fw-bold ms-2" }, capitalize(slot.mode)),
                      ]),
                      h("div", { class: "d-flex align-items-center" }, [
                        h("span", {}, `${slot.startTime} - ${slot.endTime}`),
                        h("span", { class: "icon icon-delete ms-3 cursor", onClick: () => removeSlot(i) }),
                      ]),
                    ])
                  )
                ),
                // FIX #1: emit selected day so parent knows where to add the slot
                h("button", { class: "btn btn-sm btn-light w-100", type: "button",
                  onClick: () => emit("open-add-slot", selectedDay.value) }, "+ Add slot"),
              ])
            : // Weekly Overview grid
              h("div", { class: "schedule-container" }, [
                h("div", { class: "schedule-header" }, [
                  h("div", { class: "time-column" }),
                  ...weekdays.map(d => h("div", { key: d, class: "day-label" }, DAY_SHORT[d])),
                ]),
                h("div", { class: "schedule-grid" }, [
                  h("div", { class: "time-column" },
                    timeLabels.map(t => h("div", { key: t, class: "time-slot-label" },
                      `${String(t).padStart(2, "0")}:00`))
                  ),
                  ...weekdays.map(d =>
                    h("div", { key: d, class: "day-column" },
                      (props.slots[d] ?? []).map((slot, i) =>
                        h("div", {
                          key: i,
                          class: `schedule-slot ${slot.mode}`,
                          style: slotStyle(slot),
                          title: `${capitalize(slot.mode)}: ${slot.startTime} - ${slot.endTime}`,
                        })
                      )
                    )
                  ),
                ]),
              ]),
        ]),
      ]),
    ]);
  },
});

// ─── View state ───────────────────────────────────────────────────────────────
const plans      = ref([]);
const addModalEl = ref(null);
const editModalEl= ref(null);
const slotModalEl= ref(null);
let addModal, editModal, slotModal;

const defaultForm = () => ({ name: "", description: "", min_temp: 15, attenuation_temp: 20, normal_temp: 24, comfort_temp: 28 });

const addForm  = ref(defaultForm());
const addSlots = ref(emptySlots());

const editForm  = ref(defaultForm());
const editSlots = ref(emptySlots());
const editingPlanId = ref(null);

const slotForm = ref({ mode: "minimum", startTime: "00:00", endTime: "23:59" });
const activeSlotTarget = ref("add");
// FIX #1: day is now passed by the child via the open-add-slot event
const activeSlotDay = ref(1);

onMounted(async () => {
  addModal  = new Modal(addModalEl.value);
  editModal = new Modal(editModalEl.value);
  slotModal = new Modal(slotModalEl.value, { backdrop: false });
  await loadPlans();
});

async function loadPlans() {
  plans.value = await fetchTemperaturePlans();
}

function openAdd() {
  addForm.value  = defaultForm();
  addSlots.value = emptySlots();
  initDefaultSlots(addSlots.value);
  addModal.show();
}

async function submitAdd() {
  try {
    const payload = { settings: { ...addForm.value }, plan: slotsToPayload(addSlots.value) };
    await addTempPlan(payload);
    await loadPlans();
    addModal.hide();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function openEdit(plan) {
  try {
    const data = await fetchTempPlan(plan.plan_id);
    if (!data) return;
    editingPlanId.value = plan.plan_id;
    editForm.value = {
      name: data.plan.name,
      description: data.plan.description ?? "",
      min_temp: data.plan.min_temp,
      attenuation_temp: data.plan.attenuation_temp,
      normal_temp: data.plan.normal_temp,
      comfort_temp: data.plan.comfort_temp,
    };
    editSlots.value = slotsFromApi(data.slots ?? []);
    editModal.show();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function submitEdit() {
  try {
    const payload = { settings: { ...editForm.value }, plan: slotsToPayload(editSlots.value) };
    await updateTempPlan(editingPlanId.value, payload);
    await loadPlans();
    editModal.hide();
  } catch (err) { alert(`Error: ${err.message}`); }
}

async function confirmDelete(plan) {
  if (!confirm(`Are you sure you want to delete ${plan.name}?`)) return;
  try {
    await deleteTempPlan(plan.plan_id);
    await loadPlans();
  } catch (err) { alert(`Error: ${err.message}`); }
}

// FIX #1: `day` is now received from the child's emit
function openAddSlot(target, day) {
  activeSlotTarget.value = target;
  activeSlotDay.value    = day;
  slotForm.value = { mode: "minimum", startTime: "00:00", endTime: "23:59" };
  slotModal.show();
}

function submitAddSlot() {
  const { mode, startTime, endTime } = slotForm.value;
  const resolvedEnd = endTime === "23:59" ? "24:00" : endTime;
  const target  = activeSlotTarget.value === "add" ? addSlots : editSlots;
  const dayKey  = activeSlotDay.value;
  if (!target.value[dayKey]) target.value[dayKey] = [];
  addSlotToDay(target.value[dayKey], mode, startTime, resolvedEnd);
  slotModal.hide();
}

// ─── Slot conversion helpers ──────────────────────────────────────────────────
function slotsToPayload(slots) {
  const result = [];
  for (const [dayNum, daySlots] of Object.entries(slots)) {
    for (const slot of daySlots) {
      result.push({ day: DAY_SHORT[dayNum], start_time: slot.startTime, end_time: slot.endTime, mode: slot.mode });
    }
  }
  return result;
}

function slotsFromApi(apiSlots) {
  const slots = emptySlots();
  for (const s of apiSlots) {
    const dayNum = SHORT_TO_NUM[s.day_of_week];
    if (!dayNum) continue;
    const endTime = s.end_time === "00:00" ? "24:00" : s.end_time;
    slots[dayNum].push({ mode: s.slot_type.toLowerCase(), startTime: s.start_time, endTime, slotId: s.slot_id });
  }
  for (const day of Object.values(slots)) {
    if (day.length > 0) { sortDay(day); mergeDay(day); adjustDay(day); }
    else day.push({ mode: "minimum", startTime: "00:00", endTime: "24:00", slotId: null });
  }
  return slots;
}
</script>
