/* =========================================================
   dashboard-premium-enhance.js
   
   ONLY does:
   1. Replaces .activity-tracker-grid bars with Chart.js canvas
   2. Adds toast notification system (window.showToast)
   3. Adds chart type switcher tabs
   
   Runs AFTER dashboard.js — hooks into existing rendered DOM.
   Does NOT change: icons, sidebar, header, stats, any CSS class.
   ========================================================= */

(function () {
  "use strict";

  /* ─── Wait for DOM + Chart.js ────────────────────── */
  function waitForChartJs(cb, tries) {
    tries = tries || 0;
    if (window.Chart) return cb();
    if (tries > 40) return; // give up after ~4s
    setTimeout(function () { waitForChartJs(cb, tries + 1); }, 100);
  }

  /* ─── TOAST SYSTEM ───────────────────────────────── */
  var TOAST_ICONS = {
    success: "fa-circle-check",
    info:    "fa-circle-info",
    warn:    "fa-triangle-exclamation",
    error:   "fa-circle-xmark"
  };

  function initToastContainer() {
    if (document.getElementById("emToastContainer")) return;
    var el = document.createElement("div");
    el.id = "emToastContainer";
    document.body.appendChild(el);
  }

  window.showToast = function (type, title, msg, duration) {
    duration = duration || 4000;
    initToastContainer();
    var container = document.getElementById("emToastContainer");
    var icon = TOAST_ICONS[type] || TOAST_ICONS.info;

    var toast = document.createElement("div");
    toast.className = "em-toast " + type;
    toast.innerHTML =
      '<div class="em-toast-icon"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div class="em-toast-body">' +
        '<div class="em-toast-title">' + escHtml(title) + "</div>" +
        '<div class="em-toast-msg">' + escHtml(msg) + "</div>" +
      "</div>" +
      '<div class="em-toast-close"><i class="fa-solid fa-xmark"></i></div>';

    container.appendChild(toast);

    function close() {
      if (toast.classList.contains("hiding")) return;
      toast.classList.add("hiding");
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 320);
    }

    toast.addEventListener("click", close);
    setTimeout(close, duration);
  };

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ─── CHART REPLACE ──────────────────────────────── */
  var chartInstance = null;
  var currentType   = "bar";

  /* Called after dashboard.js has rendered bars */
  function buildPremiumChart() {
    var chartCard = document.querySelector(".overview-chart-card");
    if (!chartCard) return;

    /* Get existing chart area element */
    var chartArea = chartCard.querySelector(".chart-area.chart-area-activity-tracker");
    if (!chartArea) return;

    /* If already upgraded — skip */
    if (document.getElementById("premiumChartWrap")) return;

    /* ── Read data from existing rendered DOM bars ── */
    var counts = readCountsFromDOM();

    /* ── Remove existing bars grid ── */
    var barsEl = chartCard.querySelector("#weeklyOverviewChartBars");
    if (barsEl) barsEl.style.display = "none";

    /* ── Build tab strip ── */
    var tabsHtml =
      '<div class="premium-chart-tabs" id="premiumChartTabs">' +
        '<button class="premium-chart-tab active" data-ctype="bar"><i class="fa-solid fa-chart-column"></i> Bar</button>' +
        '<button class="premium-chart-tab" data-ctype="line"><i class="fa-solid fa-chart-line"></i> Line</button>' +
        '<button class="premium-chart-tab" data-ctype="radar"><i class="fa-solid fa-chart-pie"></i> Radar</button>' +
      "</div>";

    /* ── Build summary pills ── */
    var total  = counts.reduce(function (s, d) { return s + d.total; }, 0);
    var active = counts.filter(function (d) { return d.total > 0; }).length;
    var best   = counts.reduce(function (a, b) { return b.total > a.total ? b : a; }, counts[0]);

    var pillsHtml =
      '<div class="premium-summary-pills" id="premiumSummaryPills">' +
        '<div class="premium-summary-pill"><span>This Week</span><strong>' + total + "</strong></div>" +
        '<div class="premium-summary-pill"><span>Active Days</span><strong>' + active + "</strong></div>" +
        '<div class="premium-summary-pill"><span>Best Day</span><strong>' + (best && best.total > 0 ? escHtml(best.label) : "—") + "</strong></div>" +
        '<div class="premium-summary-pill"><span>Top Focus</span><strong>' + escHtml(getDominantType(counts)) + "</strong></div>" +
      "</div>";

    /* ── Build canvas wrap ── */
    var wrap = document.createElement("div");
    wrap.id = "premiumChartWrap";
    wrap.innerHTML = tabsHtml + pillsHtml + '<canvas id="premiumChartCanvas"></canvas>';

    /* Insert before insight line or at end of chart-area */
    chartArea.insertBefore(wrap, chartArea.firstChild);

    /* ── Draw chart ── */
    drawChart(counts, currentType);

    /* ── Tab events ── */
    var tabBtns = wrap.querySelectorAll(".premium-chart-tab");
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tabBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        currentType = btn.getAttribute("data-ctype");
        drawChart(counts, currentType);
      });
    });

    /* ── Update insight line ── */
    updateInsightLine(counts, total, active, best);
  }

  /* Read breakdown from existing activity-day-card elements */
  function readCountsFromDOM() {
    var cards = document.querySelectorAll("#weeklyOverviewChartBars .activity-day-card");
    var days  = [];

    if (cards.length === 0) {
      /* Fallback: synthetic 7-day labels */
      var labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      labels.forEach(function (label) {
        days.push({ label: label, total: 0, tasks: 0, plans: 0, revisions: 0, tests: 0, isToday: false });
      });
      return days;
    }

    cards.forEach(function (card) {
      var labelEl = card.querySelector(".chart-day-label");
      var label   = labelEl ? labelEl.textContent.trim() : "?";
      var isToday = card.classList.contains("activity-day-card--today");
      var t = 0, p = 0, r = 0, te = 0;

      var markers = card.querySelectorAll(".activity-marker-item");
      markers.forEach(function (m) {
        var dot = m.querySelector(".activity-marker-dot");
        var countEl = m.querySelector(".activity-marker-count");
        var n = countEl ? parseInt(countEl.textContent, 10) || 0 : 0;
        if (!dot) return;
        if (dot.classList.contains("task"))     t  += n;
        if (dot.classList.contains("plan"))     p  += n;
        if (dot.classList.contains("revision")) r  += n;
        if (dot.classList.contains("test"))     te += n;
      });

      days.push({
        label: label,
        total: t + p + r + te,
        tasks: t, plans: p, revisions: r, tests: te,
        isToday: isToday
      });
    });

    return days;
  }

  function getDominantType(counts) {
    var totals = { Tasks: 0, Planner: 0, Revision: 0, Tests: 0 };
    counts.forEach(function (d) {
      totals.Tasks    += d.tasks;
      totals.Planner  += d.plans;
      totals.Revision += d.revisions;
      totals.Tests    += d.tests;
    });
    var top = Object.keys(totals).reduce(function (a, b) {
      return totals[b] > totals[a] ? b : a;
    }, "Tasks");
    return totals[top] > 0 ? top : "None";
  }

  /* ─── Draw Chart.js ──────────────────────────────── */
  function isDark() {
    return document.body.classList.contains("preview-dark") ||
           document.body.classList.contains("dark-mode");
  }

  function drawChart(counts, type) {
    var canvas = document.getElementById("premiumChartCanvas");
    if (!canvas) return;
    var ctx    = canvas.getContext("2d");

    var labels  = counts.map(function (d) { return d.label; });
    var dark    = isDark();

    var gridColor  = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    var tickColor  = dark ? "#94a3b8" : "#6b7280";
    var tooltipBg  = dark ? "#1e293b" : "#ffffff";
    var tooltipBdr = dark ? "rgba(139,124,255,0.3)" : "#e5e7eb";
    var tooltipTtl = dark ? "#c4b5fd" : "#6c63ff";
    var tooltipBdy = dark ? "#94a3b8" : "#6b7280";

    var isRadar = (type === "radar");
    var isLine  = (type === "line");

    function ds(label, data, color, alphaBg) {
      return {
        label: label,
        data: data,
        backgroundColor: isRadar || isLine
          ? color.replace("1)", alphaBg + ")")
          : color,
        borderColor: color.replace("1)", "1)"),
        borderWidth: isRadar || isLine ? 2.5 : 0,
        borderRadius: (!isRadar && !isLine) ? 7 : 0,
        borderSkipped: false,
        pointBackgroundColor: color.replace("1)", "1)"),
        pointBorderColor: dark ? "#1e293b" : "#ffffff",
        pointBorderWidth: 2,
        pointRadius: isLine ? 5 : 0,
        pointHoverRadius: isLine ? 7 : 0,
        fill: isLine,
        tension: 0.42
      };
    }

    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    chartInstance = new window.Chart(ctx, {
      type: isRadar ? "radar" : type,
      data: {
        labels: labels,
        datasets: [
          ds("Tasks",    counts.map(function (d) { return d.tasks; }),     "rgba(108,99,255,1)",  "0.12"),
          ds("Planner",  counts.map(function (d) { return d.plans; }),     "rgba(16,185,129,1)",  "0.1"),
          ds("Revision", counts.map(function (d) { return d.revisions; }), "rgba(59,130,246,1)",  "0.1"),
          ds("Tests",    counts.map(function (d) { return d.tests; }),     "rgba(245,158,11,1)",  "0.1")
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 750, easing: "easeOutQuart" },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: tooltipBg,
            borderColor: tooltipBdr,
            borderWidth: 1,
            titleColor: tooltipTtl,
            bodyColor: tooltipBdy,
            padding: 14,
            cornerRadius: 14,
            boxPadding: 5,
            titleFont: { size: 13, weight: "700", family: "inherit" },
            bodyFont:  { size: 12, family: "inherit" },
            callbacks: {
              title: function (items) {
                return "📅  " + items[0].label;
              },
              label: function (item) {
                if ((item.parsed.y ?? item.parsed.r ?? 0) === 0) return null;
                return "  " + item.dataset.label + ":  " +
                  (item.parsed.y ?? item.parsed.r ?? 0) + " " +
                  (item.parsed.y === 1 ? "activity" : "activities");
              },
              afterBody: function (items) {
                var t = items.reduce(function (s, i) {
                  return s + (i.parsed.y ?? i.parsed.r ?? 0);
                }, 0);
                return t > 0
                  ? ["\n  Total:  " + t + (t === 1 ? " activity" : " activities")]
                  : [];
              }
            }
          }
        },
        scales: isRadar ? {
          r: {
            grid:        { color: gridColor },
            ticks:       { color: tickColor, backdropColor: "transparent", font: { size: 10 }, stepSize: 1 },
            pointLabels: { color: tickColor, font: { size: 11, weight: "700" } }
          }
        } : {
          x: {
            stacked: !isLine,
            grid:    { color: gridColor, drawBorder: false },
            ticks:   { color: tickColor, font: { size: 12, weight: "600" } },
            border:  { display: false }
          },
          y: {
            stacked: !isLine,
            grid:    { color: gridColor, drawBorder: false },
            ticks:   { color: tickColor, font: { size: 11 }, stepSize: 1 },
            border:  { display: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  function updateInsightLine(counts, total, active, best) {
    var el = document.getElementById("chartInsightLine");
    if (!el) return;
    if (total === 0) {
      el.textContent = "No study activity recorded in the last 7 days. Add a task, planner item, revision, or test to start tracking.";
      return;
    }
    var dom = getDominantType(counts);
    var txt = "Strong weekly snapshot: " + total + " activit" + (total > 1 ? "ies" : "y") +
              " across " + active + " active day" + (active > 1 ? "s" : "") + ".";
    if (best && best.total > 0) {
      txt += " " + best.label + " led the week with " + best.total + " activit" + (best.total > 1 ? "ies" : "y") + ".";
    }
    txt += " Your main focus was " + dom.toLowerCase() + ".";
    el.textContent = txt;
  }

  /* ─── INIT ───────────────────────────────────────── */
  function init() {
    initToastContainer();

    /* Wait for dashboard.js to finish rendering (~800ms) then upgrade chart */
    waitForChartJs(function () {
      setTimeout(buildPremiumChart, 900);
    });

    /* Welcome toast */
    setTimeout(function () {
      window.showToast("info", "Dashboard Ready", "All your study data has been loaded successfully.", 4500);
    }, 1100);

    /* Re-draw chart on theme toggle (handles dark/light switch) */
    var themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        setTimeout(function () {
          var counts = readCountsFromDOM();
          drawChart(counts, currentType);
        }, 350);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 




