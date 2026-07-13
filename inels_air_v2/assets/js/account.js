import { API_BASE_URL } from "./config.js";
import { fetchAccounts, handleDeleteAccount, addAccount, updateAccount } from "../requests/account_requests.js";



document.addEventListener("DOMContentLoaded", async () => {

    // Buttons
    const addingSubmitBtn = document.getElementById("submit-btn");
    const editingSubmitBtn = document.getElementById("edit-submit-btn");
    // Forms
    const addingForm = document.getElementById("add-account-form");
    const editForm = document.getElementById("edit-account-form");
    // Table body
    const tableBody = document.getElementById("list-accounts");



    async function handleAddAccount() {
        const payload = {
            username: addingForm.username.value,
            password: addingForm.password.value,
            description: addingForm.description.value,
            enable: addingForm.enable.checked 
        };
        const success = await addAccount(payload); 

        if (success) {
            await populateList();
            addingForm.reset();
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modal_add_account"));
            modal.hide();
        }

    }

    async function attachEditButtonListener(editBtn, username) {
        editBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/account/username/${encodeURIComponent(username)}`);
                if (!response.ok) throw new Error("Failed to fetch account");
                const data = await response.json();
                const account = data.account;

                console.log("Editing account:", account);

                editForm.reset();
                editForm.setAttribute("data-original-username", account.username);
                editForm.username.value = account.username;
                editForm.password.value = account.password;
                editForm.description.value = account.description ?? "";
                editForm.enable.checked = Boolean(Number(account.enable));

                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modal_edit_account"));
                modal.show();
            } catch (err) {
                console.error("Error loading account details:", err);
                alert("Failed to load account details.");
            }
        });
    }

    async function populateList() {
        try {
            tableBody.innerHTML = "";
            const accounts = await fetchAccounts() 

            accounts.forEach((account, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <th class="text-start" scope="row">${index + 1}</th>
                    <td>${account.username}</td>
                    <td>${account.password}</td>
                    <td>${account.description ?? ""}</td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input small align-middle mt-0" ${account.enable ? "checked" : ""} disabled>
                    </td>
                    <td class="text-center">
                        <span class="icon icon-edit cursor me-2" data-bs-toggle="modal" data-bs-target="#modal_edit_account"></span>
                        <span class="icon icon-delete cursor delete-btn"></span>
                    </td>
                `;

                
                tableBody.appendChild(row);

                const deleteBtn = row.querySelector(".delete-btn");
                const editBtn = row.querySelector(".icon-edit");

                attachEditButtonListener(editBtn, account.username);

                deleteBtn.addEventListener("click", async () => {
                    if (await confirmDelete(`Are you sure you want to delete ${account.username}?`)) {
                       const success = await handleDeleteAccount(account.username);
                        if (success) {
                            await populateList(); 
                        }
                    }
                });

            });

        } catch (err) {
            console.error("Failed to load accounts:", err);
        }
    }

    async function handleEditAccount() {
        const originalUsername = editForm.getAttribute('data-original-username');
        const payload = {
            username: editForm.username.value,
            password: editForm.password.value,
            description: editForm.description.value,
            enable: editForm.enable.checked
        };

        
        const success = await updateAccount(originalUsername, payload);

        if (success) {
            await populateList();
            editForm.reset();
            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("modal_edit_account"));
            modal.hide();
        }


    }



    editingSubmitBtn.addEventListener("click", handleEditAccount);
    addingSubmitBtn.addEventListener("click", handleAddAccount);
    populateList();


});
