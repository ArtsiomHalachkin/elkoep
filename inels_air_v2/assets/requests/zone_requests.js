import { API_BASE_URL } from "../js/config.js";

export async function fetchZones() {
    try {
        const response = await fetch(`${API_BASE_URL}/zone/all`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.zones ? data.zones : [];
    } catch (error) {
        console.error("Failed to load zones:", error);
        return [];
    }
}

export async function fetchZone(zoneId) {
    try {
        const response = await fetch(`${API_BASE_URL}/zone/${zoneId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.zone || null;
    }
    catch (error) {
        console.error("Failed to load zone:", error);
        return null;
    }
}

export async function addZone(payload) {
    const response = await fetch(`${API_BASE_URL}/zone/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to add zone");
    }
    return response.json();
}

export async function updateZone(zoneId, payload) {
    const response = await fetch(`${API_BASE_URL}/zone/update/${zoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to update zone");
    }  
    return response.json();
}

export async function deleteZone(zoneId) {
    const response = await fetch(`${API_BASE_URL}/zone/delete/${zoneId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to delete zone");
    }
    return response.json();
}