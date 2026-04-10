<template>
  <AppLayout title="App accounts">
    <div class="card header-color" style="margin-bottom: 24px">
      <h4 class="text-center header">List of app accounts</h4>
      <div class="card-body card-color">
        <div class="table-responsive text-nowrap">
          <table class="table">
            <thead>
              <tr>
                <th class="text-start">#</th>
                <th>Username</th>
                <th>Password</th>
                <th>Description</th>
                <th class="text-center">Enabled</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(account, index) in accounts" :key="account.username">
                <th class="text-start">{{ index + 1 }}</th>
                <td>{{ account.username }}</td>
                <td>{{ account.password }}</td>
                <td>{{ account.description ?? "" }}</td>
                <td class="text-center">
                  <input type="checkbox" class="form-check-input small align-middle mt-0" :checked="account.enable" disabled />
                </td>
                <td class="text-center">
                  <span class="icon icon-edit cursor me-2" @click="openEdit(account)"></span>
                  <span class="icon icon-delete cursor" @click="confirmDelete(account)"></span>
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
                <h4 class="modal-title">Add account</h4>
                <button class="btn-close" type="button" @click="addModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <div class="row">
                    <div class="col">
                      <label class="form-label">Username:</label>
                      <input class="form-control" type="text" v-model="addForm.username" />
                    </div>
                    <div class="col">
                      <label class="form-label">Password:</label>
                      <input class="form-control" type="text" v-model="addForm.password" />
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description:</label>
                  <input class="form-control" type="text" v-model="addForm.description" />
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="add-enable" v-model="addForm.enable" />
                  <label class="form-check-label" for="add-enable">Enable</label>
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
                <h4 class="modal-title">Edit account</h4>
                <button class="btn-close" type="button" @click="editModal.hide()"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <div class="row">
                    <div class="col">
                      <label class="form-label">Username:</label>
                      <input class="form-control" type="text" v-model="editForm.username" />
                    </div>
                    <div class="col">
                      <label class="form-label">Password:</label>
                      <input class="form-control" type="text" v-model="editForm.password" />
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description:</label>
                  <input class="form-control" type="text" v-model="editForm.description" />
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="edit-enable" v-model="editForm.enable" />
                  <label class="form-check-label" for="edit-enable">Enable</label>
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
import {
  fetchAccounts,
  fetchAccountByUsername,
  addAccount,
  updateAccount,
  deleteAccount,
} from "@/services/accountService.js";

const accounts = ref([]);

const addModalEl = ref(null);
const editModalEl = ref(null);
let addModal, editModal;

const addForm = ref({ username: "", password: "", description: "", enable: false });
const editForm = ref({ username: "", password: "", description: "", enable: false });
const editingUsername = ref("");

onMounted(async () => {
  addModal = new Modal(addModalEl.value);
  editModal = new Modal(editModalEl.value);
  await loadAccounts();
});

async function loadAccounts() {
  accounts.value = await fetchAccounts();
}

function openAdd() {
  addForm.value = { username: "", password: "", description: "", enable: false };
  addModal.show();
}

async function submitAdd() {
  try {
    await addAccount(addForm.value);
    await loadAccounts();
    addModal.hide();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function openEdit(account) {
  try {
    const data = await fetchAccountByUsername(account.username);
    if (!data) return;
    editingUsername.value = data.username;
    editForm.value = {
      username: data.username,
      password: data.password,
      description: data.description ?? "",
      enable: data.enable,
    };
    editModal.show();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function submitEdit() {
  try {
    await updateAccount(editingUsername.value, editForm.value);
    await loadAccounts();
    editModal.hide();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function confirmDelete(account) {
  if (!confirm(`Are you sure you want to delete ${account.username}?`)) return;
  try {
    await deleteAccount(account.username);
    await loadAccounts();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
</script>
