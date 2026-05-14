(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const cards = $$('.card');
  $('#count-total').textContent = cards.length;

  // Menu mobile
  const toggle = $('.menu-toggle');
  const nav = $('#topnav');
  const closeMenu = () => {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  toggle.addEventListener('click', () => nav.classList.contains('open') ? closeMenu() : openMenu());
  $$('.topnav a').forEach(a => a.addEventListener('click', () => { if (window.innerWidth <= 768) closeMenu(); }));

  // Scroll-spy
  const sections = $$('main section[id], .categoria[id]');
  const navLinks = $$('.topnav a');
  const setActive = (id) => {
    navLinks.forEach(l => {
      const target = l.getAttribute('href').replace('#', '');
      l.classList.toggle('active', target === id || (target === 'tutoriais' && ['primeiro-acesso','email','seguranca','certificado','onedrive','chamado'].includes(id)));
    });
  };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  // Busca
  const busca = $('#busca');
  const semResultados = $('#sem-resultados');
  const categorias = $$('.categoria');

  busca.addEventListener('input', () => {
    const termo = busca.value.trim().toLowerCase();
    let total = 0;
    categorias.forEach(cat => {
      const cs = $$('.card', cat);
      let visiveis = 0;
      cs.forEach(card => {
        const texto = (card.textContent + ' ' + (card.dataset.tags || '')).toLowerCase();
        const match = !termo || texto.includes(termo);
        card.style.display = match ? '' : 'none';
        if (match) visiveis++;
      });
      cat.style.display = visiveis > 0 ? '' : 'none';
      total += visiveis;
    });
    semResultados.hidden = total > 0 || !termo;
  });

  // Atalho "/" para busca
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault(); busca.focus();
    }
    if (e.key === 'Escape') {
      if (nav.classList.contains('open')) closeMenu();
      if (document.activeElement === busca) busca.blur();
    }
  });

  // ============================================
  // CONSTELAÇÃO INTERATIVA (canvas no hero)
  // ============================================
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = $('#constellation');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    const mouse = { x: -9999, y: -9999, active: false };

    const COLORS = ['#4d7cff', '#00d9ff', '#7cb9ff', '#1e5fff', '#6b8eff'];
    const MAX_DIST = 130;
    const MOUSE_RADIUS = 140;

    function resize() {
      const rect = hero.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // densidade adaptativa
      const target = Math.min(110, Math.round((w * h) / 14000));
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .3,
        r: Math.random() * 1.5 + .8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // repulsão do mouse
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const d = Math.sqrt(d2) || 1;
            const force = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
            p.vx += (dx / d) * force * .8;
            p.vy += (dy / d) * force * .8;
          }
        }

        p.x += p.vx; p.y += p.vy;
        p.vx *= .96; p.vy *= .96; // atrito

        // drift mínimo para nunca parar
        if (Math.abs(p.vx) < .05) p.vx += (Math.random() - .5) * .1;
        if (Math.abs(p.vy) < .05) p.vy += (Math.random() - .5) * .1;

        // wrap edges
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      // linhas de conexão
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_DIST * MAX_DIST) {
            const alpha = 1 - Math.sqrt(d2) / MAX_DIST;
            ctx.strokeStyle = `rgba(77, 124, 255, ${alpha * .4})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // linhas conectando ao mouse
      if (mouse.active) {
        for (const p of particles) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
            const alpha = 1 - Math.sqrt(d2) / MOUSE_RADIUS;
            ctx.strokeStyle = `rgba(0, 217, 255, ${alpha * .6})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(step);
    }

    let rafId;
    let running = false;
    function start() { if (!running) { running = true; rafId = requestAnimationFrame(step); } }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener('mouseleave', () => { mouse.active = false; });

    // pausa quando hero sai da viewport
    const visObs = new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    });
    visObs.observe(hero);

    window.addEventListener('resize', () => { resize(); });
    resize();
    start();
  }

  // ============================================
  // TILT 3D NOS CARDS
  // ============================================
  if (!reduceMotion) {
    const TILT_MAX = 8; // graus
    cards.forEach(card => {
      let rafTilt;
      const reset = () => {
        card.style.transform = '';
      };
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width;   // 0..1
        const py = y / rect.height;  // 0..1
        const rotY = (px - .5) * TILT_MAX * 2;
        const rotX = -(py - .5) * TILT_MAX * 2;

        // brilho radial via CSS vars
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);

        cancelAnimationFrame(rafTilt);
        rafTilt = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        cancelAnimationFrame(rafTilt);
        reset();
      });
    });
  }

  // Reveal on scroll
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        reveal.unobserve(e.target);
      }
    });
  }, { threshold: .1 });
  $$('.card, .categoria, .brands li').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity .5s ease ${i * 30}ms, transform .5s ease ${i * 30}ms`;
    reveal.observe(el);
  });
})();
