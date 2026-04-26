/* ============================================================
   EduMind AI — landing.js
   ============================================================ */

(function () {
  'use strict';

  // ── THEME TOGGLE ───────────────────────────────────────────
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('edumind-theme', theme);
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('edumind-theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ── NAVBAR SCROLL ──────────────────────────────────────────
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── MOBILE HAMBURGER ───────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);

      // Animate hamburger spans
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.cssText = 'transform: rotate(45deg) translate(5px, 5px)';
        spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
        spans[2].style.cssText = 'transform: rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => s.removeAttribute('style'));
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.querySelectorAll('span').forEach(s => s.removeAttribute('style'));
      }
    });
  }

  // ── MODULES DROPDOWN ──────────────────────────────────────
  const modulesBtn = document.getElementById('modulesBtn');
  const modulesDropdown = document.getElementById('modulesDropdown');

  if (modulesBtn && modulesDropdown) {
    modulesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = modulesDropdown.classList.toggle('open');
      modulesBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!modulesBtn.contains(e.target) && !modulesDropdown.contains(e.target)) {
        modulesDropdown.classList.remove('open');
        modulesBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Keyboard accessibility
    modulesBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modulesDropdown.classList.remove('open');
        modulesBtn.setAttribute('aria-expanded', 'false');
        modulesBtn.focus();
      }
    });
  }

  // ── SCROLL REVEAL ─────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('[data-reveal]').forEach(el => {
    revealObserver.observe(el);
  });

  // Trigger hero elements immediately
  setTimeout(() => {
    document.querySelectorAll('.hero [data-reveal]').forEach(el => {
      el.classList.add('visible');
    });
  }, 100);

  // ── PARTICLE CANVAS ───────────────────────────────────────
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function getColor() {
      return html.getAttribute('data-theme') === 'dark'
        ? { r: 15, g: 224, b: 192 }
        : { r: 6, g: 155, b: 136 };
    }

    class Particle {
      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;

        // Fade in/out
        const progress = this.life / this.maxLife;
        if (progress < 0.1) {
          this.currentAlpha = this.alpha * (progress / 0.1);
        } else if (progress > 0.8) {
          this.currentAlpha = this.alpha * ((1 - progress) / 0.2);
        } else {
          this.currentAlpha = this.alpha;
        }

        if (this.life >= this.maxLife) this.reset();
      }

      draw() {
        const c = getColor();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${this.currentAlpha})`;
        ctx.fill();
      }
    }

    function init() {
      resize();
      particles = Array.from({ length: 80 }, () => new Particle());
      // Randomize starting life
      particles.forEach(p => { p.life = Math.floor(Math.random() * p.maxLife); });
    }

    function drawConnections() {
      const c = getColor();
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });
      animFrame = requestAnimationFrame(animate);
    }

    init();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas.parentElement);

    window.addEventListener('resize', resize, { passive: true });
  }

  // ── SMOOTH SCROLL ─────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });

        // Close mobile menu if open
        if (navLinks && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          hamburger.querySelectorAll('span').forEach(s => s.removeAttribute('style'));
        }
      }
    });
  });

  // ── ACTIVE NAV LINK ───────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinkEls.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));

  // ── NEWSLETTER BUTTON ─────────────────────────────────────
  const newsletterBtn = document.querySelector('.newsletter-btn');
  const newsletterInput = document.querySelector('.newsletter-input');

  if (newsletterBtn && newsletterInput) {
    newsletterBtn.addEventListener('click', () => {
      const email = newsletterInput.value.trim();
      if (email && email.includes('@')) {
        newsletterInput.value = '';
        newsletterInput.placeholder = 'Thanks! You\'re subscribed ✓';
        newsletterInput.style.borderColor = 'var(--teal)';
        setTimeout(() => {
          newsletterInput.placeholder = 'your@email.com';
          newsletterInput.style.borderColor = '';
        }, 3000);
      } else {
        newsletterInput.style.borderColor = '#e74c3c';
        setTimeout(() => {
          newsletterInput.style.borderColor = '';
        }, 2000);
      }
    });

    newsletterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') newsletterBtn.click();
    });
  }

  // ── FEAT CARD SHIMMER ON HOVER ─────────────────────────────
  document.querySelectorAll('.feat-card, .why-card, .help-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });

  // ── CTA BUTTON PULSE ──────────────────────────────────────
  const ctaBtn = document.querySelector('.btn-large');
  if (ctaBtn) {
    setInterval(() => {
      ctaBtn.style.boxShadow = '0 0 0 0 var(--teal-glow)';
      ctaBtn.animate([
        { boxShadow: '0 8px 28px var(--teal-glow), 0 0 0 0 rgba(15,224,192,0.3)' },
        { boxShadow: '0 8px 28px var(--teal-glow), 0 0 0 18px rgba(15,224,192,0)' }
      ], { duration: 1200, easing: 'ease-out' });
    }, 3500);
  }

})();