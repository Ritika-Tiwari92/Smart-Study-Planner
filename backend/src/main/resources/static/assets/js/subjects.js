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

const SUBJECTS_STORAGE_KEY = "edumind_subjects";

let editingSubjectId = null;

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
}

function clearSubjectModalState() {
    resetSubjectForm();
    setAddMode();
}

function generateSubjectId() {
    return `subject_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    subjectsGrid.innerHTML = "";
    subjects.forEach((subject) => {
        const subjectCard = createSubjectCard(subject);
        subjectsGrid.appendChild(subjectCard);
    });
    updateSubjectCounts();
    applySubjectFilters();
}

function getSubjectsFromStorage() {
    const saved = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse subjects from localStorage:", error);
        return null;
    }
}

function saveSubjectsToStorage(subjects) {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
}

function extractSubjectsFromDOM() {
    const subjectCards = subjectsGrid.querySelectorAll(".subject-card");
    const subjects = [];

    subjectCards.forEach((subjectCard) => {
        const name = subjectCard.querySelector("h3")?.textContent.trim() || "";
        const description = subjectCard.querySelector("p")?.textContent.trim() || "";
        const metaEls = subjectCard.querySelectorAll(".subject-meta span");

        const chaptersText = metaEls[0]?.textContent.trim() || "0 Chapters";
        const progressText = metaEls[1]?.textContent.trim() || "0% Done";
        const iconClass = subjectCard.querySelector(".subject-icon i")?.className.split(" ").pop() || "fa-code";

        const chapters = parseInt(chaptersText, 10) || 0;
        const progress = parseInt(progressText, 10) || 0;

        subjects.push({
            id: generateSubjectId(),
            name,
            chapters,
            progress,
            iconClass,
            description,
            code: ""
        });
    });

    return subjects;
}

function loadSubjects() {
    const storedSubjects = getSubjectsFromStorage();

    if (storedSubjects && Array.isArray(storedSubjects)) {
        renderSubjects(storedSubjects);
        return;
    }

    const initialSubjects = extractSubjectsFromDOM();
    saveSubjectsToStorage(initialSubjects);
    renderSubjects(initialSubjects);
}

function getCurrentSubjects() {
    return getSubjectsFromStorage() || [];
}

function addSubject(subjectData) {
    const subjects = getCurrentSubjects();
    const newSubject = {
        id: generateSubjectId(),
        ...subjectData
    };

    subjects.unshift(newSubject);
    saveSubjectsToStorage(subjects);
    renderSubjects(subjects);
}

function updateSubject(subjectId, updatedData) {
    const subjects = getCurrentSubjects().map((subject) =>
        subject.id === subjectId ? { ...subject, ...updatedData } : subject
    );

    saveSubjectsToStorage(subjects);
    renderSubjects(subjects);
}

function deleteSubject(subjectId) {
    const subjects = getCurrentSubjects().filter((subject) => subject.id !== subjectId);
    saveSubjectsToStorage(subjects);
    renderSubjects(subjects);
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

    subjectModalForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = subjectNameInput.value.trim();
        const code = subjectCodeInput.value.trim();
        const chapters = subjectChaptersInput.value.trim();
        const progress = getSafeProgress(subjectProgressInput.value);
        const iconClass = subjectIconInput.value;
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
            description ||
            `Subject code: ${code || "N/A"} • Manage chapters and track study progress.`;

        const subjectData = {
            name,
            chapters,
            progress,
            iconClass,
            description: finalDescription,
            code
        };

        if (editingSubjectId) {
            updateSubject(editingSubjectId, subjectData);
        } else {
            addSubject(subjectData);
        }

        closeSubjectModal();
        clearSubjectModalState();
    });

    subjectsGrid.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".subject-action-btn.delete");
        const editButton = event.target.closest(".subject-action-btn.edit, .subject-action-btn:not(.delete)");

        if (deleteButton) {
            const subjectCard = deleteButton.closest(".subject-card");
            const subjectId = subjectCard?.dataset.subjectId;

            if (!subjectId) return;

            const shouldDelete = confirm("Do you want to delete this subject?");
            if (!shouldDelete) return;

            deleteSubject(subjectId);
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