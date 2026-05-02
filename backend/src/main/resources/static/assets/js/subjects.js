/**
 * subjects.js — EduMind AI
 * Updated: fetch() → fetchWithAuth() for auto token refresh
 * Everything else unchanged.
 */

// ─────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────
const openSubjectModalBtn     = document.getElementById("openSubjectModalBtn");
const subjectModalOverlay     = document.getElementById("subjectModalOverlay");
const closeSubjectModalBtn    = document.getElementById("closeSubjectModalBtn");
const cancelSubjectModalBtn   = document.getElementById("cancelSubjectModalBtn");
const subjectModalForm        = document.getElementById("subjectModalForm");
const subjectModalTitle       = document.getElementById("subjectModalTitle");
const subjectSaveBtn          = document.getElementById("subjectSaveBtn");

const subjectsGrid            = document.getElementById("subjectsGrid");
const subjectsEmptyState      = document.getElementById("subjectsEmptyState");
const subjectSearchInput      = document.getElementById("subjectSearchInput");
const subjectFilterSelect     = document.getElementById("subjectFilterSelect");

const totalSubjectsCount      = document.getElementById("totalSubjectsCount");
const completedSubjectsCount  = document.getElementById("completedSubjectsCount");
const inProgressSubjectsCount = document.getElementById("inProgressSubjectsCount");
const averageProgressCount    = document.getElementById("averageProgressCount");

// Form fields
const subjectNameInput        = document.getElementById("subjectName");
const subjectCodeInput        = document.getElementById("subjectCode");
const subjectChaptersInput    = document.getElementById("subjectChapters");
const subjectProgressInput    = document.getElementById("subjectProgress");
const subjectIconInput        = document.getElementById("subjectIcon");
const subjectDescriptionInput = document.getElementById("subjectDescription");

// Syllabus upload fields
const syllabusUploadToggle    = document.getElementById("syllabusUploadToggle");
const syllabusUploadArea      = document.getElementById("syllabusUploadArea");
const syllabusDropzone        = document.getElementById("syllabusDropzone");
const syllabusFileInput       = document.getElementById("syllabusFileInput");
const syllabusFilePreview     = document.getElementById("syllabusFilePreview");
const syllabusFileName        = document.getElementById("syllabusFileName");
const syllabusFileSize        = document.getElementById("syllabusFileSize");
const syllabusRemoveBtn       = document.getElementById("syllabusRemoveBtn");
const syllabusFileError       = document.getElementById("syllabusFileError");
const syllabusChaptersPreview = document.getElementById("syllabusChaptersPreview");
const chaptersList            = document.getElementById("chaptersList");
const chaptersCountBadge      = document.getElementById("chaptersCountBadge");

// ─────────────────────────────────────────────
// API CONFIG
// ─────────────────────────────────────────────
const SUBJECTS_API = "/api/subjects";
const SYLLABUS_API = "/api/syllabus";

let editingSubjectId   = null;
let selectedSyllabusFile = null;

// ─────────────────────────────────────────────
// MODAL OPEN / CLOSE
// ─────────────────────────────────────────────
function openSubjectModal() {
    subjectModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeSubjectModal() {
    subjectModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddMode() {
    editingSubjectId = null;
    if (subjectModalTitle) subjectModalTitle.textContent = "Add New Subject";
    if (subjectSaveBtn)    subjectSaveBtn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Save Subject';
}

function setEditMode() {
    if (subjectModalTitle) subjectModalTitle.textContent = "Edit Subject";
    if (subjectSaveBtn)    subjectSaveBtn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Update Subject';
}

function resetSubjectForm() {
    subjectModalForm.reset();
    subjectIconInput.value = "fa-code";
    subjectProgressInput.value = "0";
    selectedSyllabusFile = null;
    resetSyllabusUploadUI();
    hideFieldErrors();
}

function clearSubjectModalState() {
    resetSubjectForm();
    setAddMode();
}

// ─────────────────────────────────────────────
// SYLLABUS UPLOAD UI
// ─────────────────────────────────────────────
if (syllabusUploadToggle) {
    syllabusUploadToggle.addEventListener("change", function () {
        if (this.checked) {
            syllabusUploadArea.classList.remove("hidden");
        } else {
            syllabusUploadArea.classList.add("hidden");
            resetSyllabusUploadUI();
        }
    });
}

function resetSyllabusUploadUI() {
    selectedSyllabusFile = null;
    if (syllabusFileInput)       syllabusFileInput.value = "";
    if (syllabusFilePreview)     syllabusFilePreview.classList.add("hidden");
    if (syllabusDropzone)        syllabusDropzone.classList.remove("hidden");
    if (syllabusFileError)       syllabusFileError.classList.add("hidden");
    if (syllabusChaptersPreview) syllabusChaptersPreview.classList.add("hidden");
    if (syllabusUploadToggle)    syllabusUploadToggle.checked = false;
    if (syllabusUploadArea)      syllabusUploadArea.classList.add("hidden");
}

if (syllabusFileInput) {
    syllabusFileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) handleSyllabusFileSelected(file);
    });
}

if (syllabusRemoveBtn) {
    syllabusRemoveBtn.addEventListener("click", function () {
        resetSyllabusUploadUI();
        if (syllabusUploadToggle) syllabusUploadToggle.checked = true;
        if (syllabusUploadArea)   syllabusUploadArea.classList.remove("hidden");
    });
}

if (syllabusDropzone) {
    syllabusDropzone.addEventListener("dragover", function (e) {
        e.preventDefault();
        syllabusDropzone.classList.add("dragover");
    });
    syllabusDropzone.addEventListener("dragleave", function () {
        syllabusDropzone.classList.remove("dragover");
    });
    syllabusDropzone.addEventListener("drop", function (e) {
        e.preventDefault();
        syllabusDropzone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleSyllabusFileSelected(file);
    });
}

function handleSyllabusFileSelected(file) {
    const allowed = ["pdf", "docx", "txt"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showSyllabusError("Invalid file type. Use PDF, DOCX, or TXT.");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showSyllabusError("File too large. Maximum size is 10MB.");
        return;
    }
    selectedSyllabusFile = file;
    syllabusFileName.textContent = file.name;
    syllabusFileSize.textContent = formatFileSize(file.size);
    syllabusFilePreview.classList.remove("hidden");
    syllabusDropzone.classList.add("hidden");
    syllabusFileError.classList.add("hidden");
}

function showSyllabusError(msg) {
    syllabusFileError.textContent = msg;
    syllabusFileError.classList.remove("hidden");
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// ─────────────────────────────────────────────
// FIELD VALIDATION UI
// ─────────────────────────────────────────────
function showFieldError(errorElementId, message) {
    const el = document.getElementById(errorElementId);
    if (el) { el.textContent = message; el.classList.remove("hidden"); }
}

function hideFieldErrors() {
    document.querySelectorAll(".field-error").forEach(el => el.classList.add("hidden"));
}

// ─────────────────────────────────────────────
// API RESPONSE HANDLER
// ─────────────────────────────────────────────
async function handleApiResponse(response) {
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const text = await response.text();
            if (text) message = text;
        } catch (_) {}
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("application/json")
        ? response.json()
        : response.text();
}

// ─────────────────────────────────────────────
// SUBJECT API CALLS — using fetchWithAuth()
// fetchWithAuth() is defined in auth-guard.js
// It auto-refreshes token on 401
// ─────────────────────────────────────────────

async function fetchSubjectsFromApi() {
    // fetchWithAuth auto-adds Authorization header
    const response = await fetchWithAuth(SUBJECTS_API);
    const data = await handleApiResponse(response);
    return Array.isArray(data) ? data.map(mapBackendSubject) : [];
}

async function createSubjectInApi(subjectData) {
    const response = await fetchWithAuth(SUBJECTS_API, {
        method: "POST",
        body: JSON.stringify(buildPayload(subjectData))
    });
    return handleApiResponse(response);
}

async function updateSubjectInApi(subjectId, subjectData) {
    const response = await fetchWithAuth(`${SUBJECTS_API}/${subjectId}`, {
        method: "PUT",
        body: JSON.stringify(buildPayload(subjectData))
    });
    return handleApiResponse(response);
}

async function deleteSubjectFromApi(subjectId) {
    const response = await fetchWithAuth(`${SUBJECTS_API}/${subjectId}`, {
        method: "DELETE"
    });
    return handleApiResponse(response);
}

// ─────────────────────────────────────────────
// SYLLABUS API CALLS
// Note: FormData upload needs special handling —
// fetchWithAuth used but Content-Type NOT set manually
// (browser sets multipart/form-data with boundary automatically)
// ─────────────────────────────────────────────
async function uploadSyllabusForSubject(subjectId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = (localStorage.getItem("token") || "").trim();

    // Can't use fetchWithAuth here directly because
    // Content-Type must NOT be set for FormData
    const response = await fetch(`${SYLLABUS_API}/upload/${subjectId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });
    return handleApiResponse(response);
}

async function fetchChaptersForSubject(subjectId) {
    const response = await fetchWithAuth(`${SYLLABUS_API}/${subjectId}/chapters`);
    return handleApiResponse(response);
}

// ─────────────────────────────────────────────
// DATA MAPPING
// ─────────────────────────────────────────────
function mapBackendSubject(s) {
    return {
        id:             s.id,
        name:           s.subjectName || s.name || "",
        code:           s.code || "",
        chapters:       Number(s.chapters) || 0,
        progress:       getSafeProgress(s.progress),
        iconClass:      s.iconClass || "fa-book",
        description:    s.description || "",
        difficultyLevel: s.difficultyLevel || "",
        hasSyllabus:    !!s.syllabusFile
    };
}

function buildPayload(d) {
    return {
        name:           d.name,
        code:           d.code || "",
        chapters:       Number(d.chapters) || 0,
        progress:       getSafeProgress(d.progress),
        iconClass:      d.iconClass || "fa-code",
        description:    d.description || `Subject: ${d.name}`,
        difficultyLevel: d.difficultyLevel || ""
    };
}

function getSafeProgress(p) {
    const v = Number(p);
    return isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
}

function getSubjectStatus(progress) {
    if (progress >= 100) return "completed";
    if (progress > 0)    return "in-progress";
    return "pending";
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function createSubjectCard({ id, name, chapters, progress, iconClass,
                              description, code, hasSyllabus }) {
    const card = document.createElement("div");
    card.className = "subject-card";
    const safe = getSafeProgress(progress);

    card.innerHTML = `
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
            <span>${safe}% Done</span>
            ${hasSyllabus
                ? '<span class="syllabus-badge"><i class="fa-solid fa-file-lines"></i> Syllabus</span>'
                : ""}
        </div>
        <div class="subject-progress-bar">
            <div class="subject-progress-fill" style="width: ${safe}%;"></div>
        </div>
    `;

    card.dataset.subjectId   = id;
    card.dataset.progress    = String(safe);
    card.dataset.status      = getSubjectStatus(safe);
    card.dataset.icon        = iconClass;
    card.dataset.code        = code;
    card.dataset.chapters    = String(chapters);
    card.dataset.description = description;
    card.dataset.hasSyllabus = hasSyllabus ? "true" : "false";

    return card;
}

function renderSubjects(subjects) {
    subjectsGrid.innerHTML = "";
    subjects.forEach(s => subjectsGrid.appendChild(createSubjectCard(s)));
    updateSubjectCounts();
    applySubjectFilters();
}

async function loadSubjects() {
    try {
        const subjects = await fetchSubjectsFromApi();
        renderSubjects(subjects);
        updateSubjectsEmptyState(subjects.length);
        localStorage.setItem("edumind_subjects_updated", Date.now().toString());
    } catch (err) {
        console.error("Failed to load subjects:", err);
        subjectsGrid.innerHTML = "";
        updateSubjectCounts();
        updateSubjectsEmptyState(0);
        showToast("Failed to load subjects. Please refresh.", "error");
    }
}

// ─────────────────────────────────────────────
// CHAPTER PREVIEW
// ─────────────────────────────────────────────
async function showChaptersPreview(subjectId) {
    try {
        const chapters = await fetchChaptersForSubject(subjectId);
        if (!chapters || chapters.length === 0) return;

        chaptersList.innerHTML = "";
        chapters.forEach(ch => {
            const li = document.createElement("li");
            li.className = "chapter-preview-item";
            li.innerHTML = `
                <span class="chapter-num">${ch.chapterNumber}</span>
                <span class="chapter-title">${ch.chapterTitle}</span>
                <span class="chapter-difficulty difficulty-${ch.difficulty}">
                    ${ch.difficulty}
                </span>
                <span class="chapter-hours">${ch.estimatedHours}h</span>
            `;
            chaptersList.appendChild(li);
        });

        chaptersCountBadge.textContent = chapters.length;
        syllabusChaptersPreview.classList.remove("hidden");
    } catch (err) {
        console.error("Could not load chapters preview:", err);
    }
}

// ─────────────────────────────────────────────
// COUNTS & FILTERS
// ─────────────────────────────────────────────
function updateSubjectCounts() {
    const cards = subjectsGrid.querySelectorAll(".subject-card");
    let total = cards.length, completed = 0, inProgress = 0, totalProg = 0;

    cards.forEach(card => {
        const p = Number(card.dataset.progress || 0);
        totalProg += p;
        if (p >= 100) completed++;
        else          inProgress++;
    });

    const avg = total > 0 ? Math.round(totalProg / total) : 0;

    if (totalSubjectsCount)      totalSubjectsCount.textContent      = String(total).padStart(2, "0");
    if (completedSubjectsCount)  completedSubjectsCount.textContent  = String(completed).padStart(2, "0");
    if (inProgressSubjectsCount) inProgressSubjectsCount.textContent = String(inProgress).padStart(2, "0");
    if (averageProgressCount)    averageProgressCount.textContent    = `${avg}%`;
}

function applySubjectFilters() {
    const cards       = subjectsGrid.querySelectorAll(".subject-card");
    const search      = subjectSearchInput?.value.toLowerCase().trim() || "";
    const filterValue = subjectFilterSelect?.value || "All Subjects";
    let visible = 0;

    cards.forEach(card => {
        const title  = card.querySelector("h3")?.textContent.toLowerCase() || "";
        const desc   = card.querySelector("p")?.textContent.toLowerCase()  || "";
        const status = card.dataset.status || "";

        const matchesSearch = title.includes(search) || desc.includes(search);
        let   passesFilter  = true;

        if (filterValue === "Completed")   passesFilter = status === "completed";
        if (filterValue === "In Progress") passesFilter = status === "in-progress";
        if (filterValue === "Pending")     passesFilter = status === "pending";

        if (matchesSearch && passesFilter) {
            card.style.display = "";
            visible++;
        } else {
            card.style.display = "none";
        }
    });

    updateSubjectsEmptyState(visible);
}

function updateSubjectsEmptyState(count) {
    if (!subjectsEmptyState) return;
    subjectsEmptyState.classList.toggle("hidden", count > 0);
}

// ─────────────────────────────────────────────
// FORM FILL FOR EDIT
// ─────────────────────────────────────────────
function fillSubjectFormForEdit(card) {
    editingSubjectId              = card.dataset.subjectId || null;
    subjectNameInput.value        = card.querySelector("h3")?.textContent.trim() || "";
    subjectCodeInput.value        = card.dataset.code        || "";
    subjectChaptersInput.value    = card.dataset.chapters    || "";
    subjectProgressInput.value    = card.dataset.progress    || "0";
    subjectIconInput.value        = card.dataset.icon        || "fa-code";
    subjectDescriptionInput.value = card.dataset.description || "";
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function showToast(message, type = "success") {
    let toast = document.getElementById("edumindToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "edumindToast";
        toast.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:9999;
            padding:12px 20px; border-radius:8px; font-size:14px;
            font-family:Poppins,sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.2);
            transition:opacity 0.3s; opacity:0; pointer-events:none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === "error" ? "#ef4444" : "#10b981";
    toast.style.color = "#fff";
    toast.style.opacity = "1";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = "0"; }, 3000);
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
if (openSubjectModalBtn) {
    openSubjectModalBtn.addEventListener("click", () => {
        clearSubjectModalState();
        openSubjectModal();
    });
}

if (closeSubjectModalBtn) {
    closeSubjectModalBtn.addEventListener("click", () => {
        closeSubjectModal();
        clearSubjectModalState();
    });
}

if (cancelSubjectModalBtn) {
    cancelSubjectModalBtn.addEventListener("click", () => {
        closeSubjectModal();
        clearSubjectModalState();
    });
}

if (subjectModalOverlay) {
    subjectModalOverlay.addEventListener("click", e => {
        if (e.target === subjectModalOverlay) {
            closeSubjectModal();
            clearSubjectModalState();
        }
    });
}

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && subjectModalOverlay &&
        !subjectModalOverlay.classList.contains("hidden")) {
        closeSubjectModal();
        clearSubjectModalState();
    }
});

// ─── FORM SUBMIT ────────────────────────────
if (subjectModalForm) {
    subjectModalForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        hideFieldErrors();

        const name        = subjectNameInput.value.trim();
        const code        = subjectCodeInput.value.trim();
        const chapters    = subjectChaptersInput.value.trim();
        const progress    = getSafeProgress(subjectProgressInput.value);
        const iconClass   = subjectIconInput.value.trim();
        const description = subjectDescriptionInput.value.trim();

        let hasError = false;
        if (!name) {
            showFieldError("subjectNameError", "Subject name is required.");
            hasError = true;
        }
        if (!chapters) {
            showFieldError("subjectChaptersError", "Please enter total chapters.");
            hasError = true;
        }
        if (hasError) return;

        const subjectData = { name, code, chapters, progress,
                              iconClass, description, difficultyLevel: "" };

        subjectSaveBtn.disabled = true;
        subjectSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            let savedSubject;

            if (editingSubjectId) {
                savedSubject = await updateSubjectInApi(editingSubjectId, subjectData);
            } else {
                savedSubject = await createSubjectInApi(subjectData);
            }

            if (syllabusUploadToggle?.checked && selectedSyllabusFile) {
                const subjectId = savedSubject.id || editingSubjectId;
                subjectSaveBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> Uploading syllabus...';
                try {
                    await uploadSyllabusForSubject(subjectId, selectedSyllabusFile);
                    await showChaptersPreview(subjectId);
                    showToast("Subject saved and syllabus uploaded successfully!");
                } catch (uploadErr) {
                    showToast(
                        "Subject saved, but syllabus upload failed: " + uploadErr.message,
                        "error");
                }
            } else {
                showToast(editingSubjectId
                    ? "Subject updated successfully!"
                    : "Subject added successfully!");
            }

            closeSubjectModal();
            clearSubjectModalState();
            await loadSubjects();

        } catch (err) {
            console.error("Save failed:", err);
            showToast("Failed to save subject: " + err.message, "error");
        } finally {
            subjectSaveBtn.disabled = false;
            subjectSaveBtn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save Subject';
        }
    });
}

// ─── CARD ACTIONS ───────────────────────────
if (subjectsGrid) {
    subjectsGrid.addEventListener("click", async function (e) {
        const deleteBtn = e.target.closest(".subject-action-btn.delete");
        const editBtn   = e.target.closest(".subject-action-btn.edit");

        if (deleteBtn) {
            const card = deleteBtn.closest(".subject-card");
            const id   = card?.dataset.subjectId;
            if (!id) return;
            if (!confirm("Delete this subject? This cannot be undone.")) return;
            try {
                await deleteSubjectFromApi(id);
                showToast("Subject deleted.");
                await loadSubjects();
            } catch (err) {
                showToast("Failed to delete: " + err.message, "error");
            }
            return;
        }

        if (editBtn) {
            const card = editBtn.closest(".subject-card");
            if (!card) return;
            setEditMode();
            fillSubjectFormForEdit(card);
            openSubjectModal();
        }
    });
}

// ─── SEARCH & FILTER ────────────────────────
if (subjectSearchInput)  subjectSearchInput.addEventListener("input", applySubjectFilters);
if (subjectFilterSelect) subjectFilterSelect.addEventListener("change", applySubjectFilters);

// ─── LOGOUT ─────────────────────────────────
document.getElementById("logoutBtn")?.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
});

document.getElementById("profileLogoutBtn")?.addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
});

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
loadSubjects();
setAddMode();