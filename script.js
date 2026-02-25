/* =============================================
   PORTFOLIO JAVASCRIPT
   - Navbar scroll effect & mobile menu
   - Reveal-on-scroll animations
   - Active nav link highlighting
   ============================================= */

// ── Navbar scroll effect ──────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── Mobile hamburger menu ─────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  // animate hamburger lines → X
  const spans = hamburger.querySelectorAll('span');
  hamburger.classList.toggle('active');
  if (hamburger.classList.contains('active')) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

// ── Reveal on scroll ─────────────────────────
const revealEls = document.querySelectorAll('[data-reveal], .timeline-item, .project-card');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger sibling items for a nicer cascade
      const siblings = [...entry.target.parentElement.children];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('revealed');
      }, idx * 120);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));

// ── Active nav link on scroll ─────────────────
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAnchors.forEach(a => {
        a.classList.toggle('active-nav', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// ── Inject active-nav style ───────────────────
const style = document.createElement('style');
style.textContent = `.nav-links a.active-nav { color: var(--text) !important; background: var(--surface) !important; }`;
document.head.appendChild(style);

// ── Smooth number count-up on hero stats ─────
function countUp(el, target, duration = 1800) {
  const isFloat = String(target).includes('.');
  const start   = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current  = target * ease;
    el.textContent = isFloat
      ? current.toFixed(2)
      : Math.floor(current).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isFloat ? String(target) : el.textContent;
  }
  requestAnimationFrame(step);
}

// Only run once when hero-stats enters the viewport
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  const statsObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    statsObserver.disconnect();

    const statNums = heroStats.querySelectorAll('.stat-num');
    const targets  = [150, 19000, 6000, 3.81];
    statNums.forEach((el, i) => {
      const original = el.textContent;
      countUp(el, targets[i]);
      // restore prefix/suffix after animation
      setTimeout(() => {
        if (i === 0) el.textContent = '150M+';
        if (i === 1) el.textContent = '$19K';
        if (i === 2) el.textContent = '6,000+';
      }, 1900);
    });
  }, { threshold: 0.5 });
  statsObserver.observe(heroStats);
}

// ── Parallax orbs on mouse move ───────────────
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.orb');
  const cx   = window.innerWidth  / 2;
  const cy   = window.innerHeight / 2;
  const dx   = (e.clientX - cx) / cx;
  const dy   = (e.clientY - cy) / cy;

  orbs.forEach((orb, i) => {
    const factor = (i + 1) * 12;
    orb.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
  });
}, { passive: true });
