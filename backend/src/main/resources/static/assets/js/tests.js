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

const TESTS_STORAGE_KEY = "edumind_tests";

let editingTestId = null;

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

function generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getMonthShort(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function getDayNumber(dateValue) {
    const date = new Date(dateValue);
    return String(date.getDate()).padStart(2, "0");
}

function getTestBadgeClass(type) {
    const value = (type || "").toLowerCase();

    if (value === "upcoming") return "upcoming";
    if (value === "this week") return "week";
    if (value === "mock test" || value === "mock tests") return "mock";
    if (value === "completed") return "upcoming";

    return "upcoming";
}

function normalizeTestType(typeText) {
    const value = (typeText || "").trim().toLowerCase();

    if (value === "upcoming") return "Upcoming";
    if (value === "this week") return "This Week";
    if (value === "mock test" || value === "mock tests") return "Mock Test";
    if (value === "completed") return "Completed";

    return "Upcoming";
}

function updateTestsCounts() {
    if (!testList) return;

    const testItems = testList.querySelectorAll(".test-item");
    let upcoming = 0;
    let thisWeek = 0;
    let completed = 0;

    testItems.forEach((item) => {
        const type = normalizeTestType(item.dataset.type);

        if (type === "Upcoming" || type === "This Week" || type === "Mock Test") {
            upcoming++;
        }

        if (type === "This Week") {
            thisWeek++;
        }

        if (type === "Completed") {
            completed++;
        }
    });

    const averageScore = completed > 0 ? 80 : 76;

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
    const day = date ? getDayNumber(date) : "--";
    const month = date ? getMonthShort(date) : "---";

    let infoText = `Subject: ${subject}`;
    if (duration) {
        infoText += ` • Duration: ${duration}`;
    }
    if (description) {
        infoText += ` • ${description}`;
    }

    testItem.innerHTML = `
        <div class="test-date-box">
            <span>${day}</span>
            <small>${month}</small>
        </div>
        <div class="test-info">
            <h4>${title}</h4>
            <p>${infoText}</p>
        </div>
        <span class="test-badge ${badgeClass}">${normalizeTestType(type)}</span>
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

function renderTests(tests) {
    testList.innerHTML = "";
    tests.forEach((test) => {
        const testItem = createTestItem(test);
        testList.appendChild(testItem);
    });
    updateTestsCounts();
    applyTestFilters();
}

function getTestsFromStorage() {
    const saved = localStorage.getItem(TESTS_STORAGE_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to parse tests from localStorage:", error);
        return null;
    }
}

function saveTestsToStorage(tests) {
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(tests));
}

function extractTestsFromDOM() {
    const items = testList.querySelectorAll(".test-item");
    const tests = [];

    items.forEach((item) => {
        const title = item.querySelector(".test-info h4")?.textContent.trim() || "";
        const badgeText = item.querySelector(".test-badge")?.textContent.trim() || "Upcoming";
        const infoText = item.querySelector(".test-info p")?.textContent.trim() || "";

        let subject = "";
        let duration = "";
        let description = "";

        const parts = infoText.split("•").map((part) => part.trim()).filter(Boolean);

        parts.forEach((part) => {
            if (part.toLowerCase().startsWith("subject:")) {
                subject = part.replace(/subject:/i, "").trim();
            } else if (part.toLowerCase().startsWith("duration:")) {
                duration = part.replace(/duration:/i, "").trim();
            } else {
                description = description ? `${description} • ${part}` : part;
            }
        });

        const day = item.querySelector(".test-date-box span")?.textContent.trim() || "";
        const month = item.querySelector(".test-date-box small")?.textContent.trim() || "";
        let date = "";

        if (day && month) {
            const currentYear = new Date().getFullYear();
            const parsed = new Date(`${day} ${month} ${currentYear}`);
            if (!Number.isNaN(parsed.getTime())) {
                date = parsed.toISOString().split("T")[0];
            }
        }

        tests.push({
            id: generateTestId(),
            title,
            subject,
            date,
            type: normalizeTestType(badgeText),
            duration,
            description
        });
    });

    return tests;
}

function loadTests() {
    const storedTests = getTestsFromStorage();

    if (storedTests && Array.isArray(storedTests)) {
        renderTests(storedTests);
        return;
    }

    const initialTests = extractTestsFromDOM();
    saveTestsToStorage(initialTests);
    renderTests(initialTests);
}

function getCurrentTests() {
    return getTestsFromStorage() || [];
}

function addTest(testData) {
    const tests = getCurrentTests();
    const newTest = {
        id: generateTestId(),
        ...testData
    };

    tests.unshift(newTest);
    saveTestsToStorage(tests);
    renderTests(tests);
}

function updateTest(testId, updatedData) {
    const tests = getCurrentTests().map((test) =>
        test.id === testId ? { ...test, ...updatedData } : test
    );

    saveTestsToStorage(tests);
    renderTests(tests);
}

function deleteTest(testId) {
    const tests = getCurrentTests().filter((test) => test.id !== testId);
    saveTestsToStorage(tests);
    renderTests(tests);
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

    const title = testItem.querySelector(".test-info h4")?.textContent.trim() || "";
    const subject = testItem.dataset.subject || "";
    const date = testItem.dataset.date || "";
    const type = normalizeTestType(testItem.dataset.type);
    const duration = testItem.dataset.duration || "";
    const description = testItem.dataset.description || "";

    testTitleInput.value = title;
    testSubjectInput.value = subject;
    testDateInput.value = date;
    testTypeInput.value = type;
    testDurationInput.value = duration;
    testDescriptionInput.value = description;
}

if (
    openTestModalBtn &&
    testModalOverlay &&
    closeTestModalBtn &&
    cancelTestModalBtn &&
    testModalForm &&
    testList
) {
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

    testModalForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = testTitleInput.value.trim();
        const subject = testSubjectInput.value;
        const date = testDateInput.value;
        const type = testTypeInput.value;
        const duration = testDurationInput.value.trim();
        const description = testDescriptionInput.value.trim();

        if (!title) {
            alert("Please enter a test title.");
            return;
        }

        if (!date) {
            alert("Please select a test date.");
            return;
        }

        const finalDescription = description || "Scheduled test for practice and performance review.";

        const testData = {
            title,
            subject,
            date,
            type,
            duration,
            description: finalDescription
        };

        if (editingTestId) {
            updateTest(editingTestId, testData);
        } else {
            addTest(testData);
        }

        closeTestModal();
        clearTestModalState();
    });

    testList.addEventListener("click", function (event) {
        const deleteButton = event.target.closest(".test-action-btn.delete");
        const editButton = event.target.closest(".test-action-btn.edit");

        if (deleteButton) {
            const testItem = deleteButton.closest(".test-item");
            const testId = testItem?.dataset.testId;

            if (!testId) return;

            const shouldDelete = confirm("Do you want to delete this test?");
            if (!shouldDelete) return;

            deleteTest(testId);
            return;
        }

        if (editButton) {
            const testItem = editButton.closest(".test-item");
            if (!testItem) return;

            setEditTestMode();
            fillTestFormForEdit(testItem);
            openTestModal();
        }
    });

    if (testSearchInput) {
        testSearchInput.addEventListener("input", applyTestFilters);
    }

    if (testFilterSelect) {
        testFilterSelect.addEventListener("change", applyTestFilters);
    }

    loadTests();
    setAddTestMode();
}