const openTestModalBtn = document.getElementById("openTestModalBtn");
const testModalOverlay = document.getElementById("testModalOverlay");
const closeTestModalBtn = document.getElementById("closeTestModalBtn");
const cancelTestModalBtn = document.getElementById("cancelTestModalBtn");

const testModalForm = document.getElementById("testModalForm");
const testModalTitle = document.getElementById("testModalTitle");
const testSaveBtn = document.getElementById("testSaveBtn");

const testList = document.getElementById("testList");
const testsEmptyState = document.getElementById("testsEmptyState");
const testSearchInput = document.getElementById("testSearchInput");
const testFilterSelect = document.getElementById("testFilterSelect");

const upcomingTestsCount = document.getElementById("upcomingTestsCount");
const thisWeekTestsCount = document.getElementById("thisWeekTestsCount");
const completedTestsCount = document.getElementById("completedTestsCount");
const averageScoreCount = document.getElementById("averageScoreCount");

const testTitleInput = document.getElementById("testTitle");
const testSubjectInput = document.getElementById("testSubject");
const testDateInput = document.getElementById("testDate");
const testTypeInput = document.getElementById("testType");
const testDurationInput = document.getElementById("testDuration");
const testDescriptionInput = document.getElementById("testDescription");

const testFocusAreaInput = document.getElementById("testFocusArea");
const testTipInput = document.getElementById("testTip");

const resultList = document.querySelector(".result-list");
const focusAreaList = document.querySelector(".focus-area-list");
const testTipList = document.querySelector(".test-tip-list");

const defaultRecentResultsHTML = resultList ? resultList.innerHTML : "";
const defaultFocusAreaHTML = focusAreaList ? focusAreaList.innerHTML : "";
const defaultTestTipHTML = testTipList ? testTipList.innerHTML : "";

const API_BASE_URL = "http://localhost:8080";
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;
const SUBJECTS_API_URL = `${API_BASE_URL}/subjects`;

let editingTestId = null;
let allTests = [];

function openTestModal() {
    if (!testModalOverlay) return;
    testModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeTestModal() {
    if (!testModalOverlay) return;
    testModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
}

function setAddTestMode() {
    editingTestId = null;
    if (testModalTitle) testModalTitle.textContent = "Add Test";
    if (testSaveBtn) testSaveBtn.textContent = "Save Test";
}

function setEditTestMode() {
    if (testModalTitle) testModalTitle.textContent = "Edit Test";
    if (testSaveBtn) testSaveBtn.textContent = "Update Test";
}

function resetTestForm() {
    if (!testModalForm) return;
    testModalForm.reset();

    if (testTypeInput) {
        testTypeInput.value = "Upcoming";
    }
}

function clearTestModalState() {
    resetTestForm();
    setAddTestMode();
}

function normalizeTestType(typeText) {
    const value = (typeText || "").trim().toLowerCase();

    if (value === "upcoming") return "Upcoming";
    if (value === "this week") return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed") return "Completed";

    return "Upcoming";
}

function getTestBadgeClass(type) {
    const value = (type || "").toLowerCase();

    if (value === "upcoming") return "upcoming";
    if (value === "this week") return "week";
    if (value === "mock test" || value === "mock tests") return "mock";
    if (value === "completed") return "upcoming";

    return "upcoming";
}

function getMonthShort(dateValue) {
    if (!dateValue) return "---";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "---";

    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function getDayNumber(dateValue) {
    if (!dateValue) return "--";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "--";

    return String(date.getDate()).padStart(2, "0");
}

function formatShortDate(dateValue) {
    if (!dateValue) return "Date not available";

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date not available";

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function sortTestsByDate(tests) {
    return [...tests].sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;

        const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime;
        const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime;

        if (safeATime !== safeBTime) {
            return safeATime - safeBTime;
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

function mapBackendTestToFrontend(test) {
    return {
        id: test.id,
        title: test.title || "",
        subject: test.subject || "",
        date: test.testDate || "",
        type: normalizeTestType(test.testType || ""),
        duration: test.duration || "",
        description: test.description || "",
        score: test.score ?? null,
        focusArea: test.focusArea || "",
        testTip: test.testTip || ""
    };
}

function buildBackendPayload(testData, existingTest = null) {
    return {
        title: testData.title,
        subject: testData.subject,
        testDate: testData.date,
        testType: normalizeTestType(testData.type),
        duration: testData.duration,
        description: testData.description,
        score: existingTest?.score ?? null,
        focusArea: testData.focusArea || null,
        testTip: testData.testTip || null
    };
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);

    let responseText = "";
    try {
        responseText = await response.text();
    } catch (error) {
        responseText = "";
    }

    if (!response.ok) {
        throw new Error(responseText || `HTTP ${response.status}`);
    }

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return null;
    }
}

function createTestItem({ id, title, subject, date, type, duration, description }) {
    const testItem = document.createElement("div");
    testItem.className = "test-item";
    testItem.dataset.testId = id;
    testItem.dataset.date = date || "";
    testItem.dataset.type = normalizeTestType(type);
    testItem.dataset.subject = subject || "";
    testItem.dataset.duration = duration || "";
    testItem.dataset.description = description || "";

    const badgeClass = getTestBadgeClass(type);
    const day = getDayNumber(date);
    const month = getMonthShort(date);

    const infoParts = [`Subject: ${subject || "-"}`];

    if (duration) {
        infoParts.push(`Duration: ${duration}`);
    }

    if (description) {
        infoParts.push(description);
    }

    testItem.innerHTML = `
        <div class="test-date-box">
            <span>${day}</span>
            <small>${month}</small>
        </div>
        <div class="test-info">
            <h4>${escapeHtml(title || "Untitled Test")}</h4>
            <p>${escapeHtml(infoParts.join(" • "))}</p>
        </div>
        <span class="test-badge ${badgeClass}">${escapeHtml(normalizeTestType(type))}</span>
        <div class="test-actions">
            <button class="test-action-btn edit" title="Edit">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="test-action-btn delete" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;

    return testItem;
}

function updateTestsCounts() {
    let upcoming = 0;
    let thisWeek = 0;
    let completed = 0;
    let totalScore = 0;
    let scoreCount = 0;

    allTests.forEach((test) => {
        const type = normalizeTestType(test.type);

        if (type === "Upcoming" || type === "This Week" || type === "Mock Test") {
            upcoming++;
        }

        if (type === "This Week") {
            thisWeek++;
        }

        if (type === "Completed") {
            completed++;

            const numericScore = Number(test.score);
            if (Number.isFinite(numericScore)) {
                totalScore += numericScore;
                scoreCount++;
            }
        }
    });

    const averageScore = scoreCount > 0
        ? Math.round(totalScore / scoreCount)
        : (completed > 0 ? 80 : 76);

    if (upcomingTestsCount) {
        upcomingTestsCount.textContent = String(upcoming).padStart(2, "0");
    }

    if (thisWeekTestsCount) {
        thisWeekTestsCount.textContent = String(thisWeek).padStart(2, "0");
    }

    if (completedTestsCount) {
        completedTestsCount.textContent = String(completed).padStart(2, "0");
    }

    if (averageScoreCount) {
        averageScoreCount.textContent = `${averageScore}%`;
    }
}

function renderRecentResults() {
    if (!resultList) return;

    const completedTests = [...allTests]
        .filter((test) => normalizeTestType(test.type) === "Completed")
        .sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
        })
        .slice(0, 3);

    if (completedTests.length === 0) {
        resultList.innerHTML = defaultRecentResultsHTML;
        return;
    }

    resultList.innerHTML = completedTests.map((test) => {
        const scoreText =
            test.score !== null &&
            test.score !== undefined &&
            !Number.isNaN(Number(test.score))
                ? `${Math.round(Number(test.score))}%`
                : "--%";

        const completedDateText = test.date
            ? `Completed on ${formatShortDate(test.date)}`
            : "Completed test";

        return `
            <div class="result-item">
                <div class="result-info">
                    <h4>${escapeHtml(test.title || "Completed Test")}</h4>
                    <p>${escapeHtml(completedDateText)}</p>
                </div>
                <span class="result-score">${escapeHtml(scoreText)}</span>
            </div>
        `;
    }).join("");
}

function renderFocusAreas() {
    if (!focusAreaList) return;

    const activeTypes = ["Upcoming", "This Week", "Mock Test"];

    const focusAreas = [
        ...new Set(
            allTests
                .filter((test) => activeTypes.includes(normalizeTestType(test.type)))
                .map((test) => (test.focusArea || "").trim())
                .filter(Boolean)
        )
    ].slice(0, 3);

    if (focusAreas.length === 0) {
        focusAreaList.innerHTML = defaultFocusAreaHTML;
        return;
    }

    focusAreaList.innerHTML = focusAreas.map((area) => `
        <div class="focus-area-item">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${escapeHtml(area)}</span>
        </div>
    `).join("");
}

function renderTestTips() {
    if (!testTipList) return;

    const tips = [
        ...new Set(
            allTests
                .map((test) => (test.testTip || "").trim())
                .filter(Boolean)
        )
    ].slice(0, 4);

    if (tips.length === 0) {
        testTipList.innerHTML = defaultTestTipHTML;
        return;
    }

    testTipList.innerHTML = tips.map((tip) => `
        <div class="test-tip-item">
            <i class="fa-solid fa-circle-check"></i>
            <span>${escapeHtml(tip)}</span>
        </div>
    `).join("");
}

function renderTests(tests) {
    if (!testList) return;

    testList.innerHTML = "";

    tests.forEach((test) => {
        testList.appendChild(createTestItem(test));
    });

    updateTestsCounts();
    renderRecentResults();
    renderFocusAreas();
    renderTestTips();
    applyTestFilters();
}

async function loadTests() {
    try {
        const backendTests = await fetchJson(TESTS_API_URL);

        allTests = Array.isArray(backendTests)
            ? sortTestsByDate(backendTests.map(mapBackendTestToFrontend))
            : [];

        renderTests(allTests);
    } catch (error) {
        console.error("Failed to load tests:", error);
        alert("Tests load nahi ho pa rahe. Console check karo.");
    }
}

async function addTest(testData) {
    await fetchJson(TESTS_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildBackendPayload(testData))
    });

    await loadTests();
}

async function updateTest(testId, testData) {
    const existingTest = allTests.find((test) => String(test.id) === String(testId)) || null;

    await fetchJson(`${TESTS_API_URL}/${testId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(buildBackendPayload(testData, existingTest))
    });

    await loadTests();
}

async function deleteTest(testId) {
    await fetchJson(`${TESTS_API_URL}/${testId}`, {
        method: "DELETE"
    });

    await loadTests();
}

function matchesTestFilter(testItem, filterValue) {
    if (!filterValue || filterValue === "All Tests") return true;

    const type = normalizeTestType(testItem.dataset.type);

    if (filterValue === "Upcoming") return type === "Upcoming";
    if (filterValue === "Completed") return type === "Completed";
    if (filterValue === "This Week") return type === "This Week";
    if (filterValue === "Mock Tests") return type === "Mock Test";

    return true;
}

function updateTestsEmptyState(visibleCount) {
    if (!testsEmptyState) return;

    if (visibleCount === 0) {
        testsEmptyState.classList.remove("hidden");
    } else {
        testsEmptyState.classList.add("hidden");
    }
}

function applyTestFilters() {
    if (!testList) return;

    const testItems = testList.querySelectorAll(".test-item");
    const searchText = testSearchInput ? testSearchInput.value.toLowerCase().trim() : "";
    const filterValue = testFilterSelect ? testFilterSelect.value : "All Tests";

    let visibleCount = 0;

    testItems.forEach((testItem) => {
        const title = testItem.querySelector(".test-info h4")?.textContent.toLowerCase() || "";
        const description = testItem.querySelector(".test-info p")?.textContent.toLowerCase() || "";

        const matchesSearch = title.includes(searchText) || description.includes(searchText);
        const passesFilter = matchesTestFilter(testItem, filterValue);

        if (matchesSearch && passesFilter) {
            testItem.style.display = "";
            visibleCount++;
        } else {
            testItem.style.display = "none";
        }
    });

    updateTestsEmptyState(visibleCount);
}

function fillTestFormForEdit(testItem) {
    editingTestId = testItem.dataset.testId || null;

    const testData = allTests.find((test) => String(test.id) === String(editingTestId)) || null;

    if (testTitleInput) {
        testTitleInput.value = testItem.querySelector(".test-info h4")?.textContent.trim() || "";
    }

    if (testSubjectInput) {
        testSubjectInput.value = testItem.dataset.subject || "";
    }

    if (testDateInput) {
        testDateInput.value = testItem.dataset.date || "";
    }

    if (testTypeInput) {
        testTypeInput.value = normalizeTestType(testItem.dataset.type);
    }

    if (testDurationInput) {
        testDurationInput.value = testItem.dataset.duration || "";
    }

    if (testDescriptionInput) {
        testDescriptionInput.value = testItem.dataset.description || "";
    }

    if (testFocusAreaInput) {
        testFocusAreaInput.value = testData?.focusArea || "";
    }

    if (testTipInput) {
        testTipInput.value = testData?.testTip || "";
    }
}

function extractSubjectName(subjectItem) {
    if (typeof subjectItem === "string") {
        return subjectItem.trim();
    }

    if (!subjectItem || typeof subjectItem !== "object") {
        return "";
    }

    return String(
        subjectItem.name ??
        subjectItem.subjectName ??
        subjectItem.title ??
        subjectItem.subject ??
        ""
    ).trim();
}

async function loadSubjectOptions() {
    if (!testSubjectInput) return;

    try {
        const subjects = await fetchJson(SUBJECTS_API_URL);

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return;
        }

        const currentValue = testSubjectInput.value;
        const subjectNames = [...new Set(subjects.map(extractSubjectName).filter(Boolean))];

        if (subjectNames.length === 0) {
            return;
        }

        testSubjectInput.innerHTML = "";

        subjectNames.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            testSubjectInput.appendChild(option);
        });

        if (currentValue && subjectNames.includes(currentValue)) {
            testSubjectInput.value = currentValue;
        } else {
            testSubjectInput.value = subjectNames[0];
        }
    } catch (error) {
        console.warn("Subjects dropdown backend se load nahi hua. Static options use honge.", error);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const title = testTitleInput ? testTitleInput.value.trim() : "";
    const subject = testSubjectInput ? testSubjectInput.value : "";
    const date = testDateInput ? testDateInput.value : "";
    const type = testTypeInput ? testTypeInput.value : "Upcoming";
    const duration = testDurationInput ? testDurationInput.value.trim() : "";
    const description = testDescriptionInput
        ? (testDescriptionInput.value.trim() || "Scheduled test for practice and performance review.")
        : "Scheduled test for practice and performance review.";

    const focusArea = testFocusAreaInput ? testFocusAreaInput.value.trim() : "";
    const testTip = testTipInput ? testTipInput.value.trim() : "";

    if (!title) {
        alert("Please enter a test title.");
        return;
    }

    if (!date) {
        alert("Please select a test date.");
        return;
    }

    const testData = {
        title,
        subject,
        date,
        type,
        duration,
        description,
        focusArea,
        testTip
    };

    try {
        if (testSaveBtn) {
            testSaveBtn.disabled = true;
            testSaveBtn.textContent = editingTestId ? "Updating..." : "Saving...";
        }

        if (editingTestId) {
            await updateTest(editingTestId, testData);
        } else {
            await addTest(testData);
        }

        closeTestModal();
        clearTestModalState();
    } catch (error) {
        console.error("Save failed:", error);
        alert("Save nahi hua. Console check karo.");
    } finally {
        if (testSaveBtn) {
            testSaveBtn.disabled = false;
        }

        if (editingTestId) {
            setEditTestMode();
        } else {
            setAddTestMode();
        }
    }
}

async function handleTestListClick(event) {
    const deleteButton = event.target.closest(".test-action-btn.delete");
    const editButton = event.target.closest(".test-action-btn.edit");

    if (deleteButton) {
        const testItem = deleteButton.closest(".test-item");
        const testId = testItem?.dataset.testId;

        if (!testId) return;

        const shouldDelete = confirm("Do you want to delete this test?");
        if (!shouldDelete) return;

        try {
            await deleteTest(testId);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Delete nahi hua. Console check karo.");
        }

        return;
    }

    if (editButton) {
        const testItem = editButton.closest(".test-item");
        if (!testItem) return;

        setEditTestMode();
        fillTestFormForEdit(testItem);
        openTestModal();
    }
}

function initializeTestsPage() {
    if (
        !openTestModalBtn ||
        !testModalOverlay ||
        !closeTestModalBtn ||
        !cancelTestModalBtn ||
        !testModalForm ||
        !testList
    ) {
        return;
    }

    openTestModalBtn.addEventListener("click", function () {
        clearTestModalState();
        openTestModal();
    });

    closeTestModalBtn.addEventListener("click", function () {
        closeTestModal();
        clearTestModalState();
    });

    cancelTestModalBtn.addEventListener("click", function () {
        closeTestModal();
        clearTestModalState();
    });

    testModalOverlay.addEventListener("click", function (event) {
        if (event.target === testModalOverlay) {
            closeTestModal();
            clearTestModalState();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !testModalOverlay.classList.contains("hidden")) {
            closeTestModal();
            clearTestModalState();
        }
    });

    testModalForm.addEventListener("submit", handleFormSubmit);
    testList.addEventListener("click", handleTestListClick);

    if (testSearchInput) {
        testSearchInput.addEventListener("input", applyTestFilters);
    }

    if (testFilterSelect) {
        testFilterSelect.addEventListener("change", applyTestFilters);
    }

    setAddTestMode();
    loadSubjectOptions();
    loadTests();
}

initializeTestsPage();