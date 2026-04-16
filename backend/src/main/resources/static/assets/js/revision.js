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
const revisionCompletedCount = document.getElementById("revisionCompletedCount");
const revisionProgressCount = document.getElementById("revisionProgressCount");

const revisionTopicTitleInput = document.getElementById("revisionTopicTitle");
const revisionSubjectInput = document.getElementById("revisionSubject");
const revisionPriorityInput = document.getElementById("revisionPriority");
const revisionDateInput = document.getElementById("revisionDate");
const revisionStatusInput = document.getElementById("revisionStatus");
const revisionDescriptionInput = document.getElementById("revisionDescription");

const REVISION_STORAGE_KEY = "edumind_revision_topics";

let editingRevisionId = null;

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

function generateRevisionId() {
    return `revision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

function getRevisionBadgeClass(statusOrPriority) {
    const value = (statusOrPriority || "").toLowerCase();

    if (value === "completed") return "done";
    if (value === "pending") return "pending";
    if (value === "weak topic") return "weak";

    return "pending";
}

function updateRevisionCounts() {
    if (!revisionTopicList) return;

    const topicItems = revisionTopicList.querySelectorAll(".revision-topic-item");
    const topicBadges = revisionTopicList.querySelectorAll(".revision-topic-badge");

    const totalTopics = topicItems.length;
    let dueToday = 0;
    let completed = 0;

    topicItems.forEach((item) => {
        const dateValue = item.dataset.date || "";
        if (dateValue === getTodayString()) {
            dueToday++;
        }
    });

    topicBadges.forEach((badge) => {
        if (badge.classList.contains("done")) {
            completed++;
        }
    });

    const progress = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

    if (totalRevisionCount) {
        totalRevisionCount.textContent = String(totalTopics).padStart(2, "0");
    }

    if (revisionDueTodayCount) {
        revisionDueTodayCount.textContent = String(dueToday).padStart(2, "0");
    }

    if (revisionCompletedCount) {
        revisionCompletedCount.textContent = String(completed).padStart(2, "0");
    }

    if (revisionProgressCount) {
        revisionProgressCount.textContent = `${progress}%`;
    }
}

function createRevisionTopicItem({ id, title, subject, priority, date, status, description }) {
    const topicItem = document.createElement("div");
    topicItem.className = "revision-topic-item";
    topicItem.dataset.revisionId = id;
    topicItem.dataset.date = date || "";
    topicItem.dataset.subject = subject || "";
    topicItem.dataset.priority = priority || "";
    topicItem.dataset.status = status || "Pending";
    topicItem.dataset.description = description || "";

    const badgeClass = getRevisionBadgeClass(status === "Completed" ? status : priority);

    let subText = `Subject: ${subject}`;
    if (description) {
        subText += ` • ${description}`;
    }
    if (date) {
        subText += ` • Revision date: ${date}`;
    }

    topicItem.innerHTML = `
        <div class="revision-topic-info">
            <h4>${title}</h4>
            <p>${subText}</p>
        </div>
        <span class="revision-topic-badge ${badgeClass}">${status === "Completed" ? "Completed" : priority}</span>
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
    revisionTopicList.innerHTML = "";
    topics.forEach((topic) => {
        const topicItem = createRevisionTopicItem(topic);
        revisionTopicList.appendChild(topicItem);
    });
    updateRevisionCounts();
    applyRevisionFilters();
}

function getRevisionTopicsFromStorage() {
    const saved = localStorage.getItem(REVISION_STORAGE_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse revision topics from localStorage:", error);
        return null;
    }
}

function saveRevisionTopicsToStorage(topics) {
    localStorage.setItem(REVISION_STORAGE_KEY, JSON.stringify(topics));
}

function extractTopicsFromDOM() {
    const topicItems = revisionTopicList.querySelectorAll(".revision-topic-item");
    const topics = [];

    topicItems.forEach((topicItem) => {
        const title = topicItem.querySelector(".revision-topic-info h4")?.textContent.trim() || "";
        const fullText = topicItem.querySelector(".revision-topic-info p")?.textContent.trim() || "";
        const badgeText = topicItem.querySelector(".revision-topic-badge")?.textContent.trim() || "Pending";

        let subject = "";
        let description = "";
        let date = "";

        const parts = fullText.split("•").map((part) => part.trim()).filter(Boolean);

        if (parts.length > 0 && parts[0].startsWith("Subject:")) {
            subject = parts[0].replace("Subject:", "").trim();
        }

        parts.slice(1).forEach((part) => {
            if (part.startsWith("Revision date:")) {
                date = part.replace("Revision date:", "").trim();
            } else {
                description = description ? `${description} • ${part}` : part;
            }
        });

        const status = badgeText === "Completed" ? "Completed" : "Pending";
        const priority = badgeText === "Completed" ? "Pending" : badgeText;

        topics.push({
            id: generateRevisionId(),
            title,
            subject,
            priority,
            date,
            status,
            description
        });
    });

    return topics;
}

function loadRevisionTopics() {
    const storedTopics = getRevisionTopicsFromStorage();

    if (storedTopics && Array.isArray(storedTopics)) {
        renderRevisionTopics(storedTopics);
        return;
    }

    const initialTopics = extractTopicsFromDOM();
    saveRevisionTopicsToStorage(initialTopics);
    renderRevisionTopics(initialTopics);
}

function getCurrentRevisionTopics() {
    return getRevisionTopicsFromStorage() || [];
}

function addRevisionTopic(topicData) {
    const topics = getCurrentRevisionTopics();
    const newTopic = {
        id: generateRevisionId(),
        ...topicData
    };

    topics.unshift(newTopic);
    saveRevisionTopicsToStorage(topics);
    renderRevisionTopics(topics);
}

function updateRevisionTopic(topicId, updatedData) {
    const topics = getCurrentRevisionTopics().map((topic) =>
        topic.id === topicId ? { ...topic, ...updatedData } : topic
    );

    saveRevisionTopicsToStorage(topics);
    renderRevisionTopics(topics);
}

function deleteRevisionTopic(topicId) {
    const topics = getCurrentRevisionTopics().filter((topic) => topic.id !== topicId);
    saveRevisionTopicsToStorage(topics);
    renderRevisionTopics(topics);
}

function matchesRevisionFilter(topicItem, filterValue) {
    if (!filterValue || filterValue === "All Topics") return true;

    const dateValue = topicItem.dataset.date || "";
    const status = (topicItem.dataset.status || "").toLowerCase();
    const priority = (topicItem.dataset.priority || "").toLowerCase();

    if (filterValue === "Due Today") return dateValue === getTodayString();
    if (filterValue === "Completed") return status === "completed";
    if (filterValue === "Pending") return status === "pending";
    if (filterValue === "Weak Topics") return priority === "weak topic";

    return true;
}

function updateRevisionEmptyState(visibleCount) {
    if (!revisionEmptyState) return;

    if (visibleCount === 0) {
        revisionEmptyState.classList.remove("hidden");
    } else {
        revisionEmptyState.classList.add("hidden");
    }
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
    revisionSubjectInput.value = subject;
    revisionPriorityInput.value = priority;
    revisionDateInput.value = date;
    revisionStatusInput.value = status;
    revisionDescriptionInput.value = description;
}

if (
    openRevisionModalBtn &&
    revisionModalOverlay &&
    closeRevisionModalBtn &&
    cancelRevisionModalBtn &&
    revisionModalForm &&
    revisionTopicList
) {
    openRevisionModalBtn.addEventListener("click", function () {
        clearRevisionModalState();
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

    revisionModalForm.addEventListener("submit", function (event) {
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

        if (!date) {
            alert("Please select a revision date.");
            return;
        }

        const finalDescription = description || "Scheduled revision topic for better retention.";

        const revisionData = {
            title,
            subject,
            priority,
            date,
            status,
            description: finalDescription
        };

        if (editingRevisionId) {
            updateRevisionTopic(editingRevisionId, revisionData);
        } else {
            addRevisionTopic(revisionData);
        }

        closeRevisionModal();
        clearRevisionModalState();
    });

    revisionTopicList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".revision-topic-action-btn.delete");
        const editButton = event.target.closest(".revision-topic-action-btn.edit");

        if (deleteButton) {
            const topicItem = deleteButton.closest(".revision-topic-item");
            const topicId = topicItem?.dataset.revisionId;

            if (!topicId) return;

            const shouldDelete = confirm("Do you want to delete this revision topic?");
            if (!shouldDelete) return;

            deleteRevisionTopic(topicId);
            return;
        }

        if (editButton) {
            const topicItem = editButton.closest(".revision-topic-item");
            if (!topicItem) return;

            setEditRevisionMode();
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

    loadRevisionTopics();
    setAddRevisionMode();
}