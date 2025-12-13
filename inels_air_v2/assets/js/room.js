import { API_BASE_URL } from "./config.js";
import { fetchAccounts } from "../requests/account_requests.js";
import { fetchDevices } from "../requests/device_requests.js";
import { fetchTemperaturePlans } from "../requests/temp_plan_requests.js";
import { fetchRoomAccounts, fetchRooms, fetchRoomTemperaturePlan, fetchRoomDevices, addRoomSetup,
     removeAccountFromRoom, removeDeviceFromRoom, removePlanFromRoom} from "../requests/room_requests.js";

// --- UI HELPERS (from file 1) ---
const ICONS = {
    TRASH_EMPTY: 'trash-icon-empty.svg',
    TRASH_FULL: 'trash-icon-full.svg'
};

function showAlert(message) {
    // You can replace this with a prettier modal if you want
    alert(message);
}

// Funkce pro přečíslování řádků
function renumberRows(tableContainerId) {
    const $tableContainer = $(`#${tableContainerId}`);
    if (!$tableContainer.length) {
        console.warn(`Table container #${tableContainerId} not found`);
        return;
    }

    let rowIndex = 1;
    $tableContainer.find('tbody tr').each(function () {
        $(this).find('th:first').text(rowIndex);
        rowIndex++;
    });
}
// Funkce pro kontrolu, zda je tabulka prázdná
function checkTableStatus(tableContainerId) {
    const $tableContainer = $(`#${tableContainerId}`);
    if (!$tableContainer.length) {
        console.warn(`Table container #${tableContainerId} not found`);
        return;
    }

    const $table = $tableContainer.find('table');
    // Find the empty message relative to the table container's parent
    const $emptyMessage = $tableContainer.closest('.offcanvas-body').find(`[data-empty-for="${tableContainerId}"]`);
    const rowCount = $table.find('tbody tr').length;

    if (rowCount === 0) {
        $tableContainer.hide();
        $emptyMessage.show();
    } else {
        $tableContainer.show();
        $emptyMessage.hide();
    }
}

/**
 * REFACTORED VERSION
 * Adds selected items from a modal to a target table in the offcanvas.
 * It now APPENDS items and checks for duplicates.
 */
function addItemsToTable(options) {
    const {
        addButtonId,
        modalId,
        tableContainerId,
        inputType = 'checkbox'
    } = options;

    $(`#${addButtonId}`).click(function () {
        const $tableBody = $(`#canvas_setup_room #${tableContainerId} tbody`);
        
        // Get existing IDs from the table to prevent duplicates
        const existingIds = new Set();
        $tableBody.find('tr').each(function() {
            existingIds.add($(this).find('.icon-delete').data('id').toString());
        });

        let itemIndex = $tableBody.find('tr').length + 1;

        $(`#${modalId} input[type="${inputType}"]:checked`).each(function () {
            let itemId = $(this).val();
            
            // Only add if it's not already in the table
            if (!existingIds.has(itemId)) {
                let itemName = $(this).siblings('label').text();
                
                // Extract data attributes for the delete icon
                let dataType = $(this).data('type');
                let deviceType = $(this).data('device-type') || '';

                let newRow = `
                    <tr class="align-middle">
                        <th>${itemIndex}</th>
                        <td>${itemName}</td>
                        <td class="text-end">
                           <span class="icon icon-delete cursor" 
                                 data-id="${itemId}" 
                                 data-type="${dataType}" 
                                 data-device-type="${deviceType}"></span> 
                        </td>
                    </tr>
                `;

                $tableBody.append(newRow);
                itemIndex++;
            }
        });

        $(`#${modalId}`).modal('hide');
        // Uncheck all inputs in the modal for next time
        $(`#${modalId} input[type="${inputType}"]`).prop('checked', false);
        
        checkTableStatus(tableContainerId);
    });
}


// --- MAIN DOCUMENT READY ---
$(document).ready(function () {
    
    // --- SELECTORS (from file 2) ---
    const addingSubmitBtn = document.getElementById("add-room-sibmit");
    const editingSubmitBtn = document.getElementById("edit-room-submit");
    const savingSubmitBtn = document.getElementById("room-save");
    const addingForm = document.getElementById("add-room-form");
    const editForm = document.getElementById("edit-room-form");
    const tableBody = document.getElementById("device-add-1"); // Main room list table
    const offcanvas = document.getElementById("canvas_setup_room");

    /**
     * Populates the 4 tables in the "Setup Room" offcanvas.
     */
    async function populateRoomSetupTables(room_id) {

        // Generic function to fill one of the tables
        function fillTable(tbody, items, rowGenerator, tableContainerId) {
            const tableContainer = $(`#${tableContainerId}`);
            const $emptyMessage = tableContainer.closest('.offcanvas-body').find(`[data-empty-for="${tableContainerId}"]`);

            $(tbody).empty(); // Clear existing rows

            if (!items || items.length === 0) {
                if ($emptyMessage.length) $emptyMessage.show();
                if (tableContainer.length) tableContainer.hide();
                return;
            }

            if ($emptyMessage.length) $emptyMessage.hide();
            if (tableContainer.length) tableContainer.show();

            items.forEach((item, index) => {
                const tr = document.createElement("tr");
                tr.classList.add("align-middle");

                let dataId = item.plan_id || item.dev_eui || item.account_id;
                let dataType = '';
                let deviceType = '';
                let itemName = ''; // For display
                let itemDesc = ''; // For display

                if (item.dev_eui) {
                    dataType = 'device';
                    deviceType = item.device_type; // 'RFTC8' or 'RFATV8'
                    itemName = item.dev_eui;
                    itemDesc = item.description ?? "";
                } else if (item.plan_id) {
                    dataType = 'plan';
                    itemName = item.name;
                    itemDesc = item.description ?? "";
                } else if (item.account_id) {
                    dataType = 'account';
                    itemName = item.username;
                    itemDesc = item.description ?? "";
                }

                // Use the provided row generator, but pass in the determined names/IDs
                tr.innerHTML = `
                    <th>${index + 1}</th>
                    ${rowGenerator(item, itemName, itemDesc)}
                    <td class="text-end">
                         <span class="icon icon-delete cursor delete-btn" 
                               data-id="${dataId}" 
                               data-type="${dataType}"
                               data-device-type="${deviceType}">
                         </span>
                    </td>`;

                $(tbody).append(tr);

                const deleteIcon = tr.querySelector(".delete-btn");
                deleteIcon.addEventListener("click", async () => {
                    await handleDeleteRoomItem(tr, dataId, dataType, deviceType);
                });
            });
        }

        // --- 1. Fetch and Fill Devices (Thermostats + Valves) ---
        const devices = await fetchRoomDevices(room_id) || [];
        const thermostats = devices.filter(d => d.device_type === "RFTC8");
        const valves = devices.filter(d => d.device_type === "RFATV8");

        fillTable(
            $("#room-thermostat-list"), 
            thermostats, 
            (item, name, desc) => `<td>${name}</td><td>${desc}</td>`, 
            "thermostat-table-container"
        );
        fillTable(
            $("#room-valves-list"), 
            valves, 
            (item, name, desc) => `<td>${name}</td><td>${desc}</td>`, 
            "valve-table-container"
        );

        // --- 2. Fetch and Fill Plan ---
        const plan = await fetchRoomTemperaturePlan(room_id);
        fillTable(
            $("#room-plan-list"), 
            plan ? [plan] : [], 
            (item, name, desc) => `<td>${name}</td><td>${desc}</td>`, 
            "plan-table-container"
        );

        // --- 3. Fetch and Fill Accounts ---
        const accounts = await fetchRoomAccounts(room_id) || [];
        fillTable(
            $("#room-accounts-list"), 
            accounts, 
            (item, name, desc) => `<td>${name}</td><td>${desc}</td><td>${item.enable ? "Enabled" : "Disabled"}</td>`, 
            "linkedAccounts-table-container"
        );
    }

    /**
     * Handles the API call to delete an item from the "Setup Room" offcanvas.
     */
    async function handleDeleteRoomItem(rowElement, dataId, dataType, deviceType) {
        const roomId = offcanvas.getAttribute("data-room-room_id");
        if (!confirm("Are you sure you want to remove this item from the room?")) return;

        let response;
        try {
            switch (dataType) {
                case 'device':
                    response = await removeDeviceFromRoom(roomId, dataId, deviceType);
                    break;
                case 'account':
                    response = await removeAccountFromRoom(roomId, dataId);
                    break;
                case 'plan':
                    response = await removePlanFromRoom(roomId, dataId);
                    break;
                default:
                    throw new Error(`Unknown type: ${dataType}`);
            }

            if (response.ok) {
                console.log("Item removed from DB");
                // Now remove from DOM
                const $row = $(rowElement);
                const $tableContainer = $row.closest('.table-responsive');
                const tableContainerId = $tableContainer.attr('id');
                
                $row.remove();
                renumberRows(tableContainerId);
                checkTableStatus(tableContainerId);

            } else {
                const errorData = await response.json();
                showAlert(`Error: ${errorData.message || errorData.detail}`);
            }
        } catch (err) {
            console.error("Failed to delete item:", err);
            showAlert("An unexpected error occurred.");
        }
    }

    /**
     * Populates the "Add Account" modal with all available accounts.
     */
    async function populateLinkedAccountsForm() {
        const accounts = await fetchAccounts();
        const container = document.getElementById("account-container");
        container.innerHTML = "";
        accounts.forEach(acc => {
            const div = document.createElement("div");
            div.classList.add("form-check");
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" id="account-${acc.account_id}" value="${acc.account_id}" data-type="account">
                <label class="form-check-label" for="account-${acc.account_id}">${acc.username}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Populates the "Add Thermostat" modal with available thermostats.
     */
    async function populateLinkedThermostatForm() {
        const devices = await fetchDevices();
        const container = document.getElementById("thermostat-container");
        container.innerHTML = "";
        const thermostats = devices.filter(device => device.device_type === "RFTC8");

        thermostats.forEach(device => {
            const div = document.createElement("div");
            div.classList.add("form-check");
            div.innerHTML = `
                <input class="form-check-input" type="radio" name="thermostat" id="thermostat-${device.dev_eui}" value="${device.dev_eui}" data-type="device" data-device-type="RFTC8">
                <label class="form-check-label" for="thermostat-${device.dev_eui}">${device.dev_eui} – ${device.description ?? "No description"}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Populates the "Add Valve" modal with available valves.
     */
    async function populateLinkedValveForm() {
        const devices = await fetchDevices();
        const container = document.getElementById("valve-container");
        container.innerHTML = "";
        const valves = devices.filter(device => device.device_type === "RFATV8");

        valves.forEach(device => {
            const div = document.createElement("div");
            div.classList.add("form-check");
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" id="valve-${device.dev_eui}" value="${device.dev_eui}" data-type="device" data-device-type="RFATV8">
                <label class="form-check-label" for="valve-${device.dev_eui}">${device.dev_eui} – ${device.description ?? "No description"}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Populates the "Add Plan" modal with available plans.
     */
    async function populateLinkedPlansForm() {
        const plans = await fetchTemperaturePlans();
        const container = document.getElementById("plan-container");
        container.innerHTML = "";

        plans.forEach(plan => {
            const div = document.createElement("div");
            div.classList.add("form-check");
            div.innerHTML = `
                <input class="form-check-input" type="radio" name="plan" id="plan-${plan.plan_id}" value="${plan.plan_id}" data-type="plan">
                <label class="form-check-label" for="plan-${plan.plan_id}">${plan.name} – ${plan.description ?? "No description"}</label>
            `;
            container.appendChild(div);
        });
    }

    /**
     * Attaches listener to the "Setup" button on a room row.
     */
    function attachAddButtonListener(addBtn, room_id) {
        addBtn.addEventListener("click", () => {
            offcanvas.setAttribute("data-room-room_id", room_id);
        });
    }

    /**
     * Attaches listener to the "Edit" button on a room row.
     */
    function attachEditButtonListener(editBtn, room_id) {
        editBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/room/details/${room_id}`);
                if (!response.ok) throw new Error("Failed to fetch room");
                const data = await response.json();
                const room = data.room;

                editForm.reset();
                editForm.setAttribute("data-room-room_id", room_id);
                editForm.name.value = room.name ?? "";
                editForm.description.value = room.description ?? "";

                // Note: We are using jQuery to find and show the modal
                $('#modal_edit_room').modal('show');

            } catch (err) {
                console.error("Error loading room details:", err);
                showAlert("Failed to load room details.");
            }
        });
    }

    /**
     * Saves the complete room setup from the offcanvas.
     */
    async function handleSaveRoom() {
        const room_id = offcanvas.getAttribute("data-room-room_id");

        const selectedAccounts = Array.from(
            document.querySelectorAll("#room-accounts-list .icon-delete[data-id]")
        ).map(span => parseInt(span.dataset.id)); // account_id is an integer

        const planSpan = document.querySelector("#room-plan-list .icon-delete[data-id]");
        const selectedPlan = planSpan ? parseInt(planSpan.dataset.id) : null; // plan_id is an integer

        const thermostatSpan = document.querySelector("#room-thermostat-list .icon-delete[data-id]");
        const selectedThermostat = thermostatSpan ? thermostatSpan.dataset.id : null; // dev_eui is a string

        const selectedValves = Array.from(
            document.querySelectorAll("#room-valves-list .icon-delete[data-id]")
        ).map(span => span.dataset.id); // dev_eui is a string

        const payload = {
            account_id: selectedAccounts,
            plan_id: selectedPlan,
            rftc8_dev_eui: selectedThermostat || null,
            rfatv8_dev_eui: selectedValves
        };

        console.log("Saving room setup:", payload);
        await addRoomSetup(room_id, payload);
        
        // Hide the offcanvas using Bootstrap's JS instance
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
    }

    /**
     * Handles adding a new room.
     */
    async function handleAddRoom(e) {
        e.preventDefault();
        const payload = {
            name: addingForm.name.value,
            description: addingForm.description.value,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/room/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok) {
                await populateRoomList();
                addingForm.reset();
                $('#modal_add_room').modal('hide');
            } else {
                showAlert(`Error: ${result.message || result.detail}`);
            }
        } catch (err) {
            console.error(err);
            showAlert("An unexpected error occurred.");
        }
    }
    
    /**
     * Handles deleting a room.
     */
    async function handleDeleteRoom(room_id) {
        try {
            const response = await fetch(`${API_BASE_URL}/room/delete/${room_id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            const result = await response.json();
            if (response.ok) {
                await populateRoomList();
            } else {
                showAlert(`Error: ${result.detail || result.message}`);
            }
        } catch (err) {
            console.error(err);
            showAlert("An unexpected error occurred.");
        }
    }

    /**
     * Populates the main list of all rooms on the page.
     */
    async function populateRoomList() {
        try {
            $(tableBody).empty(); // Use jQuery empty
            const rooms = await fetchRooms();

            rooms.forEach((room, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <th class="text-start" scope="row">${index + 1}</th>
                    <td>${room.name}</td>
                    <td>${room.description ?? ""}</td>
                    <td class="text-center"><span class="icon icon-on"></span></td>
                    <td class="text-center">
                        <span class="icon icon-play cursor me-2" data-bs-toggle="modal" data-bs-target="#modal_control_room"></span>
                        <span class="icon icon-add cursor me-2" data-bs-toggle="offcanvas" data-bs-target="#canvas_setup_room" aria-controls="canvas_add_device"></span>
                        <span class="icon icon-edit cursor me-2"></span>
                        <span class="icon icon-delete cursor"></span>
                    </td>
                `;
                $(tableBody).append(row);

                const deleteBtn = row.querySelector(".icon-delete");
                const editBtn = row.querySelector(".icon-edit");
                const addBtn = row.querySelector(".icon-add");

                attachAddButtonListener(addBtn, room.room_id);
                attachEditButtonListener(editBtn, room.room_id);

                deleteBtn.addEventListener("click", async () => {
                    if (confirm(`Are you sure you want to delete ${room.name}?`)) {
                        await handleDeleteRoom(room.room_id);
                    }
                });
            });
        } catch (err) {
            console.error("Failed to load rooms:", err);
        }
    }

    /**
     * Handles editing an existing room.
     */
    async function handleEditRoom(e) {
        e.preventDefault();
        const room_id = editForm.getAttribute('data-room-room_id');
        const payload = {
            name: editForm.name.value,
            description: editForm.description.value,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/room/update/${room_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok) {
                await populateRoomList();
                editForm.reset();
                $('#modal_edit_room').modal('hide');
            } else {
                showAlert(`Error: ${result.detail || result.message}`);
            }
        } catch (err) {
            console.error(err);
            showAlert("An unexpected error occurred.");
        }
    }

    // --- INITIALIZE ALL LISTENERS AND LOAD DATA ---

    // Init listeners from file 1
    addItemsToTable({
        addButtonId: 'add-thermostat-to-room',
        modalId: 'modal_add_thermostat',
        tableContainerId: 'thermostat-table-container',
        inputType: 'radio'
    });
    addItemsToTable({
        addButtonId: 'add-valve-to-room',
        modalId: 'modal_add_valve',
        tableContainerId: 'valve-table-container'
    });
    addItemsToTable({
        addButtonId: 'add-plan-to-room',
        modalId: 'modal_add_plan',
        tableContainerId: 'plan-table-container',
        inputType: 'radio'
    });
    addItemsToTable({
        addButtonId: 'add-link-account-to-room',
        modalId: 'modal_add_link_account',
        tableContainerId: 'linkedAccounts-table-container'
    });


    $(document).on('click', '#canvas_setup_room .icon-delete', function () {
        const $row = $(this).closest('tr');
        
        if (!$row.find('.icon-delete').data('type')) {
            const tableId = $row.closest('.table-responsive').attr('id');
            $row.remove();
            renumberRows(tableId);
            checkTableStatus(tableId);
        }
    });

    // Check table status on initial load
    checkTableStatus('thermostat-table-container');
    checkTableStatus('valve-table-container');
    checkTableStatus('plan-table-container');
    checkTableStatus('linkedAccounts-table-container');
    

    offcanvas.addEventListener("shown.bs.offcanvas", async () => {
        const room_id = offcanvas.getAttribute("data-room-room_id");
        if (!room_id) return;
        
        // Populate all room setup tables and forms
        await populateRoomSetupTables(room_id);
        await populateLinkedAccountsForm();
        await populateLinkedThermostatForm();
        await populateLinkedValveForm();
        await populateLinkedPlansForm();
    });
    
    editingSubmitBtn.addEventListener("click", handleEditRoom);
    addingSubmitBtn.addEventListener("click", handleAddRoom);
    savingSubmitBtn.addEventListener("click", handleSaveRoom);

    // --- Load Initial Room List ---
    populateRoomList();
});