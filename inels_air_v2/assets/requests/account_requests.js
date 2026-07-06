import { API_BASE_URL } from "../js/config.js";

export async function fetchAccounts() {
        try {
            const response = await fetch(`${API_BASE_URL}/account/all`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.accounts ? data.accounts : [];

        } catch (error) {
            console.error("Failed to load accounts:", error);
            return [];
        }
    }

export async function addAccount(payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/account/add`, {
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
        console.error("Error adding account:", err);
        alert(`Error: ${err.message}`);
        return null; 
    }
}

export async function fetchAccountByUsername(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/account/username/${encodeURIComponent(username)}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Account not found");
        }
        const data = await response.json();
        return data.account;
    } catch (err) {
        console.error("Failed to fetch account:", err.message);
        alert(err.message);
        return null;
    }
}

export async function updateAccount(originalUsername, payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/account/update/${encodeURIComponent(originalUsername)}`, {
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
        console.error("Error updating account:", err);
        alert(`Error: ${err.message}`);
        return null; 
    }
}

export async function handleDeleteAccount(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/account/delete/${encodeURIComponent(username)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || result.message || "Unknown error");
        }
        return result; 
    } catch (err) {
        console.error("Error deleting account:", err);
        alert(`Error: ${err.message}`);
        return null; 
    }
}