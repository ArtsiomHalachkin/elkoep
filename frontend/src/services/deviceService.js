import { API_BASE_URL } from "./api.js";

export async function fetchDevices() {
    const response = await fetch(`${API_BASE_URL}/device/all`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data.devices) throw new Error("No device data found");
    return data.devices;
}

export async function fetchDeviceDetails(devEUI) {
    const response = await fetch(`${API_BASE_URL}/device/eui/${devEUI}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    return data.device;
}

export async function addDevice(payload) {
    const response = await fetch(`${API_BASE_URL}/device/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function updateDevice(device_type, origin_eui, payload) {
    const response = await fetch(`${API_BASE_URL}/device/update/${device_type}/${origin_eui}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function deleteDevice(deviceType, devEui) {
    const response = await fetch(`${API_BASE_URL}/device/delete/${deviceType}/${devEui}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}
