import { API_BASE_URL } from "../js/config.js";


export async function fetchTemperaturePlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/all`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.plans) {
            throw new Error("No plans data found");
        }

        return data.plans; 

    } catch (error) {
        console.error("Failed to load temperature plans:", error);
        return []; 
    }
}


export async function fetchTempPlan(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("Failed to fetch temp plan:", err.message || err.detail);
        alert("Failed to load plan details.");
        return null;
    }
}


export async function handleDeleteOfTempPlanSlot(slot_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/slot/delete/${slot_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Delete failed:', errText);
            alert('Failed to delete slot.');
            return false;
        }
        console.log(`Slot ${slot_id} deleted successfully.`);
        return true;

    } catch (err) {
        console.error('Error deleting slot:', err);
        alert('An error occurred while deleting the slot.');
        return false; 
    }
}


export async function handleDeleteTempPlan(plan_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/delete/${plan_id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            const errText = await response.text();
            alert('Slot was not delete.');
            return false; 
        }
        return true; 
    } catch (err) {
        console.error(err);
        alert("An unexpected error.");
    }
}

export async function addTempPlan(payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (response.ok) {
            return result; 
        } else {
            alert(`Error: ${result.message || result.detail}`);
            return null; 
        }
    } catch (err) {
        console.error(err);
        alert("An unexpected error.");
        return null; 
    }
}

export async function updateTempPlan(plan_id, payload) {
     try {
        const response = await fetch(`${API_BASE_URL}/temp-plan/update/${plan_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (response.ok) {
            return result; 
        } else {
            alert(`Error: ${result.message || result.detail}`);
            return null; 
        }
    } catch (err) {
        console.error(err);
        alert("An unexpected error.");
        return null; 
    }
}