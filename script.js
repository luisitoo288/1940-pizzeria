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
    initCookieBanner();
    initReservaForm();
  });
})();

/* ============================================================
   7. COOKIE CONSENT BANNER
      Registro trazable conforme a Ley 1581 de 2012 (Colombia)
      Guarda en localStorage: decisión, timestamp, versión, userAgent
   ============================================================ */
(function () {
  'use strict';

  const CONSENT_KEY    = '1940_cookie_consent';
  const CONSENT_VERSION = '1.0'; // actualizar si cambia la política de cookies
  const CONSENT_TTL_MS  = 365 * 24 * 60 * 60 * 1000; // 12 meses

  function initCookieBanner() {
    const banner        = document.getElementById('cookie-banner');
    const btnAccept     = document.getElementById('btn-cookie-accept');
    const btnReject     = document.getElementById('btn-cookie-reject');
    const btnManage     = document.getElementById('btn-gestionar-cookies');

    if (!banner) return;

    // ── ¿Ya existe consentimiento válido? ──────────────────────
    const saved = getConsentRecord();
    if (saved && saved.expires && Date.now() < saved.expires) {
      // Consentimiento ya registrado y no expirado → no mostrar
      return;
    }

    // Mostrar el banner
    banner.removeAttribute('hidden');
    banner.focus();

    // ── Botones del banner ─────────────────────────────────────
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        saveConsentRecord('accepted');
        hideBanner(banner);
      });
    }

    if (btnReject) {
      btnReject.addEventListener('click', () => {
        saveConsentRecord('rejected');
        hideBanner(banner);
      });
    }

    // Botón "Gestionar Cookies" en el footer → reabre el banner
    if (btnManage) {
      btnManage.addEventListener('click', () => {
        banner.removeAttribute('hidden');
        banner.scrollIntoView({ behavior: 'smooth', block: 'end' });
        // Limpiar consentimiento previo para que el usuario pueda cambiar su decisión
        try { localStorage.removeItem(CONSENT_KEY); } catch (_) {}
      });
    }
  }

  function hideBanner(banner) {
    banner.setAttribute('hidden', '');
  }

  /**
   * Guarda el registro de consentimiento en localStorage.
   * Campos registrados (trazabilidad SIC):
   *   - decision:    'accepted' | 'rejected'
   *   - timestamp:   ISO 8601 (fecha y hora exacta de la decisión)
   *   - version:     versión de la política de cookies vigente
   *   - expires:     timestamp epoch de expiración (12 meses)
   *   - userAgent:   tipo de dispositivo/navegador (sin PII directa)
   *   - lang:        idioma del navegador
   */
  function saveConsentRecord(decision) {
    const now = Date.now();
    const record = {
      decision:  decision,
      timestamp: new Date(now).toISOString(),
      version:   CONSENT_VERSION,
      expires:   now + CONSENT_TTL_MS,
      userAgent: navigator.userAgent ? navigator.userAgent.substring(0, 200) : 'unknown',
      lang:      navigator.language || 'unknown',
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch (e) {
      // localStorage no disponible (modo incógnito estricto, etc.)
      console.warn('1940 Pizzeria: no se pudo guardar el registro de consentimiento:', e);
    }
  }

  function getConsentRecord() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  // Exponer públicamente para que initCookieBanner() pueda llamarse desde el IIFE principal
  window._1940initCookieBanner = initCookieBanner;

  document.addEventListener('DOMContentLoaded', initCookieBanner);
})();

/* ============================================================
   8. FORMULARIO DE RESERVA
      Valida checkboxes legales (T&C + Privacidad) y abre
      WhatsApp con los datos del formulario.
      Genera registro local del consentimiento del formulario.
   ============================================================ */
(function () {
  'use strict';

  const FORM_CONSENT_KEY = '1940_form_consents';

  function initReservaForm() {
    const form      = document.getElementById('form-reserva');
    const feedback  = document.getElementById('form-reserva-feedback');
    const submitBtn = document.getElementById('btn-reserva-submit');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // ── Limpiar feedback previo ──────────────────────────────
      hideFeedback(feedback);

      // ── Recoger valores ──────────────────────────────────────
      const nombre    = form.querySelector('#reserva-nombre')?.value.trim()   || '';
      const telefono  = form.querySelector('#reserva-telefono')?.value.trim() || '';
      const fecha     = form.querySelector('#reserva-fecha')?.value            || '';
      const personas  = form.querySelector('#reserva-personas')?.value         || '';
      const mensaje   = form.querySelector('#reserva-mensaje')?.value.trim()  || '';
      const chkTerminos   = form.querySelector('#check-terminos');
      const chkPrivacidad = form.querySelector('#check-privacidad');

      // ── Validaciones ─────────────────────────────────────────
      const errors = [];

      if (!nombre)   errors.push('Por favor ingresa tu nombre completo.');
      if (!telefono) errors.push('Por favor ingresa tu número de WhatsApp o teléfono.');
      if (!fecha)    errors.push('Por favor selecciona la fecha deseada para tu reserva.');
      if (!personas) errors.push('Por favor selecciona el número de personas.');

      if (!chkTerminos?.checked) {
        errors.push('Debes aceptar los Términos y Condiciones para continuar.');
        if (chkTerminos) chkTerminos.focus();
      }

      if (!chkPrivacidad?.checked) {
        errors.push('Debes autorizar el tratamiento de tus datos personales para continuar.');
        if (!chkTerminos?.checked && chkPrivacidad) chkPrivacidad.focus();
      }

      if (errors.length) {
        showFeedback(feedback, errors.join(' '), 'error');
        return;
      }

      // ── Registrar consentimiento del formulario ──────────────
      // (trazabilidad: quién, cuándo, qué versión de política aceptó)
      saveFormConsent({ nombre, telefono, fecha, personas });

      // ── Construir mensaje de WhatsApp ────────────────────────
      const fechaFormateada = fecha
        ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })
        : fecha;

      const waMsg = [
        '🍕 *Solicitud de Reserva — 1940 La Pizzeria*',
        '',
        `👤 *Nombre:* ${nombre}`,
        `📅 *Fecha:* ${fechaFormateada}`,
        `👥 *Personas:* ${personas}`,
        `📱 *Teléfono:* ${telefono}`,
        mensaje ? `💬 *Notas:* ${mensaje}` : null,
        '',
        '_He aceptado los Términos y Condiciones y la Política de Privacidad de 1940 La Pizzeria._',
      ].filter(Boolean).join('\n');

      const waNumber = '573000000000'; // ← reemplaza con el número real
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

      // Mostrar feedback de éxito antes de abrir WA
      showFeedback(
        feedback,
        '✅ ¡Listo! Abriendo WhatsApp para confirmar tu reserva...',
        'success'
      );

      submitBtn.disabled = true;

      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        form.reset();
        submitBtn.disabled = false;
        setTimeout(() => hideFeedback(feedback), 4000);
      }, 800);
    });
  }

  /**
   * Guarda un registro del consentimiento dado a través del formulario.
   * Campos (trazabilidad para auditoría SIC):
   *   - timestamp:        ISO 8601
   *   - policyVersion:    versión de Política de Privacidad aceptada
   *   - termsVersion:     versión de T&C aceptados
   *   - formId:           identificador del formulario
   *   - userAgent:        navegador/dispositivo
   */
  function saveFormConsent(userData) {
    const record = {
      timestamp:     new Date().toISOString(),
      policyVersion: '1.0',
      termsVersion:  '1.0',
      formId:        'form-reserva',
      // Guardamos solo iniciales del nombre + teléfono parcial para identificar la sesión
      // sin almacenar datos completos de forma permanente en el cliente
      refNombre:     userData.nombre ? userData.nombre.charAt(0) + '***' : '',
      refFecha:      userData.fecha  || '',
      userAgent:     navigator.userAgent ? navigator.userAgent.substring(0, 150) : 'unknown',
      lang:          navigator.language || 'unknown',
    };

    try {
      const existing = JSON.parse(localStorage.getItem(FORM_CONSENT_KEY) || '[]');
      existing.push(record);
      // Conservar solo los últimos 50 registros
      const trimmed = existing.slice(-50);
      localStorage.setItem(FORM_CONSENT_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('1940 Pizzeria: no se pudo guardar el registro de consentimiento del formulario:', e);
    }
  }

  function showFeedback(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `form-feedback ${type}`;
    el.removeAttribute('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideFeedback(el) {
    if (!el) return;
    el.setAttribute('hidden', '');
    el.textContent = '';
    el.className = 'form-feedback';
  }

  document.addEventListener('DOMContentLoaded', initReservaForm);
})();

