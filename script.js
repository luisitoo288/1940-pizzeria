/* ============================================================
   1940 LA PIZZERIA — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. SMOOTH SECTION-CHANGE ANIMATION (scroll reveal)
        Uses IntersectionObserver to animate sections as they
        come into the viewport.
     ============================================================ */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.section-reveal');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     2. SIDEBAR ACTIVE LINK on scroll
     ============================================================ */
  function initSidebarActiveLink() {
    const links = document.querySelectorAll('.sidebar-link[data-section]');
    if (!links.length) return;

    const sections = Array.from(links)
      .map((l) => document.getElementById(l.dataset.section))
      .filter(Boolean);

    function onScroll() {
      let current = null;
      const scrollY = window.scrollY + 150;
      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollY) current = sec.id;
      });
      links.forEach((l) => {
        l.classList.toggle('active', l.dataset.section === current);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     3. SIDEBAR SMOOTH SCROLL on link click
     ============================================================ */
  function initSidebarScroll() {
    document.querySelectorAll('.sidebar-link[data-section]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.section);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ============================================================
     4. MOZZARELLA PHYSICS CANVAS (sidebar)
        Blob with spring physics + mouse interaction.
     ============================================================ */
  function initMozzarellaCheese() {
    const canvas = document.getElementById('mozzarella-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width  = 64;
    const H = canvas.height = 120;
    const cx = W / 2;
    const cy = H / 2 - 8;

    // --- Physics state ---
    let vx = 0, vy = 0;      // velocity
    let ox = 0, oy = 0;      // offset from rest
    let angV = 0, angle = 0; // angular velocity & rotation
    let squash = 1, squashV = 0; // squash/stretch

    // Mouse interaction
    let dragging = false;
    let dragStartX = 0, dragStartY = 0;
    let lastMouseX = 0, lastMouseY = 0;

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (W / rect.width),
        y: (clientY - rect.top)  * (H / rect.height),
      };
    }

    canvas.addEventListener('mousedown', (e) => {
      dragging = true;
      const p = getCanvasPos(e);
      dragStartX = p.x; dragStartY = p.y;
      lastMouseX = p.x; lastMouseY = p.y;
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const p = getCanvasPos(e);
      const dx = p.x - lastMouseX;
      const dy = p.y - lastMouseY;
      vx += dx * 0.5;
      vy += dy * 0.5;
      angV += dx * 0.04;
      lastMouseX = p.x; lastMouseY = p.y;
    });

    window.addEventListener('mouseup', () => { dragging = false; });

    // Ambient idle wobble
    let idleTime = 0;

    function update() {
      idleTime += 0.02;

      // Spring physics
      const spring = 0.06;
      const damping = 0.88;

      vx += -ox * spring;
      vy += -oy * spring;
      vx *= damping;
      vy *= damping;
      ox += vx;
      oy += vy;

      // Rotation spring
      angV += -angle * 0.04;
      angV *= 0.85;
      angle += angV;

      // Squash/stretch spring
      const speed = Math.sqrt(vx * vx + vy * vy);
      const targetSquash = 1 + speed * 0.04 * (vy > 0 ? -1 : 1);
      squashV += (targetSquash - squash) * 0.3;
      squashV *= 0.7;
      squash += squashV;
      squash = Math.max(0.6, Math.min(1.5, squash));

      // Idle gentle bob when nothing is happening
      if (!dragging && Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
        oy += Math.sin(idleTime * 1.2) * 0.18;
        ox += Math.cos(idleTime * 0.7) * 0.08;
      }
    }

    function drawCheeseDrip(ctx, x, y, r) {
      // Drip shape hanging from blob
      ctx.beginPath();
      ctx.moveTo(x - r * 0.18, y + r * 0.7);
      ctx.quadraticCurveTo(x - r * 0.22, y + r * 1.1, x, y + r * 1.25);
      ctx.quadraticCurveTo(x + r * 0.22, y + r * 1.1, x + r * 0.18, y + r * 0.7);
      const grad = ctx.createLinearGradient(x, y + r * 0.7, x, y + r * 1.25);
      grad.addColorStop(0, 'rgba(255, 220, 140, 0.9)');
      grad.addColorStop(1, 'rgba(255, 200, 80, 0.4)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function drawBlob(ctx, x, y, rx, ry, rot) {
      // Use path with 8 control points for organic blob
      const N = 8;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wobble = 1 + 0.12 * Math.sin(idleTime * 2 + i * 1.3);
        pts.push({
          x: x + Math.cos(a) * rx * wobble,
          y: y + Math.sin(a) * ry * wobble,
        });
      }

      // Rotate points
      const cos = Math.cos(rot), sin = Math.sin(rot);
      const rpts = pts.map((p) => ({
        x: x + (p.x - x) * cos - (p.y - y) * sin,
        y: y + (p.x - x) * sin + (p.y - y) * cos,
      }));

      ctx.beginPath();
      rpts.forEach((p, i) => {
        const next = rpts[(i + 1) % N];
        const mx = (p.x + next.x) / 2;
        const my = (p.y + next.y) / 2;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.quadraticCurveTo(p.x, p.y, mx, my);
      });
      ctx.closePath();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      const bx = cx + ox;
      const by = cy + oy;
      const baseR = 22;
      const rx = baseR / squash;
      const ry = baseR * squash;

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(255,180,50,0.18)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;

      // Draw drip first (behind)
      drawCheeseDrip(ctx, bx, by, baseR);

      // Cheese blob gradient
      const grad = ctx.createRadialGradient(bx - rx * 0.25, by - ry * 0.25, 0, bx, by, baseR * 1.3);
      grad.addColorStop(0, '#fff8dc');
      grad.addColorStop(0.35, '#ffe082');
      grad.addColorStop(0.7, '#ffca28');
      grad.addColorStop(1, '#e5a93b');

      drawBlob(ctx, bx, by, rx, ry, angle);
      ctx.fillStyle = grad;
      ctx.fill();

      // Cheese holes / texture
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#c17f00';

      [[bx - 5, by - 3, 3], [bx + 7, by + 5, 2.5], [bx - 2, by + 8, 2]].forEach(([hx, hy, hr]) => {
        ctx.beginPath();
        ctx.ellipse(
          hx + ox * 0.2, hy + oy * 0.2,
          hr * (1 / squash), hr * squash,
          angle, 0, Math.PI * 2
        );
        ctx.fill();
      });

      // Highlight
      ctx.globalAlpha = 0.55;
      const hGrad = ctx.createRadialGradient(bx - rx * 0.3, by - ry * 0.35, 0, bx - rx * 0.3, by - ry * 0.35, rx * 0.8);
      hGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
      hGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(bx - rx * 0.3, by - ry * 0.35, rx * 0.45, ry * 0.3, angle, 0, Math.PI * 2);
      ctx.fillStyle = hGrad;
      ctx.fill();

      ctx.restore();
    }

    function loop() {
      update();
      render();
      requestAnimationFrame(loop);
    }

    loop();
  }

  /* ============================================================
     5. FILTER BUTTONS (menu search/filter)
     ============================================================ */
  function initMenuFilters() {
    const searchInput = document.getElementById('menu-search');
    const menuItems = document.querySelectorAll('.menu-item');
    const filterAll       = document.getElementById('filter-all');
    const filterClasicas  = document.getElementById('filter-clasicas');
    const filterEspeciales= document.getElementById('filter-especiales');
    const filterAdiciones = document.getElementById('filter-adiciones');
    const secClasicas   = document.getElementById('section-clasicas');
    const secEspeciales = document.getElementById('section-especiales');
    const secBordes     = document.getElementById('section-bordes');
    const secAdiciones  = document.getElementById('section-adiciones');

    if (!filterAll) return;

    const filterButtons = [filterAll, filterClasicas, filterEspeciales, filterAdiciones];

    function setActiveFilterBtn(btn) {
      filterButtons.forEach((b) => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
    }

    filterAll.addEventListener('click', () => {
      setActiveFilterBtn(filterAll);
      [secClasicas, secEspeciales, secBordes, secAdiciones].forEach((s) => s && s.classList.remove('hidden'));
    });

    filterClasicas.addEventListener('click', () => {
      setActiveFilterBtn(filterClasicas);
      secClasicas && secClasicas.classList.remove('hidden');
      [secEspeciales, secBordes, secAdiciones].forEach((s) => s && s.classList.add('hidden'));
    });

    filterEspeciales.addEventListener('click', () => {
      setActiveFilterBtn(filterEspeciales);
      secEspeciales && secEspeciales.classList.remove('hidden');
      [secClasicas, secBordes, secAdiciones].forEach((s) => s && s.classList.add('hidden'));
    });

    filterAdiciones.addEventListener('click', () => {
      setActiveFilterBtn(filterAdiciones);
      [secBordes, secAdiciones].forEach((s) => s && s.classList.remove('hidden'));
      [secClasicas, secEspeciales].forEach((s) => s && s.classList.add('hidden'));
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (q) {
          [secClasicas, secEspeciales, secBordes, secAdiciones].forEach((s) => s && s.classList.remove('hidden'));
        }
        menuItems.forEach((item) => {
          item.style.display = item.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      });
    }
  }

  /* ============================================================
     6. NAV ACTIVE STATE on scroll
     ============================================================ */
  function initNavActiveState() {
    const navLinks = document.querySelectorAll('nav a[data-section]');
    if (!navLinks.length) return;

    const sections = Array.from(navLinks)
      .map((l) => document.getElementById(l.dataset.section))
      .filter(Boolean);

    const activeClasses = ['bg-surface-container-high', 'text-on-surface', 'rounded-lg'];
    const inactiveClasses = ['text-on-surface-variant'];

    function onScroll() {
      let current = sections[0]?.id || null;
      const scrollY = window.scrollY + 160;
      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollY) current = sec.id;
      });
      navLinks.forEach((l) => {
        const isActive = l.dataset.section === current;
        activeClasses.forEach((c) => l.classList.toggle(c, isActive));
        inactiveClasses.forEach((c) => l.classList.toggle(c, !isActive));
        l.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Smooth scroll for nav links too
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const target = document.getElementById(link.dataset.section);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initSidebarActiveLink();
    initSidebarScroll();
    initMozzarellaCheese();
    initMenuFilters();
    initNavActiveState();
  });
})();
