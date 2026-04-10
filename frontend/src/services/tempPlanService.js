import { API_BASE_URL } from "./api.js";

export async function fetchTemperaturePlans() {
    const response = await fetch(`${API_BASE_URL}/temp-plan/all`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (!data.plans) throw new Error("No plans data found");
    return data.plans;
}

export async function fetchTempPlan(id) {
    const response = await fetch(`${API_BASE_URL}/temp-plan/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

export async function addTempPlan(payload) {
    const response = await fetch(`${API_BASE_URL}/temp-plan/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function updateTempPlan(plan_id, payload) {
    const response = await fetch(`${API_BASE_URL}/temp-plan/update/${plan_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function deleteTempPlan(plan_id) {
    const response = await fetch(`${API_BASE_URL}/temp-plan/delete/${plan_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return true;
}

export async function deleteTempPlanSlot(slot_id) {
    const response = await fetch(`${API_BASE_URL}/temp-plan/slot/delete/${slot_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return true;
}
