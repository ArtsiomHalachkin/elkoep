import { API_BASE_URL } from "./api.js";

export async function fetchAccounts() {
    const response = await fetch(`${API_BASE_URL}/account/all`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.accounts ?? [];
}

export async function fetchAccountByUsername(username) {
    const response = await fetch(`${API_BASE_URL}/account/username/${encodeURIComponent(username)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Account not found");
    return data.account;
}

export async function addAccount(payload) {
    const response = await fetch(`${API_BASE_URL}/account/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function updateAccount(originalUsername, payload) {
    const response = await fetch(`${API_BASE_URL}/account/update/${encodeURIComponent(originalUsername)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}

export async function deleteAccount(username) {
    const response = await fetch(`${API_BASE_URL}/account/delete/${encodeURIComponent(username)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || result.message || "Unknown error");
    return result;
}
