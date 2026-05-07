const testList = document.getElementById("testList");
const testsEmptyState = document.getElementById("testsEmptyState");
const testSearchInput = document.getElementById("testSearchInput");
const testFilterSelect = document.getElementById("testFilterSelect");

const upcomingTestsCount = document.getElementById("upcomingTestsCount");
const thisWeekTestsCount = document.getElementById("thisWeekTestsCount");
const completedTestsCount = document.getElementById("completedTestsCount");
const averageScoreCount = document.getElementById("averageScoreCount");

const resultList = document.querySelector(".result-list");
const focusAreaList = document.querySelector(".focus-area-list");
const testTipList = document.querySelector(".test-tip-list");

const defaultRecentResultsHTML = resultList ? resultList.innerHTML : "";
const defaultFocusAreaHTML = focusAreaList ? focusAreaList.innerHTML : "";
const defaultTestTipHTML = testTipList ? testTipList.innerHTML : "";

/* Review modal */
const reviewResultOverlay = document.getElementById("reviewResultOverlay");
const closeReviewResultModalBtn = document.getElementById(
  "closeReviewResultModalBtn",
);
const reviewResultCloseBtn = document.getElementById("reviewResultCloseBtn");
const reviewResultTitle = document.getElementById("reviewResultTitle");
const reviewResultSubtitle = document.getElementById("reviewResultSubtitle");
const reviewScoreText = document.getElementById("reviewScoreText");
const reviewPercentageText = document.getElementById("reviewPercentageText");
const reviewCorrectText = document.getElementById("reviewCorrectText");
const reviewStatusText = document.getElementById("reviewStatusText");
const reviewSubjectText = document.getElementById("reviewSubjectText");
const reviewDurationText = document.getElementById("reviewDurationText");
const reviewAnsweredText = document.getElementById("reviewAnsweredText");
const reviewFocusAreaText = document.getElementById("reviewFocusAreaText");
const reviewTestTipText = document.getElementById("reviewTestTipText");
const reviewAnswersList = document.getElementById("reviewAnswersList");

// ─── API URLs ────────────────────────────────────────────
const API_BASE_URL =
  window.location.port === "8080" ? "" : "http://localhost:8080";
const TESTS_API_URL = `${API_BASE_URL}/api/tests`;
const TESTS_RECENT_RESULTS_API_URL = `${API_BASE_URL}/api/tests/attempts/recent`;
const TESTS_HISTORY_API_URL = `${API_BASE_URL}/api/tests/attempts/history`;

let allTests = [];
let recentAttemptResults = [];
let attemptHistory = [];
let latestSubmittedAttemptByTestId = new Map();

// ─── AUTH ────────────────────────────────────────────────
function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("jwtToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("jwtToken") ||
    sessionStorage.getItem("accessToken") ||
    ""
  ).trim();
}

// ─── URL BUILDERS — JWT based, no userId params ──────────
function buildTestsApiUrl(testId = "") {
  const path = testId ? `/${encodeURIComponent(testId)}` : "";
  return `${TESTS_API_URL}${path}`;
}

function buildRecentResultsApiUrl() {
  return TESTS_RECENT_RESULTS_API_URL;
}

function buildHistoryApiUrl() {
  return TESTS_HISTORY_API_URL;
}

function buildAttemptDetailsApiUrl(attemptId) {
  return `${TESTS_API_URL}/attempts/${encodeURIComponent(attemptId)}`;
}

// ─── FETCH HELPER ────────────────────────────────────────
async function fetchJson(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Missing login token. Please login again.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let text = "";

  try {
    text = await response.text();
  } catch (error) {
    text = "";
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Unauthorized. Your session may have expired. Please login again.",
    );
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || parsed.field || message;
    } catch (error) {
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

// ─── DATE HELPERS ────────────────────────────────────────
function parseDateValue(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }

  if (typeof dateValue === "string") {
    const trimmed = dateValue.trim();

    if (!trimmed) return null;

    const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? new Date(`${trimmed}T00:00:00`)
      : new Date(trimmed);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthShort(dateValue) {
  const date = parseDateValue(dateValue);

  return date
    ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "---";
}

function getDayNumber(dateValue) {
  const date = parseDateValue(dateValue);

  return date ? String(date.getDate()).padStart(2, "0") : "--";
}

function formatShortDate(dateValue) {
  const date = parseDateValue(dateValue);

  return date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "Date not available";
}

function isWithinThisWeek(dateValue) {
  const date = parseDateValue(dateValue);

  if (!date) return false;

  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

// ─── NORMALIZERS ─────────────────────────────────────────
function normalizeTestType(typeText) {
  const value = String(typeText || "")
    .trim()
    .toLowerCase();

  if (value === "upcoming") return "Upcoming";
  if (value === "this week") return "This Week";
  if (value === "mock test" || value === "mock tests") return "Mock Test";
  if (value === "completed") return "Completed";

  return "Upcoming";
}

function normalizeAdminStatus(statusText, publishedValue = false) {
  const value = String(statusText || "")
    .trim()
    .toUpperCase();

  if (value === "PUBLISHED") return "PUBLISHED";
  if (value === "DRAFT") return "DRAFT";

  return publishedValue ? "PUBLISHED" : "DRAFT";
}

function isPublishedForStudent(test) {
  const published = Boolean(test?.published);
  return (
    published ||
    normalizeAdminStatus(test?.adminStatus, published) === "PUBLISHED"
  );
}

function shouldShowTestOnStudentPage(test) {
  return isPublishedForStudent(test);
}

function getTestBadgeClass(type) {
  const value = String(type || "").toLowerCase();

  if (value === "upcoming") return "upcoming";
  if (value === "this week") return "week";
  if (value === "mock test" || value === "mock tests") return "mock";
  if (value === "completed") return "completed";

  return "upcoming";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── TOAST ───────────────────────────────────────────────
function showTestsToast(message, type = "info") {
  const oldToast = document.querySelector(".tests-toast");

  if (oldToast) {
    oldToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `tests-toast ${type}`;

  const iconClass =
    type === "success"
      ? "fa-circle-check"
      : type === "error"
        ? "fa-triangle-exclamation"
        : type === "warning"
          ? "fa-circle-exclamation"
          : "fa-circle-info";

  toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

  document.body.appendChild(toast);

  if (!document.getElementById("testsToastStyle")) {
    const style = document.createElement("style");
    style.id = "testsToastStyle";
    style.textContent = `
            .tests-toast {
                position: fixed;
                top: 22px;
                right: 22px;
                z-index: 999999;
                min-width: 280px;
                max-width: 440px;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 16px;
                border-radius: 16px;
                font-family: "Poppins", sans-serif;
                font-size: 13px;
                font-weight: 750;
                line-height: 1.55;
                color: #ffffff;
                box-shadow:
                    0 22px 52px rgba(8, 17, 31, 0.24),
                    0 0 24px rgba(6, 182, 212, 0.12);
                animation: testsToastIn 0.25s ease;
            }

            .tests-toast.info {
                background: linear-gradient(135deg, #0891b2, #0f766e);
                border: 1px solid rgba(103, 232, 249, 0.28);
            }

            .tests-toast.success {
                background: linear-gradient(135deg, #059669, #10b981);
                border: 1px solid rgba(110, 231, 183, 0.32);
            }

            .tests-toast.warning {
                background: linear-gradient(135deg, #b45309, #f59e0b);
                border: 1px solid rgba(253, 230, 138, 0.32);
            }

            .tests-toast.error {
                background: linear-gradient(135deg, #991b1b, #dc2626);
                border: 1px solid rgba(252, 165, 165, 0.32);
            }

            .tests-toast i {
                flex-shrink: 0;
                font-size: 16px;
            }

            @keyframes testsToastIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px) scale(0.98);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @media (max-width: 560px) {
                .tests-toast {
                    left: 14px;
                    right: 14px;
                    top: 16px;
                    min-width: auto;
                    max-width: none;
                }
            }
        `;

    document.head.appendChild(style);
  }

  clearTimeout(toast._timer);

  toast._timer = setTimeout(() => {
    toast.remove();
  }, 3600);
}

// ─── SORT HELPERS ────────────────────────────────────────
function sortTestsByDate(tests) {
  return [...tests].sort((a, b) => {
    const aTime = parseDateValue(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = parseDateValue(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return aTime !== bTime
      ? aTime - bTime
      : Number(b.id || 0) - Number(a.id || 0);
  });
}

function sortBySubmitted(results) {
  return [...results].sort((a, b) => {
    const aTime = parseDateValue(a.submittedAt)?.getTime() ?? 0;
    const bTime = parseDateValue(b.submittedAt)?.getTime() ?? 0;

    return bTime - aTime;
  });
}

function sortByStarted(items) {
  return [...items].sort((a, b) => {
    const aTime = parseDateValue(a.startedAt)?.getTime() ?? 0;
    const bTime = parseDateValue(b.startedAt)?.getTime() ?? 0;

    return bTime - aTime;
  });
}

// ─── DATA MAPPING ────────────────────────────────────────
function mapBackendTestToFrontend(test) {
  const published =
    typeof test.published === "boolean" ? test.published : false;

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
    testTip: test.testTip || "",
    published,
    adminStatus: normalizeAdminStatus(test.adminStatus, published),
  };
}

function mapBackendRecentResult(result) {
  return {
    attemptId: result.attemptId ?? null,
    testId: result.testId ?? null,
    title: result.title || "",
    subject: result.subject || "",
    percentage: result.percentage ?? null,
    score: result.score ?? null,
    focusArea: result.focusArea || "",
    testTip: result.testTip || "",
    submittedAt: result.submittedAt || "",
  };
}

function mapBackendHistory(item) {
  return {
    attemptId: item.attemptId ?? null,
    testId: item.testId ?? null,
    title: item.title || "",
    subject: item.subject || "",
    testType: normalizeTestType(item.testType || ""),
    duration: item.duration || "",
    totalQuestions: item.totalQuestions ?? 0,
    answeredQuestions: item.answeredQuestions ?? 0,
    correctAnswers: item.correctAnswers ?? 0,
    score: item.score ?? null,
    percentage: item.percentage ?? null,
    focusArea: item.focusArea || "",
    testTip: item.testTip || "",
    status: item.status || "",
    startedAt: item.startedAt || "",
    submittedAt: item.submittedAt || "",
  };
}

function rebuildLatestAttemptIndex() {
  latestSubmittedAttemptByTestId = new Map();

  sortBySubmitted(attemptHistory)
    .filter((item) => String(item.status || "").toUpperCase() === "SUBMITTED")
    .forEach((item) => {
      const key = String(item.testId);

      if (!latestSubmittedAttemptByTestId.has(key)) {
        latestSubmittedAttemptByTestId.set(key, item);
      }
    });
}

function getLatestSubmittedAttempt(testId) {
  return latestSubmittedAttemptByTestId.get(String(testId)) || null;
}

// ─── RENDER: TEST LIST ───────────────────────────────────
function getDisplayTypeForStudent(test) {
  const latestAttempt = getLatestSubmittedAttempt(test.id);

  if (latestAttempt) {
    return "Completed";
  }

  const normalizedType = normalizeTestType(test.type);

  if (normalizedType === "Upcoming" && isWithinThisWeek(test.date)) {
    return "This Week";
  }

  return normalizedType;
}

function createTestItem(test) {
  const { id, title, subject, date, duration, description } = test;
  const latestAttempt = getLatestSubmittedAttempt(id);
  const displayType = getDisplayTypeForStudent(test);

  const item = document.createElement("div");
  item.className = "test-item";
  item.dataset.testId = id;
  item.dataset.date = date || "";
  item.dataset.type = displayType;
  item.dataset.subject = subject || "";
  item.dataset.duration = duration || "";
  item.dataset.description = description || "";

  const startBtn = !latestAttempt
    ? `
            <button class="test-action-btn start" type="button" title="Start Test">
                <i class="fa-solid fa-play"></i>
            </button>
        `
    : "";

  const reviewBtn = latestAttempt
    ? `
            <button
                class="test-action-btn review"
                type="button"
                title="Review Result"
                data-attempt-id="${escapeHtml(latestAttempt.attemptId)}">
                <i class="fa-solid fa-eye"></i>
            </button>
        `
    : "";

  const infoParts = [`Subject: ${subject || "-"}`];

  if (duration) {
    infoParts.push(`Duration: ${duration}`);
  }

  if (description) {
    infoParts.push(description);
  }

  item.innerHTML = `
        <div class="test-date-box">
            <span>${getDayNumber(date)}</span>
            <small>${getMonthShort(date)}</small>
        </div>

        <div class="test-info">
            <h4>${escapeHtml(title || "Untitled Test")}</h4>
            <p>${escapeHtml(infoParts.join(" • "))}</p>
        </div>

        <span class="test-badge ${getTestBadgeClass(displayType)}">${escapeHtml(displayType)}</span>

        <div class="test-actions">
            ${startBtn}
            ${reviewBtn}
        </div>
    `;

  return item;
}

function updateTestsCounts() {
  const completedCount = latestSubmittedAttemptByTestId.size;
  const visibleTestsWithoutAttempts = allTests.filter(
    (test) => !getLatestSubmittedAttempt(test.id),
  );

  const upcomingCount = visibleTestsWithoutAttempts.filter((test) => {
    return (
      normalizeTestType(test.type) === "Upcoming" &&
      !isWithinThisWeek(test.date)
    );
  }).length;

  const thisWeekCount = visibleTestsWithoutAttempts.filter((test) => {
    return (
      normalizeTestType(test.type) === "This Week" ||
      isWithinThisWeek(test.date)
    );
  }).length;

  const scores = recentAttemptResults
    .map((item) => Number(item.percentage))
    .filter(Number.isFinite);

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, value) => sum + value, 0) / scores.length,
        )
      : 0;

  if (upcomingTestsCount) {
    upcomingTestsCount.textContent = String(upcomingCount).padStart(2, "0");
  }

  if (thisWeekTestsCount) {
    thisWeekTestsCount.textContent = String(thisWeekCount).padStart(2, "0");
  }

  if (completedTestsCount) {
    completedTestsCount.textContent = String(completedCount).padStart(2, "0");
  }

  if (averageScoreCount) {
    averageScoreCount.textContent = `${averageScore}%`;
  }
}

function bindRecentResultClicks() {
  if (!resultList) return;

  resultList
    .querySelectorAll(".result-item[data-attempt-id]")
    .forEach((item) => {
      item.style.cursor = "pointer";
      item.setAttribute("title", "View Result Review");
      item.onclick = async () => {
        await openReviewForAttempt(item.dataset.attemptId);
      };
    });
}

function renderRecentResults() {
  if (!resultList) return;

  const results = sortBySubmitted(recentAttemptResults).slice(0, 3);

  if (results.length > 0) {
    resultList.innerHTML = results
      .map((result) => {
        const percentage = Number.isFinite(Number(result.percentage))
          ? `${Math.round(Number(result.percentage))}%`
          : "--%";

        const dateText = result.submittedAt
          ? `Completed on ${formatShortDate(result.submittedAt)}`
          : "Completed test";

        const attemptAttr =
          result.attemptId != null
            ? `data-attempt-id="${escapeHtml(result.attemptId)}"`
            : "";

        return `
                    <div class="result-item" ${attemptAttr}>
                        <div class="result-info">
                            <h4>${escapeHtml(result.title || "Completed Test")}</h4>
                            <p>${escapeHtml(dateText)}</p>
                        </div>
                        <span class="result-score">${escapeHtml(percentage)}</span>
                    </div>
                `;
      })
      .join("");

    bindRecentResultClicks();
    return;
  }

  resultList.innerHTML = defaultRecentResultsHTML;
}

function renderFocusAreas() {
  if (!focusAreaList) return;

  const focusAreas = [
    ...recentAttemptResults.map((item) => item.focusArea || ""),
    ...allTests.map((item) => item.focusArea || ""),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const uniqueFocusAreas = [...new Set(focusAreas)].slice(0, 3);

  focusAreaList.innerHTML =
    uniqueFocusAreas.length > 0
      ? uniqueFocusAreas
          .map((area) => {
            return `
                      <div class="focus-area-item">
                          <i class="fa-solid fa-circle-exclamation"></i>
                          <span>${escapeHtml(area)}</span>
                      </div>
                  `;
          })
          .join("")
      : defaultFocusAreaHTML;
}

function renderTestTips() {
  if (!testTipList) return;

  const tips = [
    ...recentAttemptResults.map((item) => item.testTip || ""),
    ...allTests.map((item) => item.testTip || ""),
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const uniqueTips = [...new Set(tips)].slice(0, 4);

  testTipList.innerHTML =
    uniqueTips.length > 0
      ? uniqueTips
          .map((tip) => {
            return `
                      <div class="test-tip-item">
                          <i class="fa-solid fa-circle-check"></i>
                          <span>${escapeHtml(tip)}</span>
                      </div>
                  `;
          })
          .join("")
      : defaultTestTipHTML;
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

// ─── LOAD ────────────────────────────────────────────────
async function loadTests() {
  try {
    const [testsRes, recentRes, historyRes] = await Promise.allSettled([
      fetchJson(buildTestsApiUrl()),
      fetchJson(buildRecentResultsApiUrl()),
      fetchJson(buildHistoryApiUrl()),
    ]);

    if (testsRes.status !== "fulfilled") {
      throw testsRes.reason;
    }

    const mappedTests = Array.isArray(testsRes.value)
      ? sortTestsByDate(testsRes.value.map(mapBackendTestToFrontend))
      : [];

    recentAttemptResults =
      recentRes.status === "fulfilled" && Array.isArray(recentRes.value)
        ? sortBySubmitted(recentRes.value.map(mapBackendRecentResult))
        : [];

    attemptHistory =
      historyRes.status === "fulfilled" && Array.isArray(historyRes.value)
        ? sortByStarted(historyRes.value.map(mapBackendHistory))
        : [];

    rebuildLatestAttemptIndex();

    allTests = mappedTests.filter(shouldShowTestOnStudentPage);
    renderTests(allTests);

    if (!allTests.length) {
      showTestsToast("No published tests are available right now.", "info");
    }
  } catch (error) {
    console.error("Failed to load tests:", error);

    showTestsToast(
      "Tests could not be loaded right now. Please refresh the page or try again later.",
      "error",
    );

    if (testsEmptyState) {
      testsEmptyState.classList.remove("hidden");
    }
  }
}

// ─── REVIEW MODAL ────────────────────────────────────────
function renderReviewAnswers(answers) {
  if (!reviewAnswersList) return;

  if (!Array.isArray(answers) || answers.length === 0) {
    reviewAnswersList.innerHTML = `
            <div class="review-answer-empty">
                <i class="fa-regular fa-file-lines"></i>
                <p>Question-wise review will appear here.</p>
            </div>
        `;
    return;
  }

  reviewAnswersList.innerHTML = answers
    .map((answer, index) => {
      const correct = Boolean(answer.isCorrect);
      const statusLabel = correct ? "Correct" : "Needs Review";

      return `
                <div class="review-answer-card">
                    <div class="review-answer-top">
                        <div class="review-answer-top-left">
                            <span class="review-question-index">Question ${index + 1}</span>
                            <span class="review-question-topic">
                                ${escapeHtml(answer.focusTopic || "General concepts")}
                            </span>
                        </div>

                        <span class="review-answer-status ${correct ? "correct" : "wrong"}">
                            ${escapeHtml(statusLabel)}
                        </span>
                    </div>

                    <h4 class="review-answer-question">
                        ${escapeHtml(answer.questionText || "Question text not available.")}
                    </h4>

                    <div class="review-answer-grid">
                        <div class="review-answer-block">
                            <span>Your Answer</span>
                            <p>${escapeHtml(answer.submittedAnswer || "Not answered")}</p>
                        </div>

                        <div class="review-answer-block">
                            <span>Correct Answer</span>
                            <p>${escapeHtml(answer.correctAnswer || "Not available")}</p>
                        </div>

                        <div class="review-answer-block">
                            <span>Marks</span>
                            <p>${escapeHtml(`${answer.marksAwarded ?? 0}/${answer.totalMarks ?? 0}`)}</p>
                        </div>
                    </div>
                </div>
            `;
    })
    .join("");
}

function fillReviewModal(details) {
  if (reviewResultTitle) {
    reviewResultTitle.textContent = details.title || "Test Review";
  }

  if (reviewResultSubtitle) {
    reviewResultSubtitle.textContent = details.submittedAt
      ? `Submitted on ${formatShortDate(details.submittedAt)}`
      : "Question-wise performance and answer analysis.";
  }

  if (reviewScoreText) {
    reviewScoreText.textContent = `${details.score ?? 0}`;
  }

  if (reviewPercentageText) {
    reviewPercentageText.textContent = `${Math.round(Number(details.percentage ?? 0))}%`;
  }

  if (reviewCorrectText) {
    reviewCorrectText.textContent = `${details.correctAnswers ?? 0}/${details.totalQuestions ?? 0}`;
  }

  if (reviewStatusText) {
    reviewStatusText.textContent = details.status || "-";
  }

  if (reviewSubjectText) {
    reviewSubjectText.textContent = details.subject || "-";
  }

  if (reviewDurationText) {
    reviewDurationText.textContent = details.duration || "-";
  }

  if (reviewAnsweredText) {
    reviewAnsweredText.textContent = `${details.answeredQuestions ?? 0}/${details.totalQuestions ?? 0}`;
  }

  if (reviewFocusAreaText) {
    reviewFocusAreaText.textContent =
      details.focusArea || "No major weak area detected.";
  }

  if (reviewTestTipText) {
    reviewTestTipText.textContent = details.testTip || "No test tip available.";
  }

  renderReviewAnswers(details.answers || []);
}

function openReviewResultModal() {
  if (!reviewResultOverlay) return;

  reviewResultOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeReviewResultModal() {
  if (!reviewResultOverlay) return;

  reviewResultOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

async function openReviewForAttempt(attemptId) {
  if (!attemptId) {
    showTestsToast("Review data was not found for this attempt.", "warning");
    return;
  }

  try {
    const details = await fetchJson(buildAttemptDetailsApiUrl(attemptId));
    fillReviewModal(details || {});
    openReviewResultModal();
  } catch (error) {
    console.error("Review load failed:", error);
    showTestsToast(
      `Result review could not be loaded: ${error.message}`,
      "error",
    );
  }
}

// ─── FILTER ──────────────────────────────────────────────
function matchesTestFilter(testItem, filterValue) {
  if (!filterValue || filterValue === "All Tests") return true;

  const type = normalizeTestType(testItem.dataset.type);

  if (filterValue === "Upcoming") return type === "Upcoming";
  if (filterValue === "Completed") return type === "Completed";
  if (filterValue === "This Week") return type === "This Week";
  if (filterValue === "Mock Tests") return type === "Mock Test";

  return true;
}

function applyTestFilters() {
  if (!testList) return;

  const items = testList.querySelectorAll(".test-item");
  const search = testSearchInput
    ? testSearchInput.value.toLowerCase().trim()
    : "";
  const filterValue = testFilterSelect ? testFilterSelect.value : "All Tests";

  let visible = 0;

  items.forEach((item) => {
    const title =
      item.querySelector(".test-info h4")?.textContent.toLowerCase() || "";
    const description =
      item.querySelector(".test-info p")?.textContent.toLowerCase() || "";
    const subject = String(item.dataset.subject || "").toLowerCase();

    const matchesSearch =
      title.includes(search) ||
      description.includes(search) ||
      subject.includes(search);

    const show = matchesSearch && matchesTestFilter(item, filterValue);

    item.style.display = show ? "" : "none";

    if (show) {
      visible++;
    }
  });

  if (testsEmptyState) {
    testsEmptyState.classList.toggle("hidden", visible > 0);
  }
}

// ─── TEST ACTIONS ────────────────────────────────────────
function handleStartTest(testId) {
  if (!testId) {
    showTestsToast(
      "Test ID was not found. Please refresh and try again.",
      "warning",
    );
    return;
  }

  window.location.href = `test-engine.html?testId=${encodeURIComponent(testId)}`;
}

async function handleTestListClick(event) {
  const startBtn = event.target.closest(".test-action-btn.start");
  const reviewBtn = event.target.closest(".test-action-btn.review");

  if (startBtn) {
    const testId = startBtn.closest(".test-item")?.dataset.testId;
    handleStartTest(testId);
    return;
  }

  if (reviewBtn) {
    await openReviewForAttempt(reviewBtn.dataset.attemptId);
  }
}

// ─── INIT ────────────────────────────────────────────────
function initializeTestsPage() {
  if (!testList) return;

  // Review modal close buttons
  if (closeReviewResultModalBtn) {
    closeReviewResultModalBtn.addEventListener("click", closeReviewResultModal);
  }

  if (reviewResultCloseBtn) {
    reviewResultCloseBtn.addEventListener("click", closeReviewResultModal);
  }

  if (reviewResultOverlay) {
    reviewResultOverlay.addEventListener("click", (event) => {
      if (event.target === reviewResultOverlay) {
        closeReviewResultModal();
      }
    });
  }

  // Test list actions
  testList.addEventListener("click", handleTestListClick);

  // Search and filter
  if (testSearchInput) {
    testSearchInput.addEventListener("input", applyTestFilters);
  }

  if (testFilterSelect) {
    testFilterSelect.addEventListener("change", applyTestFilters);
  }

  // Escape key closes review modal
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      reviewResultOverlay &&
      !reviewResultOverlay.classList.contains("hidden")
    ) {
      closeReviewResultModal();
    }
  });

  loadTests();
}

initializeTestsPage();
