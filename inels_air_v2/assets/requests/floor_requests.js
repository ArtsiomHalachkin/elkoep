import { API_BASE_URL } from "../js/config.js";

export async function fetchFloors() {
    try {
        const response = await fetch(`${API_BASE_URL}/floor/all`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.floors ? data.floors : [];
    } catch (error) {
        console.error("Failed to load floors:", error);
        return [];
    }
}

export async function fetchFloorRooms(floorId) {
    try {
        const response = await fetch(`${API_BASE_URL}/floor/${floorId}/rooms`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.rooms ? data.rooms : [];
    } catch (error) {
        console.error("Failed to load rooms for floor:", error);
        return [];
    }
}

export async function fetchAllRooms() {
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

export async function addFloor(payload) {
    const response = await fetch(`${API_BASE_URL}/floor/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to add floor");
    }
    return response.json();
}

export async function updateFloor(floorId, payload) {
    const response = await fetch(`${API_BASE_URL}/floor/update/${floorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to update floor");
    }
    return response.json();
}

export async function deleteFloor(floorId) {
    const response = await fetch(`${API_BASE_URL}/floor/delete/${floorId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to delete floor");
    }
    return response.json();
}

export async function fetchFloor(floorId) {
    try {
        const response = await fetch(`${API_BASE_URL}/floor/${floorId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.floor || null;
    } catch (error) {
        console.error("Failed to load floor:", error);
        return null;
    }
}