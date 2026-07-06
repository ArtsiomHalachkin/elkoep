
import { fetchDevices, fetchDeviceDetails, handleDeleteDevice, updateDevice, addDevice } from "../requests/device_requests.js";


// Parses a numeric input value, preserving legitimate 0 (unlike `|| null`).
function parseNumOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = parseFloat(value);
    return Number.isNaN(n) ? null : n;
}

$(document).ready(async function () {

    // --- SELECTORS ---
    const addingSubmitBtn = document.getElementById("device-submit-btn");
    const editingSubmitBtn = document.getElementById("device-edit-submit-btn");
    const addingForm = document.getElementById("add-device-form");
    const editForm = document.getElementById("edit-device-form");
    const tableBody = document.getElementById("list-devices");


    const heatingMapping = {
        "1": "Enabled",
        "2": "Disabled - valve closed",
        "3": "Disabled - valve open"
    };

    // --- MODAL UI LOGIC  ---
    $('#modal_add_device, #modal_edit_device').on('show.bs.modal', function () {
        let $modal = $(this);
        let $deviceModel = $modal.find('[name="deviceModel"]');
        let $rfatvSettings = $modal.find('[name="rfatvSettings"]');
        let $heating = $modal.find('[name="heating"]');
        let $heatingSettings = $modal.find('[name="heatingSettings"]');
        let $freezingDetectionCheck = $modal.find('[name="freezingDetection"]');
        let $freezingDetectionDiv = $modal.find('[name="freezingDetectionDiv"]');
        let $windowDetectionCheck = $modal.find('[name="windowDetection"]');
        let $windowDetectionDiv = $modal.find('[name="windowDetectionDiv"]');

        function updateVisibility() {
            if ($deviceModel.val() === "2") { // RFATV8
                $rfatvSettings.show();
                
                if ($heating.val() === "1") { // Enabled
                    $heatingSettings.show();
                } else {
                    $heatingSettings.hide();
                }

                if ($freezingDetectionCheck.prop("checked")) {
                    $freezingDetectionDiv.show();
                } else {
                    $freezingDetectionDiv.hide();
                }

                if ($windowDetectionCheck.prop("checked")) {
                    $windowDetectionDiv.show();
                } else {
                    $windowDetectionDiv.hide();
                }

            } else { // RFTC8
                $rfatvSettings.hide();
            }
        }

        $deviceModel.off('change').on('change', updateVisibility);
        $heating.off('change').on('change', updateVisibility);
        $freezingDetectionCheck.off('change').on('change', updateVisibility);
        $windowDetectionCheck.off('change').on('change', updateVisibility);

    
        updateVisibility();
    });

    function attachEditButtonListener(editBtn, device) {
        editBtn.addEventListener("click", async () => {
            
            const detailedDevice = await fetchDeviceDetails(device.dev_eui);
            if (!detailedDevice) return;

            editForm.reset();
            editForm.setAttribute("data-original-eui", detailedDevice.dev_eui);
            editForm.dev_eui.value = detailedDevice.dev_eui;
            editForm.description.value = detailedDevice.description ?? "";
            
            const deviceType = detailedDevice.device_type === "RFTC8" ? "1" : "2";
            editForm.deviceModel.value = deviceType;

            const rfatvDiv = editForm.querySelector('[name="rfatvSettings"]');
            
            // Invert the heating map for populating the form
            const heatingMapReverse = {
                "Enabled": "1",
                "Disabled - valve closed": "2",
                "Disabled - valve open": "3",
            };

            if (detailedDevice.device_type === "RFATV8") {
                rfatvDiv.style.display = "block"; // Show section

                editForm.heating.value = heatingMapReverse[detailedDevice.heating] || "0";
                
                // Show/hide based on heating value
                const heatingSettingsDiv = editForm.querySelector('[name="heatingSettings"]');
                heatingSettingsDiv.style.display = (editForm.heating.value === "1") ? "block" : "none";

                editForm.refresh_interval.value = detailedDevice.refresh_interval ?? "";
                editForm.temperature_hysteresis.value = detailedDevice.temperature_hysteresis ?? "";

                // Freezing Detection
                const freezingDiv = editForm.querySelector('[name="freezingDetectionDiv"]');
                if (detailedDevice.freezing_temperature != null) {
                    editForm.freezingDetection.checked = true;
                    freezingDiv.style.display = "block";
                    editForm.freezing_temperature.value = detailedDevice.freezing_temperature;
                } else {
                    editForm.freezingDetection.checked = false;
                    freezingDiv.style.display = "none";
                    editForm.freezing_temperature.value = "";
                }

                // Window Detection
                const windowDiv = editForm.querySelector('[name="windowDetectionDiv"]');
                if (detailedDevice.window_sensitivity != null) {
                    editForm.windowDetection.checked = true;
                    windowDiv.style.display = "block";
                    editForm.window_sensitivity.value = detailedDevice.window_sensitivity ?? "";
                    editForm.window_time.value = detailedDevice.window_time ?? "";
                } else {
                    editForm.windowDetection.checked = false;
                    windowDiv.style.display = "none";
                    editForm.window_sensitivity.value = "";
                    editForm.window_time.value = "";
                }

            } else {
                rfatvDiv.style.display = "none";
            }
            $('#modal_edit_device').modal('show');
        });
    }

    async function populateList() {
        try {
            tableBody.innerHTML = "";
            const devices = await fetchDevices();

            devices.forEach((device, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <th class="text-start" scope="row">${index + 1}</th>
                    <td>${device.dev_eui}</td>
                    <td>${device.device_type}</td>
                    <td>${device.description ?? ""}</td>
                    <td class="text-center">
                        <input type="checkbox" class="form-check-input small align-middle mt-0" ${device.active ? "checked" : ""} disabled>
                    </td>
                    <td class="text-center">
                        <span class="icon icon-edit cursor me-2"></span>
                        <span class="icon icon-delete cursor delete-btn"></span>
                    </td>
                `;
                tableBody.appendChild(row);

                const deleteBtn = row.querySelector(".delete-btn");
                const editBtn = row.querySelector(".icon-edit");

                attachEditButtonListener(editBtn, device);
                
                deleteBtn.addEventListener("click", async () => {
                    if (confirm(`Are you sure you want to delete ${device.device_type} ${device.dev_eui}?`)) {
                        const success = await handleDeleteDevice(device.device_type, device.dev_eui);
                        if (success) {
                            await populateList(); 
                        }
                    }
                });
            });
        } catch (err) {
            console.error("Failed to load devices:", err);
        }
    }

    async function handleEditDevice(e) {
        e.preventDefault();
        const originalEui = editForm.getAttribute('data-original-eui');
        const deviceModel = editForm.deviceModel.value;
        const deviceType = deviceModel === "1" ? "RFTC8" : "RFATV8";

        const deviceData = {
            dev_eui: editForm.dev_eui.value,
            device_type: deviceType,
            description: editForm.description.value || ""
        };

        let rfatvSettings = null;
        if (deviceModel === "2") { // RFATV8
            rfatvSettings = {
                heating: heatingMapping[editForm.heating.value] || null,
                refresh_interval: parseNumOrNull(editForm.refresh_interval.value),
                temperature_hysteresis: parseNumOrNull(editForm.temperature_hysteresis.value),
                freezing_temperature: editForm.freezingDetection.checked
                    ? parseNumOrNull(editForm.freezing_temperature.value)
                    : null,
                window_sensitivity: editForm.windowDetection.checked
                    ? parseNumOrNull(editForm.window_sensitivity.value)
                    : null,
                window_time: editForm.windowDetection.checked
                    ? parseNumOrNull(editForm.window_time.value)
                    : null
            };
        }

        const payload = { device: deviceData };
        if (rfatvSettings)
            payload.rfatv8_settings = rfatvSettings;

        const success = await updateDevice(deviceType, originalEui, payload);
        
        if (success) {
            await populateList();
            editForm.reset();
            $('#modal_edit_device').modal('hide');
        }
    }

    async function handleAddDevice(e) {
        e.preventDefault();
        const deviceModel = addingForm.deviceModel.value;

        const deviceData = {
            dev_eui: addingForm.eui.value,
            device_type: deviceModel === "1" ? "RFTC8" : "RFATV8",
            description: addingForm.description.value || ""
        };

        let rfatvSettings = null;
        if (deviceModel === "2") {
            rfatvSettings = {
                heating: heatingMapping[addingForm.heating.value],
                refresh_interval: parseNumOrNull(addingForm.refresh_interval.value),
                temperature_hysteresis: parseNumOrNull(addingForm.temperature_hysteresis.value),
                freezing_temperature: addingForm.freezingDetection.checked
                    ? parseNumOrNull(addingForm.freezing_temperature.value)
                    : null,
                window_sensitivity: addingForm.windowDetection.checked
                    ? parseNumOrNull(addingForm.window_sensitivity.value)
                    : null,
                window_time: addingForm.windowDetection.checked
                    ? parseNumOrNull(addingForm.window_time.value)
                    : null
            };
        }

        const payload = { device: deviceData };
        if (rfatvSettings) payload.rfatv8_settings = rfatvSettings;
        
        const success = await addDevice(payload);

        if (success) {
            await populateList();
            addingForm.reset();
            $('#modal_add_device').modal('hide');
        }
    }

    // --- ATTACH LISTENERS & INITIALIZE ---
    addingSubmitBtn.addEventListener("click", handleAddDevice);
    editingSubmitBtn.addEventListener("click", handleEditDevice);
    
    await populateList();
});