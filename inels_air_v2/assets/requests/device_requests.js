import { API_BASE_URL } from "../js/config.js";

export async function fetchDevices() {
    try {
        const response = await fetch(`${API_BASE_URL}/device/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.devices) {
            throw new Error("No device data found");
        }

        return data.devices;
    } catch (error) {
        console.error("Failed to fetch devices:", error);
        alert("An unexpected error occurred.");
        return []; 
    }
}

   export async function fetchDeviceDetails(devEUI) {
        try {
            const response = await fetch(`${API_BASE_URL}/device/eui/${devEUI}`);
            if (!response.ok) 
                throw new Error(`HTTP error ${response.status}`);

            const data = await response.json();
            return data.device;
        } catch (err) {
            console.error("Failed to fetch device details:", err);
            alert("An unexpected error occurred.");
            return null;
        }
    }

    export async function handleDeleteDevice(deviceType, devEui) {
        try {
            const response = await fetch(`${API_BASE_URL}/device/delete/${deviceType}/${devEui}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();

            if (response.ok) {
                return result
            }

        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
            return null
        }
    }

    export async function updateDevice(device_type, origin_eui, payload) {
        try {
            const response = await fetch(`${API_BASE_URL}/device/update/${device_type}/${origin_eui}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || result.message || "Unknown error");
            }
            return result;
        } catch (err) {
            console.error(err);
            alert(`Error updating device: ${err.message}`);
            return null;
        }
    }

    
    export async function addDevice(payload) {
        try {
            const response = await fetch(`${API_BASE_URL}/device/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || result.message || "Unknown error");
            }
            return result;
        } catch (err) {
            console.error(err);
            alert(`Error adding device: ${err.message}`);
            return null; 
        }
    }