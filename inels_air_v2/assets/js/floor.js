import {
    fetchFloors,
    fetchFloorRooms,
    fetchAllRooms,
    addFloor,
    updateFloor,
    deleteFloor,
} from "../requests/floor_requests.js?v=20260713a";


const floorId = (f) => f.floor_id ?? f.id ?? f.fid;
const floorName = (f) => f.name ?? f.fname ?? "";
const floorLevel = (f) => f.level ?? f.flevel ?? "";
const roomsCountAtFloor = (f) => f.rooms_count ?? f.room_count ?? 0;
const roomId = (r) => r.room_id ?? r.rid ?? r.id;
const roomName = (r) => r.room_name ?? r.name ?? r.rname ?? "";
const roomDesc = (r) => r.room_description ?? r.description ?? r.rdescription ?? "";

let floorsCache = [];

const $ = (sel) => document.querySelector(sel);

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[ch]));
}

function renderFloorsTable(floors) {
    const tbody = $("#list-floors");
    if (!tbody) return;

    if (!floors.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No floors</td></tr>`;
        return;
    }

    tbody.innerHTML = floors
        .map((f, idx) => {
            const id = floorId(f);
            return `
            <tr data-floor-id="${escapeHtml(id)}">
                <td>${idx + 1}</td>
                <td>${escapeHtml(floorName(f)) || "-"}</td>
                <td>${escapeHtml(floorLevel(f))}</td>
                <td>${escapeHtml(roomsCountAtFloor(f))}</td>
                <td class="text-nowrap text-center">
                    <span class="icon icon-edit cursor me-2" data-action="edit-floor" data-floor-id="${escapeHtml(id)}"
                        data-bs-toggle="modal" data-bs-target="#modal_edit_floor"></span>
                    <span class="icon icon-delete cursor" data-action="delete-floor" data-floor-id="${escapeHtml(id)}"></span>
                </td>
            </tr>`;
        })
        .join("");
}

function roomPanelHtml(r) {
    return `
                <div class="room-panel" data-room-id="${escapeHtml(roomId(r))}">
                    <div class="card room-card-simple h-100">
                        <div class="card-body">
                            <h5 class="room-name mb-1">${escapeHtml(roomName(r)) || "-"}</h5>
                            <p class="room-desc text-muted small mb-0">${escapeHtml(roomDesc(r)) || ""}</p>
                        </div>
                    </div>
                </div>`;
}


async function renderRooms() {
    const content = $("#floorTabContent");
    if (!content) return;

    const rooms = await fetchAllRooms();
    if (!rooms.length) {
        content.innerHTML = `<div class="text-center text-muted py-4">No rooms to display</div>`;
        return;
    }

    content.innerHTML = `<div class="rooms-grid">${rooms.map(roomPanelHtml).join("")}</div>`;
}

async function reload() {
    floorsCache = await fetchFloors();
    renderFloorsTable(floorsCache);
    await renderRooms();
}

function readForm(form) {
    const level = form.querySelector('[name="floor-level"]').value;
    return {
        name: form.querySelector('[name="floor-name"]').value.trim(),
        level: level === "" ? 0 : Number(level),
    };
}

function wireAddModal() {
    const form = $("#add-floor-form");
    const submit = $("#add-floor-submit");
    if (!form || !submit) return;

    submit.addEventListener("click", async () => {
        const payload = readForm(form);
        if (!payload.name) {
            alert("Floor name is required");
            return;
        }
        try {
            await addFloor(payload);
            form.reset();
            bootstrap.Modal.getInstance($("#modal_add_floor"))?.hide();
            await reload();
        } catch (err) {
            alert(err.message);
        }
    });
}

function renderFloorRoomsList(rooms) {
    const tbody = $("#floor-rooms-list");
    const empty = $("#floor-rooms-empty");
    const container = $("#floor-rooms-table-container");
    if (!tbody) return;

    if (!rooms.length) {
        tbody.innerHTML = "";
        if (empty) empty.style.display = "";
        if (container) container.style.display = "none";
        return;
    }

    if (empty) empty.style.display = "none";
    if (container) container.style.display = "";
    tbody.innerHTML = rooms
        .map(
            (r, idx) => `
            <tr data-room-id="${escapeHtml(roomId(r))}">
                <td>${idx + 1}</td>
                <td>${escapeHtml(roomName(r)) || "-"}</td>
                <td>${escapeHtml(roomDesc(r)) || ""}</td>
            </tr>`
        )
        .join("");
}

function wireEditModal() {
    const panel = $("#modal_edit_floor");
    const form = $("#edit-floor-form");
    const submit = $("#edit-floor-submit");
    const title = $("#edit-floor-title");
    if (!panel || !form || !submit) return;


    document.addEventListener("click", async (e) => {
        const trigger = e.target.closest('[data-action="edit-floor"]');
        if (!trigger) return;
        const f = floorsCache.find((x) => String(floorId(x)) === String(trigger.dataset.floorId));
        if (!f) return;
        form.querySelector('[name="floor-id"]').value = floorId(f);
        form.querySelector('[name="floor-name"]').value = floorName(f);
        form.querySelector('[name="floor-level"]').value = floorLevel(f);
        if (title) title.textContent = `${floorName(f) || "Floor"} setup`;

        const tbody = $("#floor-rooms-list");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Loading rooms…</td></tr>`;
        }
        try {
            const rooms = await fetchFloorRooms(floorId(f));
            renderFloorRoomsList(rooms);
        } catch {
            renderFloorRoomsList([]);
        }
    });

    submit.addEventListener("click", async () => {
        const id = form.querySelector('[name="floor-id"]').value;
        const payload = readForm(form);
        if (!payload.name) {
            alert("Floor name is required");
            return;
        }
        try {
            await updateFloor(id, payload);
            bootstrap.Modal.getInstance(panel)?.hide();
            await reload();
        } catch (err) {
            alert(err.message);
        }
    });
}

function wireDeleteModal() {
    // Uses the shared confirmation modal (window.confirmDelete) like every other delete.
    document.addEventListener("click", async (e) => {
        const trigger = e.target.closest('[data-action="delete-floor"]');
        if (!trigger) return;
        const id = trigger.dataset.floorId;
        if (id == null) return;

        const f = floorsCache.find((x) => String(floorId(x)) === String(id));
        const name = f ? floorName(f) : "";
        if (!(await confirmDelete(name ? `Are you sure you want to delete ${name}?` : "Are you sure?"))) return;

        try {
            await deleteFloor(id);
            await reload();
        } catch (err) {
            alert(err.message);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    wireAddModal();
    wireEditModal();
    wireDeleteModal();
    await reload();
});
