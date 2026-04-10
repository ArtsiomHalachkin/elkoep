import { API_BASE_URL } from "./api.js";

export async function fetchRooms() {
    const response = await fetch(`${API_BASE_URL}/room/all`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.rooms ?? [];
}

export async function fetchRoomDevices(room_id) {
    const response = await fetch(`${API_BASE_URL}/room/${room_id}/devices`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.devices || data || [];
}

export async function fetchRoomAccounts(room_id) {
    const response = await fetch(`${API_BASE_URL}/room/${room_id}/accounts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.accounts || data || [];
}

export async function fetchRoomTemperaturePlan(room_id) {
    const response = await fetch(`${API_BASE_URL}/room/${room_id}/temp-plan`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.plan || null;
}

export async function addRoom(payload) {
    const response = await fetch(`${API_BASE_URL}/room/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function updateRoom(room_id, payload) {
    const response = await fetch(`${API_BASE_URL}/room/update/${room_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function deleteRoom(room_id) {
    const response = await fetch(`${API_BASE_URL}/room/delete/${room_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function addRoomSetup(room_id, payload) {
    const response = await fetch(`${API_BASE_URL}/room/setup/add/${room_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Failed to save room setup");
    return result;
}

export async function removeDeviceFromRoom(roomId, devEui, deviceType) {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}/device/${deviceType}/${devEui}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

export async function removeAccountFromRoom(roomId, accountId) {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}/account/${accountId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

export async function removePlanFromRoom(roomId, planId) {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}/plan/${planId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}
