const API = '/api';

          let state = {
               mode: 'FOCUS', running: false, paused: false,
               remaining: 25 * 60, total: 25 * 60,
               cyclesDone: 0, cycleNum: 1, sessionId: null, startedAt: null,
               todayMins: 0, todaySessions: 0,
          };

          let durations = { FOCUS: 25, SHORT_BREAK: 5, LONG_BREAK: 15 };
          let timerInterval = null;
          const CIRC = 2 * Math.PI * 110;

          document.addEventListener('DOMContentLoaded', () => {
               if (!localStorage.getItem('userId')) { window.location.href = 'login.html'; return; }
               loadDarkMode();
               restoreState();
               loadSubjects();
               loadStats();
               loadHistory();
               renderDisplay();
               renderCircle(1.0);
          });

          function loadDarkMode() {
               if (localStorage.getItem('darkMode') === 'true') {
                    document.body.classList.add('dark-mode');
                    document.getElementById('darkIcon').className = 'fa-solid fa-sun';
                    document.getElementById('darkLabel').textContent = 'Light Mode';
               }
          }

          function toggleDark() {
               const dark = document.body.classList.toggle('dark-mode');
               localStorage.setItem('darkMode', dark);
               document.getElementById('darkIcon').className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
               document.getElementById('darkLabel').textContent = dark ? 'Light Mode' : 'Dark Mode';
          }

          function saveState() {
               localStorage.setItem('pomo_state', JSON.stringify({ ...state, savedAt: Date.now() }));
          }

          function restoreState() {
               const raw = localStorage.getItem('pomo_state');
               if (!raw) return;
               try {
                    const s = JSON.parse(raw);
                    const elapsed = Math.floor((Date.now() - s.savedAt) / 1000);
                    state.mode = s.mode || 'FOCUS';
                    state.cyclesDone = s.cyclesDone || 0;
                    state.cycleNum = s.cycleNum || 1;
                    state.sessionId = s.sessionId || null;
                    state.startedAt = s.startedAt || null;
                    state.todayMins = s.todayMins || 0;
                    state.todaySessions = s.todaySessions || 0;
                    durations[state.mode] = Math.round((s.total || state.total) / 60);

                    if (s.running && !s.paused) {
                         const adj = (s.remaining || 0) - elapsed;
                         if (adj > 0) {
                              state.remaining = adj; state.total = s.total;
                              state.running = true; startTick();
                              setStatus('running', '⏱️ Resuming where you left off...');
                         } else { onComplete(); }
                    } else if (s.paused) {
                         state.remaining = s.remaining; state.total = s.total; state.paused = true;
                         setMainIcon('play'); setStatus('paused', '⏸️ Paused — tap to resume');
                    }
                    updateModeTabs(state.mode); updateModeLabel(state.mode);
                    updateCycleDots(); updateTodayStats();
               } catch (e) { localStorage.removeItem('pomo_state'); }
          }

          function clearState() { localStorage.removeItem('pomo_state'); }

          function switchMode(mode) {
               if (state.running) { showToast('Stop current session first', 'error'); return; }
               state.mode = mode; state.remaining = durations[mode] * 60; state.total = durations[mode] * 60;
               state.running = false; state.paused = false; state.sessionId = null;
               updateModeTabs(mode); updateModeLabel(mode);
               renderDisplay(); renderCircle(1.0);
               setMainIcon('play'); setStatus('', readyText(mode)); clearState();
          }

          function updateModeTabs(mode) { document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode)); }
          function updateModeLabel(mode) { document.getElementById('modeLabel').textContent = { FOCUS: 'FOCUS', SHORT_BREAK: 'SHORT BREAK', LONG_BREAK: 'LONG BREAK' }[mode]; }
          function readyText(mode) { return { FOCUS: 'Ready to focus? Hit Start! 🎯', SHORT_BREAK: 'Short break time ☕', LONG_BREAK: 'Long break — you earned it 🛋️' }[mode]; }

          function handleMainBtn() {
               if (!state.running && !state.paused) startTimer();
               else if (state.running) pauseTimer();
               else resumeTimer();
          }

          async function startTimer() {
               const userId = localStorage.getItem('userId');
               try {
                    const res = await fetch(`${API}/pomodoro/sessions/start/${userId}`, {
                         method: 'POST', headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                              sessionType: state.mode,
                              plannedDurationMinutes: durations[state.mode],
                              linkedSubjectName: document.getElementById('linkedSubject').value || null,
                              cycleNumber: state.cycleNum,
                              notes: document.getElementById('sessionNotes').value || null,
                         })
                    });
                    if (res.ok) { const d = await res.json(); state.sessionId = d.id; }
               } catch (e) { console.warn('Offline mode'); }

               state.running = true; state.paused = false; state.startedAt = Date.now();
               startTick(); setMainIcon('pause');
               setStatus('running', { FOCUS: '🧠 Stay focused! You got this.', SHORT_BREAK: '☕ Rest your eyes.', LONG_BREAK: '🛋️ Fully relax now.' }[state.mode]);
               saveState();
          }

          function pauseTimer() { state.running = false; state.paused = true; clearInterval(timerInterval); timerInterval = null; setMainIcon('play'); setStatus('paused', '⏸️ Paused — tap to resume'); saveState(); }
          function resumeTimer() { state.paused = false; state.running = true; startTick(); setMainIcon('pause'); setStatus('running', '▶️ Back to focus!'); saveState(); }

          async function resetTimer() {
               if (state.sessionId) await endSession('CANCELLED', 0);
               clearInterval(timerInterval); timerInterval = null;
               state.running = false; state.paused = false; state.sessionId = null;
               state.remaining = durations[state.mode] * 60; state.total = durations[state.mode] * 60;
               renderDisplay(); renderCircle(1.0); setMainIcon('play'); setStatus('', readyText(state.mode)); clearState();
               showToast('Timer reset', 'info');
          }

          async function skipSession() {
               if (state.sessionId) { const e = Math.floor((Date.now() - state.startedAt) / 60000); await endSession('INTERRUPTED', e); }
               clearInterval(timerInterval); timerInterval = null;
               state.running = false; state.paused = false; determineNext(); clearState();
          }

          function startTick() {
               if (timerInterval) clearInterval(timerInterval);
               timerInterval = setInterval(() => {
                    state.remaining--;
                    if (state.remaining <= 0) { state.remaining = 0; clearInterval(timerInterval); timerInterval = null; onComplete(); return; }
                    renderDisplay(); renderCircle(state.remaining / state.total);
                    if (state.remaining % 10 === 0) saveState();
               }, 1000);
          }

          async function onComplete() {
               state.running = false; state.paused = false;
               const mins = durations[state.mode];
               await endSession('COMPLETED', mins);
               if (state.mode === 'FOCUS') { state.cyclesDone++; state.todaySessions++; state.todayMins += mins; updateTodayStats(); updateCycleDots(); }
               renderDisplay(); renderCircle(0); setMainIcon('play'); setStatus('done', '✅ Session complete!');
               clearState(); loadHistory(); playSound(); showOverlay();
          }

          async function endSession(status, mins) {
               if (!state.sessionId) return;
               const userId = localStorage.getItem('userId');
               try {
                    await fetch(`${API}/pomodoro/sessions/${state.sessionId}/update/${userId}`, {
                         method: 'PUT', headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ status, actualDurationMinutes: mins }),
                    });
               } catch (e) { }
               state.sessionId = null;
          }

          function determineNext() {
               if (state.mode === 'FOCUS') switchMode(state.cyclesDone % 4 === 0 && state.cyclesDone > 0 ? 'LONG_BREAK' : 'SHORT_BREAK');
               else { state.cycleNum = (state.cyclesDone % 4) + 1; switchMode('FOCUS'); }
          }

          function startNextSession() { closeOverlay(); determineNext(); }

          function renderDisplay() {
               const m = Math.floor(state.remaining / 60), s = state.remaining % 60;
               document.getElementById('timerDisplay').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
          }

          function renderCircle(f) { document.getElementById('progressCircle').style.strokeDashoffset = CIRC * (1 - f); }
          function setMainIcon(t) { document.getElementById('mainBtnIcon').className = t === 'pause' ? 'fa-solid fa-pause' : 'fa-solid fa-play'; }

          function setStatus(cls, text) {
               const el = document.getElementById('timerStatus');
               el.className = 'timer-status' + (cls ? ' ' + cls : ''); el.textContent = text;
          }

          function updateCycleDots() {
               const dots = document.querySelectorAll('.cycle-dot'), done = state.cyclesDone % 4;
               dots.forEach((d, i) => { d.classList.remove('completed', 'current'); if (i < done) d.classList.add('completed'); else if (i === done) d.classList.add('current'); });
          }

          function updateDurations() {
               durations.FOCUS = parseInt(document.getElementById('focusDur').value) || 25;
               durations.SHORT_BREAK = parseInt(document.getElementById('shortDur').value) || 5;
               durations.LONG_BREAK = parseInt(document.getElementById('longDur').value) || 15;
               if (!state.running && !state.paused) { state.remaining = durations[state.mode] * 60; state.total = durations[state.mode] * 60; renderDisplay(); renderCircle(1.0); }
          }

          function updateTodayStats() {
               document.getElementById('statMinutes').textContent = state.todayMins;
               document.getElementById('statSessions').textContent = state.todaySessions;
               document.getElementById('statCycle').textContent = state.cycleNum;
          }

          function showOverlay() {
               const f = state.mode === 'FOCUS';
               document.getElementById('overlayEmoji').textContent = f ? '🎉' : '✅';
               document.getElementById('overlayTitle').textContent = f ? 'Focus Session Complete!' : 'Break Complete!';
               document.getElementById('overlaySub').textContent = f ? `Great work! You completed ${durations[state.mode]} minutes of focused study.` : 'Feeling refreshed? Ready to focus again!';
               document.getElementById('overlay').classList.add('show');
          }

          function closeOverlay() { document.getElementById('overlay').classList.remove('show'); }

          function playSound() {
               try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    [523, 659, 784].forEach((freq, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; o.type = 'sine'; g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4); o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.4); });
               } catch (e) { }
          }

          function showToast(msg, type = 'info') {
               const toast = document.getElementById('toast');
               document.getElementById('toastIcon').className = `fa-solid ${{ success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' }[type]}`;
               document.getElementById('toastMsg').textContent = msg;
               toast.className = `toast ${type} show`;
               setTimeout(() => toast.classList.remove('show'), 3000);
          }

          async function loadSubjects() {
               const userId = localStorage.getItem('userId');
               try {
                    const res = await fetch(`${API}/subjects/${userId}`);
                    if (!res.ok) return;
                    const list = await res.json(), sel = document.getElementById('linkedSubject');
                    list.forEach(s => { const o = document.createElement('option'); o.value = s.subjectName || s.name; o.textContent = s.subjectName || s.name; sel.appendChild(o); });
               } catch (e) { }
          }

          async function loadStats() {
               const userId = localStorage.getItem('userId');
               try {
                    const res = await fetch(`${API}/pomodoro/analytics/${userId}`);
                    if (!res.ok) return;
                    const d = await res.json();
                    state.todayMins = d.totalFocusMinutes || 0; state.todaySessions = d.totalCompletedSessions || 0;
                    updateTodayStats();
                    document.getElementById('statStreak').textContent = (d.activeDaysThisWeek || 0) + '🔥';
               } catch (e) { }
          }

          async function loadHistory() {
               const userId = localStorage.getItem('userId'), list = document.getElementById('historyList');
               try {
                    const res = await fetch(`${API}/pomodoro/sessions/${userId}`);
                    if (!res.ok) return;
                    const sessions = await res.json(), recent = sessions.slice(0, 8);
                    if (!recent.length) { list.innerHTML = `<div class="history-empty"><i class="fa-regular fa-clock"></i>No sessions yet. Start your first Pomodoro! 🍅</div>`; return; }
                    const lbl = { FOCUS: '🧠 Focus', SHORT_BREAK: '☕ Short Break', LONG_BREAK: '🛋️ Long Break' };
                    list.innerHTML = recent.map(s => {
                         const mins = s.actualDurationMinutes || s.plannedDurationMinutes || 0;
                         const sub = s.linkedSubjectName ? ` · ${s.linkedSubjectName}` : '';
                         const t = s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                         return `<div class="history-item"><div class="history-dot ${s.sessionType}"></div><div class="history-info"><div class="history-title">${lbl[s.sessionType] || s.sessionType}${sub}</div><div class="history-meta">${mins} min · ${t}</div></div><span class="history-badge ${s.status}">${s.status}</span></div>`;
                    }).join('');
               } catch (e) { list.innerHTML = `<div class="history-empty"><i class="fa-solid fa-wifi"></i>Could not load history.</div>`; }
          }

          function handleLogout() { clearState(); localStorage.removeItem('userId'); }