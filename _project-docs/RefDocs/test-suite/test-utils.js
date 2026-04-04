/**
 * EssayEase Test Suite - Shared Utilities
 * Handles status tracking, localStorage persistence, and summary counts.
 */

// Page key for localStorage (derived from filename)
const PAGE_KEY = 'essayease_tests_' + location.pathname.split('/').pop().replace('.html', '');

// Load saved state on page load
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateCounts();
});

// Toggle section collapse
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.toggle('collapsed');
  }
}

// Set test status via button click
function setStatus(btn, status) {
  const row = btn.closest('.test-row');
  if (!row) return;

  const testId = row.dataset.test;
  const statusEl = row.querySelector('.test-status .status-label');

  // Clear all active states on sibling buttons
  const buttons = row.querySelectorAll('.status-btn');
  buttons.forEach(b => {
    b.classList.remove('active-pass', 'active-fail', 'active-skip', 'active-blocked');
  });

  // Toggle: if clicking same status, revert to pending
  if (statusEl.textContent.toLowerCase() === status) {
    statusEl.className = 'status-label pending';
    statusEl.textContent = 'Pending';
    saveTestState(testId, 'pending');
  } else {
    statusEl.className = 'status-label ' + status;
    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    btn.classList.add('active-' + status);
    saveTestState(testId, status);
  }

  updateCounts();
}

// Save individual test state
function saveTestState(testId, status) {
  const state = JSON.parse(localStorage.getItem(PAGE_KEY) || '{}');
  if (!state.tests) state.tests = {};
  state.tests[testId] = state.tests[testId] || {};
  state.tests[testId].status = status;
  localStorage.setItem(PAGE_KEY, JSON.stringify(state));
}

// Save note for a test
function saveNote(testId, note) {
  const state = JSON.parse(localStorage.getItem(PAGE_KEY) || '{}');
  if (!state.tests) state.tests = {};
  state.tests[testId] = state.tests[testId] || {};
  state.tests[testId].note = note;
  localStorage.setItem(PAGE_KEY, JSON.stringify(state));
}

// Load all saved state
function loadState() {
  const state = JSON.parse(localStorage.getItem(PAGE_KEY) || '{}');
  if (!state.tests) return;

  document.querySelectorAll('.test-row').forEach(row => {
    const testId = row.dataset.test;
    const saved = state.tests[testId];
    if (!saved) return;

    // Restore status
    if (saved.status && saved.status !== 'pending') {
      const statusEl = row.querySelector('.test-status .status-label');
      statusEl.className = 'status-label ' + saved.status;
      statusEl.textContent = saved.status.charAt(0).toUpperCase() + saved.status.slice(1);

      // Restore active button highlight
      const buttons = row.querySelectorAll('.status-btn');
      buttons.forEach(b => {
        if (b.textContent.toLowerCase() === saved.status) {
          b.classList.add('active-' + saved.status);
        }
      });
    }

    // Restore checkbox
    if (saved.status === 'pass') {
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = true;
    }

    // Restore notes
    if (saved.note) {
      const textarea = row.querySelector('.test-notes textarea');
      if (textarea) textarea.value = saved.note;
    }
  });

  // Attach note save listeners
  document.querySelectorAll('.test-row').forEach(row => {
    const testId = row.dataset.test;
    const textarea = row.querySelector('.test-notes textarea');
    if (textarea) {
      textarea.addEventListener('input', () => {
        saveNote(testId, textarea.value);
      });
    }
  });
}

// Update summary counts
function updateCounts() {
  let pass = 0, fail = 0, skip = 0, blocked = 0, total = 0;

  document.querySelectorAll('.test-row').forEach(row => {
    total++;
    const statusEl = row.querySelector('.test-status .status-label');
    const status = statusEl.textContent.toLowerCase();
    if (status === 'pass') pass++;
    else if (status === 'fail') fail++;
    else if (status === 'skip') skip++;
    else if (status === 'blocked') blocked++;
  });

  const setCount = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setCount('total-count', total);
  setCount('pass-count', pass);
  setCount('fail-count', fail);
  setCount('skip-count', skip);
  setCount('blocked-count', blocked);

  // Update progress bar if present
  const bar = document.querySelector('.progress-bar');
  if (bar && total > 0) {
    const passBar = bar.querySelector('.pass-bar');
    const failBar = bar.querySelector('.fail-bar');
    const skipBar = bar.querySelector('.skip-bar');
    if (passBar) passBar.style.width = (pass / total * 100) + '%';
    if (failBar) failBar.style.width = (fail / total * 100) + '%';
    if (skipBar) skipBar.style.width = (skip / total * 100) + '%';
  }

  const label = document.querySelector('.progress-label');
  if (label) {
    const done = pass + fail + skip + blocked;
    label.textContent = done + ' / ' + total + ' completed (' + Math.round(done / total * 100) + '%)';
  }
}
