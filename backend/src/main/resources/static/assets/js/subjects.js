const openSubjectModalBtn = document.getElementById("openSubjectModalBtn");
const subjectModalOverlay = document.getElementById("subjectModalOverlay");
const closeSubjectModalBtn = document.getElementById("closeSubjectModalBtn");
const cancelSubjectModalBtn = document.getElementById("cancelSubjectModalBtn");

const subjectModalForm = document.getElementById("subjectModalForm");
const subjectModalTitle = document.getElementById("subjectModalTitle");
const subjectSaveBtn = document.getElementById("subjectSaveBtn");

const subjectsGrid = document.getElementById("subjectsGrid");
const subjectsEmptyState = document.getElementById("subjectsEmptyState");
const subjectSearchInput = document.getElementById("subjectSearchInput");
const subjectFilterSelect = document.getElementById("subjectFilterSelect");

const totalSubjectsCount = document.getElementById("totalSubjectsCount");
const completedSubjectsCount = document.getElementById("completedSubjectsCount");
const inProgressSubjectsCount = document.getElementById("inProgressSubjectsCount");
const averageProgressCount = document.getElementById("averageProgressCount");

const subjectNameInput = document.getElementById("subjectName");
const subjectCodeInput = document.getElementById("subjectCode");
const subjectChaptersInput = document.getElementById("subjectChapters");
const subjectProgressInput = document.getElementById("subjectProgress");
const subjectIconInput = document.getElementById("subjectIcon");
const subjectDescriptionInput = document.getElementById("subjectDescription");

const SUBJECTS_API_BASE = "http://localhost:8080/subjects";

let editingSubjectId = null;



function getStoredUserObject() {
    const rawValue = localStorage.getItem("edumind_logged_in_user");

    if (!rawValue) {
        return null;
    }

    try {
        return JSON.parse(rawValue);
    } catch (error) {
        console.error("Failed to parse edumind_logged_in_user:", error);
        return null;
    }
}

function extractUserIdFromObject(obj) {
    if (!obj || typeof obj !== "object") return null;

    if (obj.id != null && obj.id !== "") return Number(obj.id);
    if (obj.userId != null && obj.userId !== "") return Number(obj.userId);

    if (obj.user && obj.user.id != null && obj.user.id !== "") {
        return Number(obj.user.id);
    }

    if (obj.data && obj.data.id != null && obj.data.id !== "") {
        return Number(obj.data.id);
    }

    return null;
}

function getCurrentUserId() {
    const user = getStoredUserObject();

    if (user && user.id != null && user.id !== "") {
        return Number(user.id);
    }

    throw new Error("Logged-in user id not found in localStorage.");
}
function buildSubjectsApiUrl(subjectId = "") {
    const userId = getCurrentUserId();
    const normalizedPath = subjectId ? `/${subjectId}` : "";
    return `${SUBJECTS_API_BASE}${normalizedPath}?userId=${encodeURIComponent(userId)}`;
}

function openSubjectModal() {
    if (!subjectModalOverlay) return;
    subjectModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeSubjectModal() {
    if (!subjectModalOverlay) return;
    subjectModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddMode() {
    editingSubjectId = null;
    if (subjectModalTitle) subjectModalTitle.textContent = "Add New Subject";
    if (subjectSaveBtn) subjectSaveBtn.textContent = "Save Subject";
}

function setEditMode() {
    if (subjectModalTitle) subjectModalTitle.textContent = "Edit Subject";
    if (subjectSaveBtn) subjectSaveBtn.textContent = "Update Subject";
}

function resetSubjectForm() {
    if (!subjectModalForm) return;
    subjectModalForm.reset();

    if (subjectIconInput) {
        subjectIconInput.value = "fa-code";
    }

    if (subjectProgressInput) {
        subjectProgressInput.value = "0";
    }
}

function clearSubjectModalState() {
    resetSubjectForm();
    setAddMode();
}

function getSubjectStatus(progress) {
    if (progress >= 100) return "completed";
    if (progress > 0) return "in-progress";
    return "pending";
}

function getSafeProgress(progress) {
    const value = Number(progress);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function getDefaultDescription(code) {
    return `Subject code: ${code || "N/A"} • Manage chapters and track study progress.`;
}

function mapBackendSubjectToFrontend(subject) {
    const code = subject.code || "";
    const description = subject.description || getDefaultDescription(code);

    return {
        id: subject.id,
        name: subject.name || subject.subjectName || "",
        code,
        chapters: Number(subject.chapters) || 0,
        progress: getSafeProgress(subject.progress),
        iconClass: subject.iconClass || "fa-code",
        description,
        difficultyLevel: subject.difficultyLevel || ""
    };
}

function buildBackendPayload(subjectData) {
    return {
        name: subjectData.name,
        code: subjectData.code || "",
        chapters: Number(subjectData.chapters) || 0,
        progress: getSafeProgress(subjectData.progress),
        iconClass: subjectData.iconClass || "fa-code",
        description: subjectData.description || getDefaultDescription(subjectData.code),
        difficultyLevel: subjectData.difficultyLevel || ""
    };
}

async function handleApiResponse(response) {
    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const errorText = await response.text();
            if (errorText) {
                message = errorText;
            }
        } catch (error) {
            console.error("Failed to read error response:", error);
        }

        throw new Error(message);
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

async function fetchSubjectsFromApi() {
    const response = await fetch(buildSubjectsApiUrl());
    const data = await handleApiResponse(response);

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map(mapBackendSubjectToFrontend);
}

async function createSubjectInApi(subjectData) {
    const response = await fetch(buildSubjectsApiUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildBackendPayload(subjectData))
    });

    return handleApiResponse(response);
}

async function updateSubjectInApi(subjectId, subjectData) {
    const response = await fetch(buildSubjectsApiUrl(subjectId), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildBackendPayload(subjectData))
    });

    return handleApiResponse(response);
}

async function deleteSubjectFromApi(subjectId) {
    const response = await fetch(buildSubjectsApiUrl(subjectId), {
        method: "DELETE"
    });

    return handleApiResponse(response);
}

function createSubjectCard({ id, name, chapters, progress, iconClass, description, code = "" }) {
    const subjectCard = document.createElement("div");
    subjectCard.className = "subject-card";

    const safeProgress = getSafeProgress(progress);

    subjectCard.innerHTML = `
        <div class="subject-card-top">
            <div class="subject-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>

            <div class="subject-actions">
                <button class="subject-action-btn edit" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="subject-action-btn delete" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>

        <h3>${name}</h3>
        <p>${description}</p>
        <div class="subject-meta">
            <span>${chapters} Chapters</span>
            <span>${safeProgress}% Done</span>
        </div>
        <div class="subject-progress-bar">
            <div class="subject-progress-fill" style="width: ${safeProgress}%;"></div>
        </div>
    `;

    subjectCard.dataset.subjectId = id;
    subjectCard.dataset.progress = String(safeProgress);
    subjectCard.dataset.status = getSubjectStatus(safeProgress);
    subjectCard.dataset.icon = iconClass;
    subjectCard.dataset.code = code;
    subjectCard.dataset.chapters = String(chapters);
    subjectCard.dataset.description = description;

    return subjectCard;
}

function renderSubjects(subjects) {
    if (!subjectsGrid) return;

    subjectsGrid.innerHTML = "";

    subjects.forEach((subject) => {
        const subjectCard = createSubjectCard(subject);
        subjectsGrid.appendChild(subjectCard);
    });

    updateSubjectCounts();
    applySubjectFilters();
}

async function loadSubjects() {
    try {
        const subjects = await fetchSubjectsFromApi();
        renderSubjects(subjects);
        updateSubjectsEmptyState(subjects.length);
    } catch (error) {
        console.error("Failed to load subjects:", error);

        if (subjectsGrid) {
            subjectsGrid.innerHTML = "";
        }

        updateSubjectCounts();
        updateSubjectsEmptyState(0);
        alert("Failed to load subjects from backend.");
    }
}

async function addSubject(subjectData) {
    await createSubjectInApi(subjectData);
    await loadSubjects();
}

async function updateSubject(subjectId, updatedData) {
    await updateSubjectInApi(subjectId, updatedData);
    await loadSubjects();
}

async function deleteSubject(subjectId) {
    await deleteSubjectFromApi(subjectId);
    await loadSubjects();
}

function updateSubjectCounts() {
    if (!subjectsGrid) return;

    const subjectCards = subjectsGrid.querySelectorAll(".subject-card");
    const total = subjectCards.length;

    let completed = 0;
    let inProgress = 0;
    let totalProgress = 0;

    subjectCards.forEach((card) => {
        const progress = Number(card.dataset.progress || 0);
        totalProgress += progress;

        if (progress >= 100) {
            completed++;
        } else {
            inProgress++;
        }
    });

    const average = total > 0 ? Math.round(totalProgress / total) : 0;

    if (totalSubjectsCount) {
        totalSubjectsCount.textContent = String(total).padStart(2, "0");
    }

    if (completedSubjectsCount) {
        completedSubjectsCount.textContent = String(completed).padStart(2, "0");
    }

    if (inProgressSubjectsCount) {
        inProgressSubjectsCount.textContent = String(inProgress).padStart(2, "0");
    }

    if (averageProgressCount) {
        averageProgressCount.textContent = `${average}%`;
    }
}

function fillSubjectFormForEdit(subjectCard) {
    editingSubjectId = subjectCard.dataset.subjectId || null;

    const titleEl = subjectCard.querySelector("h3");
    const descEl = subjectCard.querySelector("p");

    subjectNameInput.value = titleEl?.textContent.trim() || "";
    subjectCodeInput.value = subjectCard.dataset.code || "";
    subjectChaptersInput.value = subjectCard.dataset.chapters || "";
    subjectProgressInput.value = subjectCard.dataset.progress || "";
    subjectIconInput.value = subjectCard.dataset.icon || "fa-code";
    subjectDescriptionInput.value = descEl?.textContent.trim() || "";
}

function matchesSubjectFilter(subjectCard, filterValue) {
    if (!filterValue || filterValue === "All Subjects") return true;

    const status = subjectCard.dataset.status || "";

    if (filterValue === "Completed") return status === "completed";
    if (filterValue === "In Progress") return status === "in-progress";
    if (filterValue === "Pending") return status === "pending";

    return true;
}

function updateSubjectsEmptyState(visibleCount) {
    if (!subjectsEmptyState) return;

    if (visibleCount === 0) {
        subjectsEmptyState.classList.remove("hidden");
    } else {
        subjectsEmptyState.classList.add("hidden");
    }
}

function applySubjectFilters() {
    if (!subjectsGrid) return;

    const subjectCards = subjectsGrid.querySelectorAll(".subject-card");
    const searchText = subjectSearchInput ? subjectSearchInput.value.toLowerCase().trim() : "";
    const filterValue = subjectFilterSelect ? subjectFilterSelect.value : "All Subjects";

    let visibleCount = 0;

    subjectCards.forEach((subjectCard) => {
        const title = subjectCard.querySelector("h3")?.textContent.toLowerCase() || "";
        const description = subjectCard.querySelector("p")?.textContent.toLowerCase() || "";

        const matchesSearch = title.includes(searchText) || description.includes(searchText);
        const passesFilter = matchesSubjectFilter(subjectCard, filterValue);

        if (matchesSearch && passesFilter) {
            subjectCard.style.display = "";
            visibleCount++;
        } else {
            subjectCard.style.display = "none";
        }
    });

    updateSubjectsEmptyState(visibleCount);
}

if (
    openSubjectModalBtn &&
    subjectModalOverlay &&
    closeSubjectModalBtn &&
    cancelSubjectModalBtn &&
    subjectModalForm &&
    subjectsGrid
) {
    openSubjectModalBtn.addEventListener("click", function () {
        clearSubjectModalState();
        openSubjectModal();
    });

    closeSubjectModalBtn.addEventListener("click", function () {
        closeSubjectModal();
        clearSubjectModalState();
    });

    cancelSubjectModalBtn.addEventListener("click", function () {
        closeSubjectModal();
        clearSubjectModalState();
    });

    subjectModalOverlay.addEventListener("click", function (event) {
        if (event.target === subjectModalOverlay) {
            closeSubjectModal();
            clearSubjectModalState();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !subjectModalOverlay.classList.contains("hidden")) {
            closeSubjectModal();
            clearSubjectModalState();
        }
    });

    subjectModalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = subjectNameInput.value.trim();
        const code = subjectCodeInput.value.trim();
        const chapters = subjectChaptersInput.value.trim();
        const progress = getSafeProgress(subjectProgressInput.value);
        const iconClass = subjectIconInput.value.trim();
        const description = subjectDescriptionInput.value.trim();

        if (!name) {
            alert("Please enter a subject name.");
            return;
        }

        if (!chapters) {
            alert("Please enter total chapters.");
            return;
        }

        const finalDescription =
            description || getDefaultDescription(code);

        const subjectData = {
            name,
            chapters,
            progress,
            iconClass,
            description: finalDescription,
            code,
            difficultyLevel: ""
        };

        try {
            if (editingSubjectId) {
                await updateSubject(editingSubjectId, subjectData);
            } else {
                await addSubject(subjectData);
            }

            closeSubjectModal();
            clearSubjectModalState();
        } catch (error) {
            console.error("Failed to save subject:", error);
            alert(`Failed to save subject: ${error.message}`);
        }
    });

    subjectsGrid.addEventListener("click", async function (event) {
        const deleteButton = event.target.closest(".subject-action-btn.delete");
        const editButton = event.target.closest(".subject-action-btn.edit, .subject-action-btn:not(.delete)");

        if (deleteButton) {
            const subjectCard = deleteButton.closest(".subject-card");
            const subjectId = subjectCard?.dataset.subjectId;

            if (!subjectId) return;

            const shouldDelete = confirm("Do you want to delete this subject?");
            if (!shouldDelete) return;

            try {
                await deleteSubject(subjectId);
            } catch (error) {
                console.error("Failed to delete subject:", error);
                alert("Failed to delete subject.");
            }
            return;
        }

        if (editButton) {
            const subjectCard = editButton.closest(".subject-card");
            if (!subjectCard) return;

            setEditMode();
            fillSubjectFormForEdit(subjectCard);
            openSubjectModal();
        }
    });

    if (subjectSearchInput) {
        subjectSearchInput.addEventListener("input", applySubjectFilters);
    }

    if (subjectFilterSelect) {
        subjectFilterSelect.addEventListener("change", applySubjectFilters);
    }

    loadSubjects();
    setAddMode();
}