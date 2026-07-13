import { API_BASE_URL } from "./config.js";
import { fetchTemperaturePlans, fetchTempPlan, handleDeleteOfTempPlanSlot, handleDeleteTempPlan, addTempPlan, updateTempPlan} from "../requests/temp_plan_requests.js";


function handleModalTransition(buttonName, mainModalId, secondaryModalId) {
    $(`[name='${buttonName}']`).click(function () {
        $(mainModalId).css('z-index', '1');
        $(secondaryModalId).modal({ backdrop: false, keyboard: false });
        $(secondaryModalId).modal('show');
    });

    // Při zavření sekundárního modalu obnovíme z-index a fokus hlavního modalu
    $(secondaryModalId).on('hidden.bs.modal', function () {
        $(mainModalId).css('z-index', '1055');
        $(mainModalId).focus();
    });
}

/**
 * Converts "HH:MM" string to total minutes.
 */
function convertTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    let parts = timeStr.split(':');
    if (parts.length !== 2) return 0;

    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    
    // Handle "24:00" as 1440 minutes
    if (hours === 24 && minutes === 0) {
        return 1440;
    }
    
    return (hours * 60) + minutes;
}

/**
 * Converts total minutes to "HH:MM" string.
 */
function formatTime(minutes) {
    if (minutes === 1440) {
        return '24:00';
    }

    let hrs = Math.floor(minutes / 60) % 24;
    let mins = minutes % 60;
    
    return ('0' + hrs).slice(-2) + ':' + ('0' + mins).slice(-2);
}


/**
 * Capitalizes the first letter of a string.
 */
function capitalizeFirstLetter(string) {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Map day IDs to numbers
 */
function getDayNumber(dayId) {
    let dayMap = {
        'add-Mon': '1', 'add-Tue': '2', 'add-Wed': '3',
        'add-Thu': '4', 'add-Fri': '5', 'add-Sat': '6', 'add-Sun': '7'
    };
    return dayMap[dayId] || null;
}

/**
 * Get day name from day number
 */
function getDayName(dayNumber) {
    let dayNames = {
        '1': 'monday', '2': 'tuesday', '3': 'wednesday',
        '4': 'thursday', '5': 'friday', '6': 'saturday', '7': 'sunday'
    };
    return dayNames[dayNumber] || null;
}

/**
 * Get day number from short name (Mon, Tue)
 */
function getDayNumberFromShortName(dayShortName) {
    const dayMap = {
        'Mon': '1', 'Tue': '2', 'Wed': '3', 'Thu': '4', 'Fri': '5', 'Sat': '6', 'Sun': '7'
    };
    return dayMap[dayShortName] || null;
}

/**
 * Get day short name from day number (1, 2)
 */
function getDayShortNameFromNumber(dayNumber) {
    const dayMap = {
        '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun'
    };
    return dayMap[dayNumber] || null;
}



function getActiveModal() {
    if ($('#modal_edit_TempPlan').hasClass('show')) {
        return $('#modal_edit_TempPlan');
    } else if ($('#modal_add_TempPlan').hasClass('show')) {
        return $('#modal_add_TempPlan');
    }
    return null;
}


function showAlert(message) {
    alert(message);
}


$(document).ready(async function () {

    // --- SELECTORS ---
    // Buttons
    const addingPlanSubmitBtn = $("#add-week-plan");
    const editingPlanSubmitBtn = $("#edit_plan_submit"); 

    // Modals
    const modalEditTempPlan = $('#modal_edit_TempPlan');
    const modalAddTempPlan = $('#modal_add_TempPlan');
    const modalAddSlot = $('#modal_add_plan');

    // Forms
    const addingPlanForm = $("#add-TempPlan-form");
    const editForm = $("#edit-scene-form");
    const addSlotForm = $("#add-plan-form"); 

    // Table body
    const tableBody = $("#list-temp-plans");


    // --- INITIALIZE MODAL-ON-MODAL ---
    handleModalTransition('add-plan-button', '#modal_add_TempPlan', '#modal_add_plan');
    handleModalTransition('add-plan-button', '#modal_edit_TempPlan', '#modal_add_plan');


    /* ******************************************************** */
    /* Graph UI                         */
    /* ******************************************************** */

    $('[name="plan-describe"]').hide();

    $('.schedule-grid').on('click', '.schedule-slot', function (event) {
        event.stopPropagation();
        $('.schedule-slot').removeClass('highlighted');
        $(this).addClass('highlighted');

        let mode = $(this).data('mode');
        let startTime = $(this).data('starttime');
        let endTime = $(this).data('endtime');
        if (endTime === "00:00") endTime = "24:00"; // Show 24:00 in UI

        let planInfo = $(this).closest('.modal-body').find('.plan-info');
        planInfo.data('mode', mode);
        planInfo.data('starttime', startTime);
        planInfo.data('endtime', endTime);

        planInfo.find('.color-indicator').attr('class', 'color-indicator ' + mode);
        planInfo.find('.mode').text(capitalizeFirstLetter(mode));
        planInfo.find('.time').text(startTime + ' - ' + endTime);

        $(this).closest('.modal-body').find('[name="plan-describe"]').slideDown(300);
    });

    $(document).on('click', function (event) {
        if (!$(event.target).closest('.schedule-slot').length) {
            $('.schedule-slot').removeClass('highlighted');
            $('[name="plan-describe"]').slideUp(300);
        }
    });

    /**
     * Scrapes the plan data *from the DOM* to build the timeSchedule object for the graph.
     */
    function buildTimeScheduleFromDOM(activeModal) {
        const activeContext = activeModal.find('.week-plans-list');
        const timeSchedule = {};

        activeContext.find('.plans-list').each(function () {
            const dayNumber = $(this).data('day');
            const dayName = getDayName(dayNumber);
            if (!dayName) return;

            const plans = [];
            $(this).find('.plan').each(function () {
                const mode = $(this).data('mode');
                let startTime = $(this).data('starttime');
                let endTime = $(this).data('endtime');

                // Convert "24:00" from DOM to 24.0 for graph calculation
                if (endTime === "24:00") {
                    endTime = "24:00";
                } else if (endTime === "00:00") {
                    // This case might happen from old data, treat as 24:00
                    endTime = "24:00";
                }

                const start = convertTimeToMinutes(startTime) / 60;
                const end = convertTimeToMinutes(endTime) / 60;

                plans.push({ start: start, end: end, mode: mode });
            });
            timeSchedule[dayName] = plans.length > 0 ? plans : [];
        });
        return timeSchedule;
    }

    /**
     * Draws the visual graph based on the timeSchedule object.
     */
    function generateSchedule(activeModal) {
        const timeSchedule = buildTimeScheduleFromDOM(activeModal);
        const days = Object.keys(timeSchedule);

        days.forEach(day => {
            const dayColumn = activeModal.find(`.day-column[data-day="${day}"]`)[0];
            const slots = timeSchedule[day];
            if (!dayColumn) return;

            dayColumn.innerHTML = ''; // Clear existing slots

            slots.forEach(slot => {
                const slotDiv = document.createElement('div');
                slotDiv.classList.add('schedule-slot', slot.mode);

                const startTimeStr = formatTime(slot.start * 60);
                const endTimeStr = formatTime(slot.end * 60);

                slotDiv.setAttribute('data-mode', slot.mode);
                slotDiv.setAttribute('data-starttime', startTimeStr);
                slotDiv.setAttribute('data-endtime', endTimeStr);
                slotDiv.setAttribute('data-day', day);

                const totalHours = 24;
                const topPosition = (slot.start / totalHours) * 100;
                const slotHeight = ((slot.end - slot.start) / totalHours) * 100;

                slotDiv.style.height = `${slotHeight}%`;
                slotDiv.style.top = `${topPosition}%`;
                slotDiv.style.position = 'absolute';

                const startHour = Math.floor(slot.start);
                const startMinutes = Math.round((slot.start - startHour) * 60);
                let endHour = Math.floor(slot.end);
                let endMinutes = Math.round((slot.end - endHour) * 60);
                
                if (slot.end === 24) {
                    endHour = 24;
                    endMinutes = 0;
                }

                slotDiv.title = `${slot.mode}: ${startHour}:${startMinutes < 10 ? '0' : ''}${startMinutes} - ${endHour}:${endMinutes < 10 ? '0' : ''}${endMinutes}`;
                dayColumn.appendChild(slotDiv);
            });
        });
    }

    /* ******************************************************** */
    /* View Toggling (Tabs)                   */
    /* ******************************************************** */

    $('input[name="plans-view"], input[name="plans-view-edit"]').on('change', function () {
        const activeModal = getActiveModal();
        if (!activeModal) return;

        const isTimeSchedule = activeModal.find('input[name^="plans-view"]:checked').val() === 'time-schedule';
        activeModal.find('[name="timeSchedule"]').toggle(isTimeSchedule);
        activeModal.find('[name="weeklyOverview"]').toggle(!isTimeSchedule);
    });

    $('input[name="dayWeek"]').on('change', function () {
        const container = $(this).closest('[name="timeSchedule"]');
        let selectedDay = $(this).val();

        container.find('.week-plans-list .plans-list').addClass('hidden');
        let selectedPlanList = container.find('.week-plans-list .plans-list[data-day="' + selectedDay + '"]');
        selectedPlanList.removeClass('hidden');

        // Refresh text and colors
        selectedPlanList.find('.plan').each(function () {
            let mode = $(this).data('mode');
            let startTime = $(this).data('starttime');
            let endTime = $(this).data('endtime');
            if (endTime === "00:00") endTime = "24:00"; // Fix display

            $(this).find('.color-indicator').removeClass('minimum normal comfort attenuation').addClass(mode);
            $(this).find('.mode').text(capitalizeFirstLetter(mode));
            $(this).find('.time').text(startTime + ' - ' + endTime);
        });
    });

    // Initialize views
    $('input[name="dayWeek"]:checked').trigger('change');
    $('input[name="plans-view"]:checked').trigger('change');
    $('input[name="plans-view-edit"]:checked').trigger('change');


    /* ******************************************************** */
    /* DOM Slot Manipulation Logic                */
    /* ******************************************************** */

    /**
     * Sorts the .plan elements within a day list by their start time.
     */
    function sortPlans(selectedPlanList) {
        let plans = selectedPlanList.find('.plan').toArray();
        plans.sort((a, b) => convertTimeToMinutes($(a).data('starttime')) - convertTimeToMinutes($(b).data('starttime')));
        selectedPlanList.find('.col-11').empty().append(plans);
    }

    /**
     * Merges adjacent slots *in the DOM* if they have the same mode.
     */
    function mergeContiguousModes(selectedPlanList) {
        let plans = selectedPlanList.find('.plan').toArray().sort((a, b) =>
            convertTimeToMinutes($(a).data('starttime')) - convertTimeToMinutes($(b).data('starttime'))
        );

        let mergedPlans = [];
        let previousPlan = null;

        plans.forEach(function (plan) {
            let $plan = $(plan);
            let mode = $plan.data('mode');
            let start = convertTimeToMinutes($plan.data('starttime'));
            let endStr = $plan.data('endtime');
            let end = convertTimeToMinutes(endStr);
            let slotId = $plan.data('slotid'); // Preserve slot_id

            if (previousPlan && mode === previousPlan.mode && start === previousPlan.end) {
                previousPlan.end = end;
                previousPlan.slotId = null; // Merged plans don't have a single ID
            } else {
                if (previousPlan) mergedPlans.push(previousPlan);
                previousPlan = { mode: mode, start: start, end: end, slotId: slotId };
            }
        });
        if (previousPlan) mergedPlans.push(previousPlan);

        selectedPlanList.find('.col-11').empty(); // Clear list

        mergedPlans.forEach(function (plan) {
            let startTime = formatTime(plan.start);
            let endTime = formatTime(plan.end);

            let newPlan = $('<div>', {
                class: 'd-flex justify-content-between align-items-center border p-2 mb-2 small plan',
                'data-mode': plan.mode,
                'data-starttime': startTime,
                'data-endtime': endTime
            });

            if (plan.slotId) {
                newPlan.attr('data-slotid', plan.slotId);
            }

            let leftDiv = $('<div>', { class: 'd-flex align-items-center' });
            leftDiv.append($('<span>', { class: 'color-indicator ' + plan.mode }));
            leftDiv.append($('<span>', { class: 'fw-bold ms-2 mode', text: capitalizeFirstLetter(plan.mode) }));

            let rightDiv = $('<div>', { class: 'd-flex align-items-center' });
            let timeSpan = $('<span>', { class: 'time', text: startTime + ' - ' + endTime });
            let deleteIcon = $('<span>', { class: 'icon icon-delete ms-3', name: 'delete-plan', style: 'cursor:pointer;' });

            rightDiv.append(timeSpan, deleteIcon);

            newPlan.append(leftDiv, rightDiv);
            selectedPlanList.find('.col-11').append(newPlan);
        });
    }

    /**
     * Fills any gaps between slots and ensures the day runs 00:00 to 24:00.
     */
    function adjustPlanTimes(selectedPlanList) {
        let plans = selectedPlanList.find('.plan').toArray().sort((a, b) =>
            convertTimeToMinutes($(a).data('starttime')) - convertTimeToMinutes($(b).data('starttime'))
        );

        if (plans.length === 0) {
            //addDefaultPlan(selectedPlanList); // Add default if all were deleted
            return;
        }

        // NOTE: We intentionally do NOT stretch the first slot to 00:00 or the
        // last slot to 24:00. Doing so overwrote the user-entered times — most
        // visibly for a single slot, where the first and last plan are the same
        // element and it got forced to 00:00 - 24:00.

        for (let i = 1; i < plans.length; i++) {
            let prevPlan = $(plans[i - 1]);
            let currentPlan = $(plans[i]);
            let prevEnd = convertTimeToMinutes(prevPlan.data('endtime'));
            let currentStart = convertTimeToMinutes(currentPlan.data('starttime'));

            if (prevEnd < currentStart) {
                // Fill the gap
                prevPlan.attr('data-endtime', currentPlan.data('starttime')).data('endtime', currentPlan.data('starttime'));
                prevPlan.find('.time').text(prevPlan.data('starttime') + ' - ' + currentPlan.data('starttime'));
            } else if (prevEnd > currentStart) {
                // Fix overlap
                prevPlan.attr('data-endtime', currentPlan.data('starttime')).data('endtime', currentPlan.data('starttime'));
                prevPlan.find('.time').text(prevPlan.data('starttime') + ' - ' + currentPlan.data('starttime'));
            }
        }

        sortPlans(selectedPlanList);
        mergeContiguousModes(selectedPlanList);
    }

    /**
     * Splits existing DOM plans to make room for a new one.
     */
    function handleConflicts(selectedPlanList, newStart, newEnd) {
        let existingPlans = selectedPlanList.find('.plan').toArray().sort((a, b) =>
            convertTimeToMinutes($(a).data('starttime')) - convertTimeToMinutes($(b).data('starttime'))
        );

        existingPlans.forEach(function (plan) {
            let $plan = $(plan);
            let existingStart = convertTimeToMinutes($plan.data('starttime'));
            let existingEndStr = $plan.data('endtime');
            let existingEnd = convertTimeToMinutes(existingEndStr === '24:00' ? '24:00' : existingEndStr);
            if (existingEnd === 0 && existingStart !== 0) existingEnd = 1440; // 24:00 in minutes

            if (newStart < existingEnd && newEnd > existingStart) {
                let existingMode = $plan.data('mode');

                if (newStart <= existingStart && newEnd >= existingEnd) {
                    $plan.remove();
                }
                else if (newStart > existingStart && newEnd < existingEnd) {
                    // Split into two
                    let firstSplit = $plan.clone();
                    firstSplit.attr('data-endtime', formatTime(newStart)).data('endtime', formatTime(newStart));
                    firstSplit.find('.time').text(formatTime(existingStart) + ' - ' + formatTime(newStart));

                    let secondSplit = $plan.clone();
                    secondSplit.attr('data-starttime', formatTime(newEnd)).data('starttime', formatTime(newEnd));
                    secondSplit.find('.time').text(formatTime(newEnd) + ' - ' + formatTime(existingEnd));

                    $plan.remove();
                    selectedPlanList.find('.col-11').append(firstSplit, secondSplit);
                }
                else if (newStart <= existingStart && newEnd < existingEnd && newEnd > existingStart) {
                    $plan.attr('data-starttime', formatTime(newEnd)).data('starttime', formatTime(newEnd));
                    $plan.find('.time').text(formatTime(newEnd) + ' - ' + formatTime(existingEnd));
                }
                else if (newStart > existingStart && newStart < existingEnd && newEnd >= existingEnd) {
                    $plan.attr('data-endtime', formatTime(newStart)).data('endtime', formatTime(newStart));
                    $plan.find('.time').text(formatTime(existingStart) + ' - ' + formatTime(newStart));
                }
            }
        });
        sortPlans(selectedPlanList);
    }

    /**
     * Adds the default "minimum" 00:00-24:00 plan to a day list.
     */
    function addDefaultPlan(selectedPlanList) {
        let defaultMode = 'minimum';
        let startTime = '00:00';
        let endTime = '24:00';

        let newPlan = $('<div>', {
            class: 'd-flex justify-content-between align-items-center border p-2 mb-2 small plan',
            'data-mode': defaultMode, 'data-starttime': startTime, 'data-endtime': endTime
        });
        let leftDiv = $('<div>', { class: 'd-flex align-items-center' });
        leftDiv.append($('<span>', { class: 'color-indicator ' + defaultMode }));
        leftDiv.append($('<span>', { class: 'fw-bold ms-2 mode', text: capitalizeFirstLetter(defaultMode) }));

        let rightDiv = $('<div>', { class: 'd-flex align-items-center' });
        rightDiv.append($('<span>', { class: 'time', text: startTime + ' - ' + endTime }));
        rightDiv.append($('<span>', { class: 'icon icon-delete ms-3', name: 'delete-plan', style: 'cursor:pointer;' }));
        newPlan.append(leftDiv, rightDiv);
        selectedPlanList.find('.col-11').append(newPlan);
    }

    /**
     * Adds a new plan to the DOM for a selected day.
     */
    function addNewPlan(selectedPlanList, modeValue, startTime, endTime) {
        let newStart = convertTimeToMinutes(startTime);
        let newEnd = convertTimeToMinutes(endTime);

        let isOverwritten = false;
        selectedPlanList.find('.plan').each(function () {
            let existingStart = convertTimeToMinutes($(this).data('starttime'));
            let existingEnd = convertTimeToMinutes($(this).data('endtime'));
            if (existingStart === newStart && existingEnd === newEnd) {
                $(this).data('mode', modeValue).attr('data-mode', modeValue);
                $(this).find('.color-indicator').removeClass('minimum normal comfort attenuation').addClass(modeValue);
                $(this).find('.mode').text(capitalizeFirstLetter(modeValue));
                isOverwritten = true;
                return false; 
            }
        });

        if (!isOverwritten) {
            handleConflicts(selectedPlanList, newStart, newEnd);

            let newPlan = $('<div>', {
                class: 'd-flex justify-content-between align-items-center border p-2 mb-2 small plan',
                'data-mode': modeValue, 'data-starttime': startTime, 'data-endtime': endTime
            });
            let leftDiv = $('<div>', { class: 'd-flex align-items-center' });
            leftDiv.append($('<span>', { class: 'color-indicator ' + modeValue }));
            leftDiv.append($('<span>', { class: 'fw-bold ms-2 mode', text: capitalizeFirstLetter(modeValue) }));

            let rightDiv = $('<div>', { class: 'd-flex align-items-center' });
            rightDiv.append($('<span>', { class: 'time', text: startTime + ' - ' + endTime }));
            rightDiv.append($('<span>', { class: 'icon icon-delete ms-3', name: 'delete-plan', style: 'cursor:pointer;' }));
            newPlan.append(leftDiv, rightDiv);

            selectedPlanList.find('.col-11').append(newPlan);
        }

        sortPlans(selectedPlanList);
        mergeContiguousModes(selectedPlanList);
        adjustPlanTimes(selectedPlanList);
        return true;
    }

    /**
     * Ensures all day lists have at least the default plan.
     */
    function initializeDefaultPlans(activeModal) {
        activeModal.find('.week-plans-list .plans-list').each(function () {
            let $planList = $(this);
            if ($planList.find('.plan').length === 0) {
                addDefaultPlan($planList);
            }
        });
    }

    /**
     * Resets the "Add Plan" modal to its default state.
     */
    function resetAddTemperaturePlan(activeModal) {
        activeModal.find('[name="temp-name"]').val("");
        activeModal.find('[name="temp-description"]').val("");

        // Clear all plan lists
        activeModal.find('.week-plans-list .plans-list').each(function () {
            $(this).find('.col-11').empty();
        });

        // Set default view
        activeModal.find('#time-schedule').prop('checked', true).trigger('change');
        activeModal.find('input[name="dayWeek"][value="1"]').prop('checked', true).trigger('change');
    }

    /* ******************************************************** */
    /* Main API Logic (Populating/Saving)             */
    /* ******************************************************** */

    /**
     * Populates the "Edit" modal's slot list with data from the server.
     */
    function addSlotsToTempPlan(slots) {
        // Clear all existing plans from the edit modal
        const planLists = modalEditTempPlan.find('.plans-list');
        planLists.each(function () {
            $(this).find('.col-11').empty();
        });

        slots.forEach(slot => {
            const dayNumber = getDayNumberFromShortName(slot.day_of_week);
            if (!dayNumber) return;

            const planList = modalEditTempPlan.find(`.plans-list[data-day="${dayNumber}"] .col-11`);
            if (!planList.length) return;

            // Handle 00:00 end time (midnight)
            const endTime = (slot.end_time === "00:00") ? "24:00" : slot.end_time;
            const startTime = slot.start_time;

            const planDiv = $('<div>', {
                class: 'd-flex justify-content-between align-items-center border p-2 mb-2 small plan',
                'data-mode': slot.slot_type.toLowerCase(),
                'data-starttime': startTime,
                'data-endtime': endTime,
                'data-slotid': slot.slot_id // Store slot_id for deletion
            });

            const leftDiv = $('<div>', { class: 'd-flex align-items-center' });
            leftDiv.append($('<span>', { class: 'color-indicator ' + slot.slot_type.toLowerCase() }));
            leftDiv.append($('<span>', { class: 'fw-bold ms-2 mode', text: capitalizeFirstLetter(slot.slot_type) }));

            const rightDiv = $('<div>', { class: 'd-flex align-items-center' });
            rightDiv.append($('<span>', { class: 'time', text: `${startTime} - ${endTime}` }));
            const deleteIcon = $('<span>', { class: 'icon icon-delete ms-3', name: 'delete-plan', style: 'cursor:pointer;' });
            rightDiv.append(deleteIcon);

            planDiv.append(leftDiv, rightDiv);
            planList.append(planDiv);
        });
        
        // After adding all slots, ensure all days are merged and adjusted
        planLists.each(function() {
            sortPlans($(this));
            mergeContiguousModes($(this));
            adjustPlanTimes($(this));
        });


        // Activate first day radio button (Mon)
        const firstDayRadio = modalEditTempPlan.find('input[name="dayWeek"][value="1"]');
        if (firstDayRadio.length) {
            firstDayRadio.prop('checked', true).trigger('change');
        }
    }

    /**
     * Attaches an event listener to an "Edit" button to fetch and populate the edit modal.
     */
    function attachEditButtonListener(editBtn, plan_id) {
        editBtn.on("click", async () => {
            console.log("Editing plan_id:", plan_id);
            const planDetails = await fetchTempPlan(plan_id);

            if (!planDetails) return;
            console.log("Fetched plan details:", planDetails);

            const plan = planDetails["plan"];
            const slots = planDetails["slots"];

            editForm[0].reset(); // Use [0] to access native reset
            editForm.attr("data-editing-plan-id", plan_id);
            editForm.find("[name='temp-name']").val(plan["name"]);
            editForm.find("[name='temp-description']").val(plan["description"] ?? "");
            editForm.find("[name='temp-heat-min-edit']").val(plan["min_temp"]);
            editForm.find("[name='temp-heat-atten-edit']").val(plan["attenuation_temp"]);
            editForm.find("[name='temp-heat-normal-edit']").val(plan["normal_temp"]);
            editForm.find("[name='temp-heat-comfort-edit']").val(plan["comfort_temp"]);

            addSlotsToTempPlan(slots);

            // Ensure the correct view is shown
            modalEditTempPlan.find('#time-schedule-edit').prop('checked', true).trigger('change');
            generateSchedule(modalEditTempPlan); // Generate graph after loading
        });

    }


    /**
     * Main function to load all plans into the HTML table.
     */
    async function loadTempPlans() {
        try {
            tableBody.html(""); // Clear table body

            const plans = await fetchTemperaturePlans();

            plans.forEach((plan, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <th class="text-start" scope="row">${index + 1}</th>
                    <td>${plan.name}</td>
                    <td>${plan.description ?? ""}</td>
                    <td class="text-center">
                        <span class="icon icon-edit cursor me-2" data-bs-toggle="modal" data-bs-target="#modal_edit_TempPlan"></span>
                        <span class="icon icon-delete cursor delete-btn"></span>
                    </td>
                `;

                tableBody.append(row);

                const deleteBtn = $(row).find(".delete-btn");
                const editBtn = $(row).find(".icon-edit");

                attachEditButtonListener(editBtn, plan.plan_id);

                deleteBtn.on("click", async () => {
                    if (await confirmDelete(`Are you sure you want to delete ${plan.name}?`)) {
                        const success = await handleDeleteTempPlan(plan.plan_id);
                        if(success){
                            await loadTempPlans()
                        }
                    }
                });
            });

        } catch (err) {
            console.error("Failed to load plans:", err.message);
            showAlert("Failed to load plans.");
        }
    }

  
    function scrapeSlotsFromDOM(activeModal) {
        const slots = [];
        const dayMapNumberToShort = {
            '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun'
        };

        activeModal.find('.week-plans-list .plans-list').each(function () {
            const dayNumber = $(this).data('day');
            const day = dayMapNumberToShort[dayNumber];
            
            if (day) {
                $(this).find('.plan').each(function () {
                    let endTime = $(this).data('endtime');
                
                    
                    slots.push({
                        day: day,
                        start_time: $(this).data('starttime'),
                        end_time: endTime, // Send "24:00" as-is
                        mode: $(this).data('mode')
                    });
                });
            }
        });
        return slots;
    }


    /**
     * Handles the "Add Plan" form submission.
     */
    async function handleAddTempPlan(e) {
        e.preventDefault();

        const tempPlanSettings = {
            name: addingPlanForm.find("[name='temp-name']").val(),
            description: addingPlanForm.find("[name='temp-description']").val(),
            min_temp: parseFloat(addingPlanForm.find("[name='temp-heat-min']").val()),
            attenuation_temp: parseFloat(addingPlanForm.find("[name='temp-heat-atten']").val()),
            normal_temp: parseFloat(addingPlanForm.find("[name='temp-heat-normal']").val()),
            comfort_temp: parseFloat(addingPlanForm.find("[name='temp-heat-comfort']").val())
        };
        
        const slots = scrapeSlotsFromDOM(modalAddTempPlan);

        const payload = {
            settings: tempPlanSettings,
            plan: slots
        };

        console.log("Adding plan with payload:", payload);

        const success = await addTempPlan(payload)

        if(success){
            await loadTempPlans()
            addingPlanForm[0].reset();
            bootstrap.Modal.getOrCreateInstance(modalAddTempPlan[0]).hide();
        }

    }

    /**
     * Handles the "Update Plan" form submission.
     */
    async function handleUpdateOfTempPlan(e) {
        e.preventDefault();
        const plan_id = editForm.attr("data-editing-plan-id");

        const tempPlanSettings = {
            name: editForm.find("[name='temp-name']").val(),
            description: editForm.find("[name='temp-description']").val(),
            min_temp: parseFloat(editForm.find("[name='temp-heat-min-edit']").val()),
            attenuation_temp: parseFloat(editForm.find("[name='temp-heat-atten-edit']").val()),
            normal_temp: parseFloat(editForm.find("[name='temp-heat-normal-edit']").val()),
            comfort_temp: parseFloat(editForm.find("[name='temp-heat-comfort-edit']").val())
        };

        const slots = scrapeSlotsFromDOM(modalEditTempPlan);

        const payload = {
            settings: tempPlanSettings,
            plan: slots
        };

        console.log(`Updating plan ${plan_id} with payload:`, payload);

        const success = await updateTempPlan(plan_id, payload)
        if(success){
            await loadTempPlans();
            editForm[0].reset();
            bootstrap.Modal.getOrCreateInstance(modalEditTempPlan[0]).hide();
        }
    }


    /* ******************************************************** */
    /* Event Listeners & Initialization               */
    /* ******************************************************** */

    // Event handler for 'add-plan-to-tempPlan' button (in secondary modal)
    $('#add-plan-to-tempPlan').on('click', function () {
        let modeValue = $('#add-plan-mode').val();
        let startTime = $('#add-plan-startTime').val();
        let endTime = $('#add-plan-endTime').val();

        if (endTime === "00:00") endTime = "24:00";

        let selectedDays = [];
        $('#add-day-div input[type="checkbox"]:checked').each(function () {
            let dayId = $(this).attr('id');
            let dayNumber = getDayNumber(dayId);
            if (dayNumber !== null) selectedDays.push(dayNumber);
        });

        if (selectedDays.length === 0) {
            showAlert("Prosím, vyberte alespoň jeden den.");
            return;
        }
        if (startTime === "" || endTime === "") {
            showAlert("Prosím, vyplňte startovní a koncový čas.");
            return;
        }
        if (convertTimeToMinutes(startTime) >= convertTimeToMinutes(endTime)) {
            showAlert("Startovní čas musí být před koncovým časem.");
            return;
        }

        const activeModal = getActiveModal();
        if (!activeModal) {
            showAlert("Could not find active modal.");
            return;
        }

        selectedDays.forEach(function (day) {
            let selectedPlanList = activeModal.find('.week-plans-list .plans-list[data-day="' + day + '"]');
            if (selectedPlanList.length === 0) {
                showAlert("Plány pro den " + getDayName(day) + " nebyly nalezeny.");
            } else {
                addNewPlan(selectedPlanList, modeValue, startTime, endTime);
            }
        });

        modalAddSlot.modal('hide');
        addSlotForm[0].reset();
        $('#add-day-div input[type="checkbox"]').prop('checked', false);
        generateSchedule(activeModal);
    });

    // ============================================================
    // UNIFIED MASTER DELETE HANDLER
    // ============================================================
    // Handles BOTH:
    // 1. Existing slots from DB (via API delete)
    // 2. New unsaved slots (DOM only)
    // Attached to document for bulletproof event delegation
    
    $(document).on('click', '[name="delete-plan"]', async function (event) {
        event.preventDefault();
        event.stopPropagation();
        
        const btn = $(this);
        const planDiv = btn.closest('.plan');
        const planList = btn.closest('.plans-list');
        const slotId = planDiv.data('slotid');

        console.log("Master delete handler. Slot ID:", slotId);

        if (!(await confirmDelete("Delete this slot?"))) {
            return;
        }

        if (slotId) {
            // Case 1: Existing Slot - Call API
            try {
                const success = await handleDeleteOfTempPlanSlot(slotId);
                if (success) {
                    console.log("API deleted slot successfuly");
                    planDiv.remove();
                    // Only re-calc if it's the edit modal (where things are dynamic)
                    if (planList.length) {
                        adjustPlanTimes(planList);
                        const activeModal = getActiveModal();
                        if(activeModal) generateSchedule(activeModal);
                    }
                } else {
                    alert("Server failed to delete the plan.");
                }
            } catch (err) {
                console.error("Error deleting plan:", err);
                alert("An error occurred while deleting.");
            }
        } else {
            // Case 2: New Unsaved Slot - Just remove from DOM
            console.log("Removing unsaved slot from DOM");
            planDiv.remove();
            if (planList.length) {
                adjustPlanTimes(planList);
                const activeModal = getActiveModal();
                if(activeModal) generateSchedule(activeModal);
            }
        }
    });

   
    modalEditTempPlan.on('show.bs.modal', function () {
       
        $(this).find('#time-schedule-edit').prop('checked', true).trigger('change');
        $(this).find('input[name="dayWeek"][value="1"]').prop('checked', true).trigger('change');
       
    });

    modalAddTempPlan.on('show.bs.modal', function () {
        resetAddTemperaturePlan(modalAddTempPlan);
        //initializeDefaultPlans(modalAddTempPlan);
        generateSchedule(modalAddTempPlan);
    });


    addingPlanSubmitBtn.on("click", handleAddTempPlan);
    editingPlanSubmitBtn.on("click", handleUpdateOfTempPlan);
    await loadTempPlans();

});