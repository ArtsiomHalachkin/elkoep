import { API_BASE_URL } from "../js/config.js";

export async function fetchRooms() {
    try {
        const response = await fetch(`${API_BASE_URL}/room/all`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.rooms ? data.rooms : [];
    } catch (error) {
        console.error("Failed to load rooms:", error);
        return [];
    }
}


export async function fetchRoomAccounts(room_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/room/${room_id}/accounts`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
       return data.accounts || data || [];
    } catch (error) {
        console.error("Failed to load room accounts:", error);
        return [];
    }
}

export async function fetchTemperaturePlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/all`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.plans ? data.plans : [];
    } catch (error) {
        console.error("Failed to load temperature plans:", error);
        return [];
    }
}

export async function fetchRoomTemperaturePlan(room_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/room/${room_id}/temp-plan`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.plan || null;
    } catch (error) {
        console.error("Failed to load room temperature plan:", error);
        return null;
    }
}

export async function fetchRoomDevices(room_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/room/${room_id}/devices`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.devices || data || [];
    } catch (error) {
        console.error("Failed to load devices:", error);
        return [];
    }
}

export async function addRoomSetup(room_id, payload) {
    try {

        const response = await fetch(`${API_BASE_URL}/room/setup/add/${room_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });


        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to save room setup");
        }

        const data = await response.json();
        console.log("Room setup success:", data.message);
        alert("Room setup saved successfully!");
    } catch (err) {
        console.error("Error saving room setup:", err);
        alert("Error saving room setup: " + err.message);
    }

}

async function safeDelete(url) {
    try {
        return await fetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("Network error during DELETE:", err);
        return new Response(
            JSON.stringify({ detail: "Network error" }),
            { status: 0, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function removeDeviceFromRoom(roomId, devEui, deviceType) {
    return safeDelete(`${API_BASE_URL}/room/${roomId}/device/${deviceType}/${devEui}`);
}

export async function removeAccountFromRoom(roomId, accountId) {
    return safeDelete(`${API_BASE_URL}/room/${roomId}/account/${accountId}`);
}

export async function removePlanFromRoom(roomId, planId) {
    return safeDelete(`${API_BASE_URL}/room/${roomId}/plan/${planId}`);
}

