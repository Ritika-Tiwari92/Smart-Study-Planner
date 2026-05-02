/**
 * EduMind AI — Auth Theme Toggle
 * auth-theme.js
 * Same localStorage key as landing-page.js: 'edumind-theme'
 * Theme persists across all pages.
 */
(function () {
  'use strict';

  const html        = document.documentElement;
  const STORAGE_KEY = 'edumind-theme';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);

    const sunIcon  = document.querySelector('.auth-theme-sun');
    const moonIcon = document.querySelector('.auth-theme-moon');
    const btn      = document.getElementById('authThemeToggle');

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.opacity   = '0';
        sunIcon.style.transform = 'rotate(90deg) scale(0.6)';
        moonIcon.style.opacity  = '1';
        moonIcon.style.transform = 'none';
      } else {
        moonIcon.style.opacity   = '0';
        moonIcon.style.transform = 'rotate(-90deg) scale(0.6)';
        sunIcon.style.opacity   = '1';
        sunIcon.style.transform = 'none';
      }
    }

    if (btn) {
      btn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /* Apply immediately to prevent FOUC */
  const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  html.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(saved);

    const btn = document.getElementById('authThemeToggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const current = html.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
})();