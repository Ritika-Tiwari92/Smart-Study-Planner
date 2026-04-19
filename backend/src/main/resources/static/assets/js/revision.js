const openRevisionModalBtn = document.getElementById("openRevisionModalBtn");
const revisionModalOverlay = document.getElementById("revisionModalOverlay");
const closeRevisionModalBtn = document.getElementById("closeRevisionModalBtn");
const cancelRevisionModalBtn = document.getElementById("cancelRevisionModalBtn");

const revisionModalForm = document.getElementById("revisionModalForm");
const revisionModalTitle = document.getElementById("revisionModalTitle");
const revisionSaveBtn = document.getElementById("revisionSaveBtn");

const revisionTopicList = document.getElementById("revisionTopicList");
const revisionEmptyState = document.getElementById("revisionEmptyState");
const revisionSearchInput = document.getElementById("revisionSearchInput");
const revisionFilterSelect = document.getElementById("revisionFilterSelect");

const totalRevisionCount = document.getElementById("totalRevisionCount");
const revisionDueTodayCount = document.getElementById("revisionDueTodayCount");
const revisionCompletedTodayCount = document.getElementById("revisionCompletedTodayCount");
const revisionProgressCount = document.getElementById("revisionProgressCount");

const revisionScheduleList = document.getElementById("revisionScheduleList");
const revisionScheduleEmptyState = document.getElementById("revisionScheduleEmptyState");

const weakAreaList = document.getElementById("weakAreaList");
const weakAreaEmptyState = document.getElementById("weakAreaEmptyState");

const revisionTipList = document.getElementById("revisionTipList");
const revisionTipEmptyState = document.getElementById("revisionTipEmptyState");

const revisionTopicTitleInput = document.getElementById("revisionTopicTitle");
const revisionSubjectInput = document.getElementById("revisionSubject");
const revisionPriorityInput = document.getElementById("revisionPriority");
const revisionDateInput = document.getElementById("revisionDate");
const revisionStatusInput = document.getElementById("revisionStatus");
const revisionDescriptionInput = document.getElementById("revisionDescription");

const REVISION_API_URL = "/api/revisions";
const SUBJECTS_API_URL = "/subjects";

let editingRevisionId = null;
let allRevisionTopics = [];
let allSubjects = [];

function openRevisionModal() {
    if (!revisionModalOverlay) return;
    revisionModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeRevisionModal() {
    if (!revisionModalOverlay) return;
    revisionModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddRevisionMode() {
    editingRevisionId = null;
    if (revisionModalTitle) revisionModalTitle.textContent = "Add Revision Topic";
    if (revisionSaveBtn) revisionSaveBtn.textContent = "Save Revision";
}

function setEditRevisionMode() {
    if (revisionModalTitle) revisionModalTitle.textContent = "Edit Revision Topic";
    if (revisionSaveBtn) revisionSaveBtn.textContent = "Update Revision";
}

function resetRevisionForm() {
    if (!revisionModalForm) return;
    revisionModalForm.reset();

    if (revisionPriorityInput) {
        revisionPriorityInput.value = "Weak Topic";
    }

    if (revisionStatusInput) {
        revisionStatusInput.value = "Pending";
    }
}

function clearRevisionModalState() {
    resetRevisionForm();
    setAddRevisionMode();
}

function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

function getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
}

function normalizeRevisionTopic(topic) {
    return {
        id: topic?.id ?? null,
        title: String(topic?.title || "").trim(),
        subject: String(topic?.subject || "").trim(),
        priority: String(topic?.priority || "Pending").trim(),
        date: String(topic?.date || topic?.revisionDate || "").trim(),
        status: String(topic?.status || "Pending").trim(),
        description: String(topic?.description || "").trim()
    };
}

function convertToRequestBody(topic) {
    const normalized = normalizeRevisionTopic(topic);

    return {
        title: normalized.title,
        subject: normalized.subject,
        priority: normalized.priority,
        revisionDate: normalized.date,
        status: normalized.status,
        description: normalized.description
    };
}

function isCompletedTopic(topic) {
    const status = (topic?.status || "").toLowerCase();
    const priority = (topic?.priority || "").toLowerCase();
    return status === "completed" || priority === "completed";
}

function isWeakTopic(topic) {
    const status = (topic?.status || "").toLowerCase();
    const priority = (topic?.priority || "").toLowerCase();
    return status === "weak topic" || priority === "weak topic";
}

function isPendingTopic(topic) {
    return !isCompletedTopic(topic) && !isWeakTopic(topic);
}

function getEffectiveBadgeText(topic) {
    if (isCompletedTopic(topic)) return "Completed";
    if (isWeakTopic(topic)) return "Weak Topic";
    return "Pending";
}

function getRevisionBadgeClass(topic) {
    if (isCompletedTopic(topic)) return "done";
    if (isWeakTopic(topic)) return "weak";
    return "pending";
}

function formatDateLabel(dateString) {
    if (!dateString) return "No Date";

    if (dateString === getTodayString()) return "Today";
    if (dateString === getTomorrowString()) return "Tomorrow";

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return dateString;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
    });
}

function resetDynamicContainer(container, emptyState) {
    if (!container) return;
    container.innerHTML = "";

    if (emptyState) {
        emptyState.classList.add("hidden");
        container.appendChild(emptyState);
    }
}

function showEmptyState(emptyState, shouldShow) {
    if (!emptyState) return;

    if (shouldShow) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
    }
}

function updateRevisionCounts(topics = allRevisionTopics) {
    const today = getTodayString();

    const totalTopics = topics.length;
    const dueToday = topics.filter((topic) => topic.date === today).length;
    const completedToday = topics.filter(
        (topic) => topic.date === today && isCompletedTopic(topic)
    ).length;
    const totalCompleted = topics.filter((topic) => isCompletedTopic(topic)).length;

    const progress = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0;

    if (totalRevisionCount) {
        totalRevisionCount.textContent = String(totalTopics).padStart(2, "0");
    }

    if (revisionDueTodayCount) {
        revisionDueTodayCount.textContent = String(dueToday).padStart(2, "0");
    }

    if (revisionCompletedTodayCount) {
        revisionCompletedTodayCount.textContent = String(completedToday).padStart(2, "0");
    }

    if (revisionProgressCount) {
        revisionProgressCount.textContent = `${progress}%`;
    }
}

function createRevisionTopicItem(topicData) {
    const topic = normalizeRevisionTopic(topicData);

    const topicItem = document.createElement("div");
    topicItem.className = "revision-topic-item";
    topicItem.dataset.revisionId = topic.id;
    topicItem.dataset.date = topic.date;
    topicItem.dataset.subject = topic.subject;
    topicItem.dataset.priority = topic.priority;
    topicItem.dataset.status = topic.status;
    topicItem.dataset.description = topic.description;

    const badgeClass = getRevisionBadgeClass(topic);
    const badgeText = getEffectiveBadgeText(topic);

    let subText = `Subject: ${topic.subject || "No Subject"}`;

    if (topic.description) {
        subText += ` • ${topic.description}`;
    }

    if (topic.date) {
        subText += ` • Revision date: ${topic.date}`;
    }

    topicItem.innerHTML = `
        <div class="revision-topic-info">
            <h4>${topic.title || "Untitled Topic"}</h4>
            <p>${subText}</p>
        </div>
        <span class="revision-topic-badge ${badgeClass}">${badgeText}</span>
        <div class="revision-topic-actions">
            <button class="revision-topic-action-btn edit" title="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="revision-topic-action-btn delete" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;

    return topicItem;
}

function renderRevisionTopics(topics) {
    if (!revisionTopicList) return;

    resetDynamicContainer(revisionTopicList, revisionEmptyState);

    topics.forEach((topic) => {
        const topicItem = createRevisionTopicItem(topic);

        if (revisionEmptyState) {
            revisionTopicList.insertBefore(topicItem, revisionEmptyState);
        } else {
            revisionTopicList.appendChild(topicItem);
        }
    });

    applyRevisionFilters();
    updateRevisionCounts(allRevisionTopics);
}

function createRevisionScheduleItem(topic) {
    const item = document.createElement("div");
    item.className = "revision-schedule-item";

    const detailTextParts = [];

    if (topic.subject) {
        detailTextParts.push(topic.subject);
    }

    if (topic.description) {
        detailTextParts.push(topic.description);
    } else {
        detailTextParts.push(getEffectiveBadgeText(topic));
    }

    item.innerHTML = `
        <div class="revision-schedule-time">${formatDateLabel(topic.date)}</div>
        <div class="revision-schedule-info">
            <h4>${topic.title || "Untitled Topic"}</h4>
            <p>${detailTextParts.join(" • ")}</p>
        </div>
    `;

    return item;
}

function renderRevisionSchedule(topics = allRevisionTopics) {
    if (!revisionScheduleList) return;

    resetDynamicContainer(revisionScheduleList, revisionScheduleEmptyState);

    const scheduleTopics = [...topics]
        .filter((topic) => topic.date && !isCompletedTopic(topic))
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
        .slice(0, 5);

    scheduleTopics.forEach((topic) => {
        const item = createRevisionScheduleItem(topic);

        if (revisionScheduleEmptyState) {
            revisionScheduleList.insertBefore(item, revisionScheduleEmptyState);
        } else {
            revisionScheduleList.appendChild(item);
        }
    });

    showEmptyState(revisionScheduleEmptyState, scheduleTopics.length === 0);
}

function createWeakAreaItem(topic) {
    const item = document.createElement("div");
    item.className = "weak-area-item";

    const subjectText = topic.subject ? ` • ${topic.subject}` : "";

    item.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>${topic.title || "Untitled Topic"}${subjectText}</span>
    `;

    return item;
}

function renderWeakAreas(topics = allRevisionTopics) {
    if (!weakAreaList) return;

    resetDynamicContainer(weakAreaList, weakAreaEmptyState);

    const weakTopics = topics.filter((topic) => isWeakTopic(topic)).slice(0, 6);

    weakTopics.forEach((topic) => {
        const item = createWeakAreaItem(topic);

        if (weakAreaEmptyState) {
            weakAreaList.insertBefore(item, weakAreaEmptyState);
        } else {
            weakAreaList.appendChild(item);
        }
    });

    showEmptyState(weakAreaEmptyState, weakTopics.length === 0);
}

function generateDynamicRevisionTips(topics = allRevisionTopics) {
    const tips = [];
    const totalTopics = topics.length;
    const weakTopics = topics.filter((topic) => isWeakTopic(topic));
    const dueTodayTopics = topics.filter((topic) => topic.date === getTodayString());
    const completedTopics = topics.filter((topic) => isCompletedTopic(topic));
    const pendingTopics = topics.filter((topic) => isPendingTopic(topic));

    const uniqueSubjects = [...new Set(
        topics
            .map((topic) => topic.subject)
            .filter((subject) => subject && subject.trim())
    )];

    if (weakTopics.length > 0) {
        tips.push(`You have ${weakTopics.length} weak topic(s). Revise them first while your focus is highest.`);
    }

    if (dueTodayTopics.length > 0) {
        tips.push(`You have ${dueTodayTopics.length} revision topic(s) due today. Finish today's list before adding new topics.`);
    }

    if (pendingTopics.length > 0) {
        tips.push(`There are ${pendingTopics.length} pending revision topic(s). Try closing at least one pending topic in each session.`);
    }

    if (completedTopics.length > 0 && totalTopics > 0) {
        const progress = Math.round((completedTopics.length / totalTopics) * 100);
        tips.push(`Your current revision progress is ${progress}%. Keep consistency to improve retention.`);
    }

    if (uniqueSubjects.length >= 2) {
        tips.push(`You are revising ${uniqueSubjects.length} subjects. Alternate tough and easy subjects to avoid mental fatigue.`);
    }

    if (totalTopics >= 5) {
        tips.push("Break long revision into short sessions of 25 to 30 minutes for better recall.");
    }

    if (tips.length === 0) {
        tips.push("Add revision topics with dates and status to get personalized revision tips here.");
    }

    return tips.slice(0, 4);
}

function createRevisionTipItem(text) {
    const item = document.createElement("div");
    item.className = "revision-tip-item";

    item.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${text}</span>
    `;

    return item;
}

function renderRevisionTips(topics = allRevisionTopics) {
    if (!revisionTipList) return;

    resetDynamicContainer(revisionTipList, revisionTipEmptyState);

    const tips = generateDynamicRevisionTips(topics);

    tips.forEach((tip) => {
        const item = createRevisionTipItem(tip);

        if (revisionTipEmptyState) {
            revisionTipList.insertBefore(item, revisionTipEmptyState);
        } else {
            revisionTipList.appendChild(item);
        }
    });

    showEmptyState(revisionTipEmptyState, tips.length === 0);
}

function renderAllRealtimeSections(topics = allRevisionTopics) {
    renderRevisionTopics(topics);
    renderRevisionSchedule(topics);
    renderWeakAreas(topics);
    renderRevisionTips(topics);
    updateRevisionCounts(topics);
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    if (!response.ok) {
        let errorMessage = "Request failed.";

        try {
            const errorText = await response.text();
            if (errorText) {
                errorMessage = errorText;
            }
        } catch (error) {
            console.error("Failed to read error response:", error);
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    return response.text();
}

async function fetchAllRevisionTopics() {
    const data = await apiRequest(REVISION_API_URL, {
        method: "GET"
    });

    return Array.isArray(data) ? data.map(normalizeRevisionTopic) : [];
}

async function createRevisionTopicApi(topicData) {
    const createdTopic = await apiRequest(REVISION_API_URL, {
        method: "POST",
        body: JSON.stringify(convertToRequestBody(topicData))
    });

    return normalizeRevisionTopic(createdTopic);
}

async function updateRevisionTopicApi(topicId, topicData) {
    const updatedTopic = await apiRequest(`${REVISION_API_URL}/${topicId}`, {
        method: "PUT",
        body: JSON.stringify(convertToRequestBody(topicData))
    });

    return normalizeRevisionTopic(updatedTopic);
}

async function deleteRevisionTopicApi(topicId) {
    await apiRequest(`${REVISION_API_URL}/${topicId}`, {
        method: "DELETE"
    });
}

function extractSubjectName(subject) {
    if (typeof subject === "string" && subject.trim()) {
        return subject.trim();
    }

    const possibleKeys = [
        "name",
        "subjectName",
        "title",
        "subject",
        "subjectTitle"
    ];

    for (const key of possibleKeys) {
        const value = subject?.[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return "";
}

function populateSubjectDropdown(subjects, selectedValue = "") {
    if (!revisionSubjectInput) return;

    const currentValue = selectedValue || revisionSubjectInput.value || "";
    const subjectNames = [...new Set(
        (subjects || [])
            .map(extractSubjectName)
            .filter((name) => name && name.trim())
    )];

    revisionSubjectInput.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Select Subject";
    revisionSubjectInput.appendChild(placeholderOption);

    subjectNames.forEach((subjectName) => {
        const option = document.createElement("option");
        option.value = subjectName;
        option.textContent = subjectName;
        revisionSubjectInput.appendChild(option);
    });

    if (currentValue && !subjectNames.includes(currentValue)) {
        const customOption = document.createElement("option");
        customOption.value = currentValue;
        customOption.textContent = currentValue;
        revisionSubjectInput.appendChild(customOption);
    }

    revisionSubjectInput.value = currentValue || "";
}

async function loadRevisionSubjects(selectedValue = "") {
    try {
        const data = await apiRequest(SUBJECTS_API_URL, {
            method: "GET"
        });

        allSubjects = Array.isArray(data) ? data : [];
        populateSubjectDropdown(allSubjects, selectedValue);
    } catch (error) {
        console.error("Failed to load subjects:", error);
        populateSubjectDropdown([], selectedValue);
    }
}

function matchesRevisionFilter(topicItem, filterValue) {
    if (!filterValue || filterValue === "All Topics") return true;

    const topic = {
        date: topicItem.dataset.date || "",
        status: topicItem.dataset.status || "",
        priority: topicItem.dataset.priority || ""
    };

    if (filterValue === "Due Today") return topic.date === getTodayString();
    if (filterValue === "Completed") return isCompletedTopic(topic);
    if (filterValue === "Pending") return isPendingTopic(topic);
    if (filterValue === "Weak Topics") return isWeakTopic(topic);

    return true;
}

function updateRevisionEmptyState(visibleCount) {
    showEmptyState(revisionEmptyState, visibleCount === 0);
}

function applyRevisionFilters() {
    if (!revisionTopicList) return;

    const topicItems = revisionTopicList.querySelectorAll(".revision-topic-item");
    const searchText = revisionSearchInput ? revisionSearchInput.value.toLowerCase().trim() : "";
    const filterValue = revisionFilterSelect ? revisionFilterSelect.value : "All Topics";

    let visibleCount = 0;

    topicItems.forEach((topicItem) => {
        const title = topicItem.querySelector(".revision-topic-info h4")?.textContent.toLowerCase() || "";
        const description = topicItem.querySelector(".revision-topic-info p")?.textContent.toLowerCase() || "";

        const matchesSearch = title.includes(searchText) || description.includes(searchText);
        const passesFilter = matchesRevisionFilter(topicItem, filterValue);

        if (matchesSearch && passesFilter) {
            topicItem.style.display = "";
            visibleCount++;
        } else {
            topicItem.style.display = "none";
        }
    });

    updateRevisionEmptyState(visibleCount);
}

function fillRevisionFormForEdit(topicItem) {
    editingRevisionId = topicItem.dataset.revisionId || null;

    const title = topicItem.querySelector(".revision-topic-info h4")?.textContent.trim() || "";
    const subject = topicItem.dataset.subject || "";
    const priority = topicItem.dataset.priority || "Weak Topic";
    const date = topicItem.dataset.date || "";
    const status = topicItem.dataset.status || "Pending";
    const description = topicItem.dataset.description || "";

    revisionTopicTitleInput.value = title;
    revisionPriorityInput.value = priority;
    revisionDateInput.value = date;
    revisionStatusInput.value = status;
    revisionDescriptionInput.value = description;

    populateSubjectDropdown(allSubjects, subject);
}

async function loadRevisionTopics() {
    try {
        allRevisionTopics = await fetchAllRevisionTopics();
        renderAllRealtimeSections(allRevisionTopics);
    } catch (error) {
        console.error("Failed to load revision topics:", error);
        allRevisionTopics = [];
        renderAllRealtimeSections([]);
        alert("Revision data load nahi ho pa raha. Backend connection check karo.");
    }
}

if (
    openRevisionModalBtn &&
    revisionModalOverlay &&
    closeRevisionModalBtn &&
    cancelRevisionModalBtn &&
    revisionModalForm &&
    revisionTopicList
) {
    openRevisionModalBtn.addEventListener("click", async function () {
        clearRevisionModalState();
        await loadRevisionSubjects();
        openRevisionModal();
    });

    closeRevisionModalBtn.addEventListener("click", function () {
        closeRevisionModal();
        clearRevisionModalState();
    });

    cancelRevisionModalBtn.addEventListener("click", function () {
        closeRevisionModal();
        clearRevisionModalState();
    });

    revisionModalOverlay.addEventListener("click", function (event) {
        if (event.target === revisionModalOverlay) {
            closeRevisionModal();
            clearRevisionModalState();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !revisionModalOverlay.classList.contains("hidden")) {
            closeRevisionModal();
            clearRevisionModalState();
        }
    });

    revisionModalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = revisionTopicTitleInput.value.trim();
        const subject = revisionSubjectInput.value;
        const priority = revisionPriorityInput.value;
        const date = revisionDateInput.value;
        const status = revisionStatusInput.value;
        const description = revisionDescriptionInput.value.trim();

        if (!title) {
            alert("Please enter a revision topic title.");
            return;
        }

        if (!subject) {
            alert("Please select a subject.");
            return;
        }

        if (!date) {
            alert("Please select a revision date.");
            return;
        }

        const revisionData = normalizeRevisionTopic({
            title,
            subject,
            priority,
            date,
            status,
            description: description || "Scheduled revision topic for better retention."
        });

        try {
            revisionSaveBtn.disabled = true;

            if (editingRevisionId) {
                await updateRevisionTopicApi(editingRevisionId, revisionData);
            } else {
                await createRevisionTopicApi(revisionData);
            }

            await loadRevisionTopics();
            closeRevisionModal();
            clearRevisionModalState();
        } catch (error) {
            console.error("Failed to save revision topic:", error);
            alert("Revision save/update nahi ho pa raha. Backend API check karo.");
        } finally {
            revisionSaveBtn.disabled = false;
        }
    });

    revisionTopicList.addEventListener("click", async function (event) {
        const deleteButton = event.target.closest(".revision-topic-action-btn.delete");
        const editButton = event.target.closest(".revision-topic-action-btn.edit");

        if (deleteButton) {
            const topicItem = deleteButton.closest(".revision-topic-item");
            const topicId = topicItem?.dataset.revisionId;

            if (!topicId) return;

            const shouldDelete = confirm("Do you want to delete this revision topic?");
            if (!shouldDelete) return;

            try {
                await deleteRevisionTopicApi(topicId);
                await loadRevisionTopics();
            } catch (error) {
                console.error("Failed to delete revision topic:", error);
                alert("Revision delete nahi ho pa raha. Backend API check karo.");
            }

            return;
        }

        if (editButton) {
            const topicItem = editButton.closest(".revision-topic-item");
            if (!topicItem) return;

            setEditRevisionMode();
            await loadRevisionSubjects(topicItem.dataset.subject || "");
            fillRevisionFormForEdit(topicItem);
            openRevisionModal();
        }
    });

    if (revisionSearchInput) {
        revisionSearchInput.addEventListener("input", applyRevisionFilters);
    }

    if (revisionFilterSelect) {
        revisionFilterSelect.addEventListener("change", applyRevisionFilters);
    }

    Promise.all([
        loadRevisionSubjects(),
        loadRevisionTopics()
    ]).catch((error) => {
        console.error("Initial load failed:", error);
    });

    setAddRevisionMode();
}