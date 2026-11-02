/* CredZenta site interactions */
(() => {
  const doc = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- theme ---------- */
  $$('.theme-toggle').forEach((btn) => btn.addEventListener('click', () => {
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('cz-theme', next); } catch (e) { /* storage unavailable */ }
  }));

  /* ---------- nav: scrolled state, progress bar, mobile menu ---------- */
  const nav = $('#site-nav');
  const progress = $('.scroll-progress');
  const onScroll = () => {
    const y = window.scrollY;
    nav && nav.classList.toggle('scrolled', y > 10);
    if (progress) {
      const h = document.body.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? Math.min(y / h, 1) : 0})`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('.menu-btn');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    $$('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.dispatchEvent(new CustomEvent('inview'));
      revealIO.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal], [data-inview]').forEach((el) => revealIO.observe(el));

  /* ---------- card spotlight ---------- */
  $$('.card, .mini').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- count-up numbers ---------- */
  const countUp = (el, dur = 1100) => {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const pre = el.dataset.pre || '';
    const suf = el.dataset.suf || '';
    if (reduceMotion) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = pre + v.toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  $$('[data-count]').forEach((el) => {
    const host = el.closest('[data-inview]') || el;
    if (host === el) revealIO.observe(el);
    host.addEventListener('inview', () => countUp(el), { once: true });
  });

  /* ---------- typed rotating words ---------- */
  $$('.typed[data-words]').forEach(async (el) => {
    const words = el.dataset.words.split('|');
    if (reduceMotion) { el.textContent = words[0]; return; }
    for (let i = 0; ; i = (i + 1) % words.length) {
      const w = words[i];
      for (let c = 1; c <= w.length; c++) { el.textContent = w.slice(0, c); await sleep(45); }
      await sleep(1800);
      for (let c = w.length; c >= 0; c--) { el.textContent = w.slice(0, c); await sleep(22); }
      await sleep(250);
    }
  });

  /* ---------- neural network canvas ---------- */
  $$('.hero-canvas').forEach((canvas) => {
    if (reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, pts = [], visible = true, raf;
    const mouse = { x: -9999, y: -9999 };
    const pulses = [];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.8, c: Math.random() < 0.55 ? '82,51,245' : '20,217,167',
      }));
    };
    const LINK = 130;
    const frame = () => {
      const dark = doc.getAttribute('data-theme') === 'dark';
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        if (d < 160) { p.x -= dx * 0.004; p.y -= dy * 0.004; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / LINK) * (dark ? 0.32 : 0.2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            if (pulses.length < 7 && Math.random() < 0.0004) pulses.push({ a, b, t: 0 });
          }
        }
        const md = Math.hypot(mouse.x - a.x, mouse.y - a.y);
        if (md < 180) {
          ctx.strokeStyle = `rgba(20,217,167,${(1 - md / 180) * 0.45})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${p.c},${dark ? 0.85 : 0.6})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const q = pulses[i];
        q.t += 0.02;
        if (q.t >= 1) { pulses.splice(i, 1); continue; }
        const x = q.a.x + (q.b.x - q.a.x) * q.t, y = q.a.y + (q.b.y - q.a.y) * q.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, 'rgba(20,217,167,.95)'); g.addColorStop(1, 'rgba(20,217,167,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(frame);
    };
    const host = canvas.parentElement;
    host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(frame);
    }).observe(canvas);
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
  });

  /* ---------- hero tilt ---------- */
  $$('[data-tilt]').forEach((wrap) => {
    if (reduceMotion || window.matchMedia('(hover: none)').matches) return;
    const ws = wrap.firstElementChild;
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      ws.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    wrap.addEventListener('pointerleave', () => { ws.style.transform = ''; });
  });

  /* ---------- AI credit-memo engine (hero mockup) ---------- */
  const cam = $('#cam');
  if (cam) {
    const docs = $$('.doc', cam);
    const metrics = $$('.metric', cam);
    const vrows = $$('.vrow', cam);
    const chips = $$('.chip', cam);
    const marker = $('.band-marker', cam);
    const memo = $('.memo', cam);
    const memoBar = $('.memo-bar i', cam);
    const memoTitle = $('.memo-txt b', cam);
    const memoSub = $('.memo-txt small', cam);
    const stageTxt = $('.stage-txt', cam);
    const dots = $$('.stage-dots i', cam);
    const riskPill = $('.risk-top .pill', cam);
    const live = $('.ws-live span', cam);
    let onScreen = true;
    let wake = null;
    new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen && wake) { wake(); wake = null; } }).observe(cam);
    const wait = async (ms) => { await sleep(ms); while (!onScreen) await new Promise((r) => { wake = r; }); };
    const stage = (i, txt) => { stageTxt.textContent = txt; dots.forEach((d, k) => d.classList.toggle('on', k <= i)); };

    const reset = () => {
      docs.forEach((d) => d.classList.remove('scanning', 'done'));
      metrics.forEach((m) => { m.classList.add('shimmer'); m.classList.remove('filled'); $('b', m).textContent = '—'; });
      vrows.forEach((v) => v.classList.remove('on'));
      chips.forEach((c) => c.classList.remove('on'));
      marker.style.left = '0%';
      riskPill.className = 'pill neutral'; riskPill.textContent = 'Pending';
      memo.classList.remove('ready'); memoBar.style.width = '0%';
      memoTitle.textContent = 'Credit memo (CAM)'; memoSub.textContent = 'Waiting for analysis';
      live.textContent = 'AI working';
    };
    const finalState = () => {
      docs.forEach((d) => d.classList.add('done'));
      metrics.forEach((m) => { m.classList.remove('shimmer'); m.classList.add('filled'); const b = $('b', m); b.textContent = (b.dataset.pre || '') + parseFloat(b.dataset.to).toFixed(+b.dataset.dec || 0) + (b.dataset.suf || ''); });
      vrows.forEach((v) => v.classList.add('on'));
      chips.forEach((c) => c.classList.add('on'));
      marker.style.left = '30%';
      riskPill.className = 'pill good'; riskPill.textContent = 'Low–Moderate';
      memo.classList.add('ready'); memoBar.style.width = '100%';
      memoTitle.textContent = 'Credit memo ready'; memoSub.textContent = 'Draft CAM · ready for review';
      stage(5, 'Credit memo ready — awaiting your review'); live.textContent = 'Ready';
    };

    if (reduceMotion) finalState();
    else (async () => {
      await wait(500);
      for (;;) {
        reset();
        stage(0, 'Reading loan file…');
        for (const d of docs) { d.classList.add('scanning'); await wait(650); d.classList.replace('scanning', 'done'); }
        stage(1, 'Extracting & structuring financial data…');
        cam.classList.add('beam');
        for (const m of metrics) { await wait(300); m.classList.remove('shimmer'); m.classList.add('filled'); countUp($('b', m), 900); }
        await wait(900);
        cam.classList.remove('beam');
        stage(2, 'Cross-verifying bank, GST & financials…');
        for (const v of vrows) { await wait(520); v.classList.add('on'); }
        stage(3, 'Applying your credit policy…');
        await wait(300);
        marker.style.left = '30%';
        await wait(900);
        riskPill.className = 'pill good'; riskPill.textContent = 'Low–Moderate';
        for (const c of chips) { await wait(380); c.classList.add('on'); }
        stage(4, 'Drafting credit memo…');
        memoTitle.textContent = 'Drafting credit memo…'; memoSub.textContent = 'Summary · Financials · Banking · Risk';
        for (let p = 0; p <= 100; p += 4) { memoBar.style.width = p + '%'; await wait(55); }
        memo.classList.add('ready');
        memoTitle.textContent = 'Credit memo ready'; memoSub.textContent = 'Draft CAM · ready for review';
        stage(5, 'Credit memo ready — awaiting your review'); live.textContent = 'Ready';
        await wait(4200);
      }
    })();
  }

  /* ---------- tabs ---------- */
  $$('[data-tabs]').forEach((shell) => {
    const tabs = $$('[role="tab"]', shell);
    const ind = $('.tab-ind', shell);
    const moveInd = (t) => { if (ind) { ind.style.left = t.offsetLeft + 'px'; ind.style.width = t.offsetWidth + 'px'; } };
    const select = (t, focus) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        const p = document.getElementById(x.getAttribute('aria-controls'));
        p.hidden = !on;
        if (on) {
          p.classList.remove('enter', 'anim-bars', 'anim-line');
          void p.offsetWidth;
          p.classList.add('enter', 'anim-bars', 'anim-line', 'in');
        }
      });
      moveInd(t);
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        let n = null;
        if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (k === 'Home') n = tabs[0];
        if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    const first = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    requestAnimationFrame(() => moveInd(first));
    window.addEventListener('resize', () => moveInd(tabs.find((t) => t.getAttribute('aria-selected') === 'true')));
    shell.addEventListener('inview', () => select(tabs.find((t) => t.getAttribute('aria-selected') === 'true')), { once: true });
  });

  /* ---------- FAQ accordion ---------- */
  $$('.faq-item').forEach((item) => {
    const q = $('.faq-q', item);
    q.addEventListener('click', () => {
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- pipeline auto-cycle ---------- */
  $$('.pipeline').forEach((pl) => {
    const steps = $$('.pipe', pl);
    let i = 0, timer = null;
    const show = (n) => steps.forEach((s, k) => { s.classList.toggle('active', k === n); s.classList.toggle('passed', k < n); });
    const start = () => { if (reduceMotion || timer) return; timer = setInterval(() => { i = (i + 1) % steps.length; show(i); }, 1700); };
    const stop = () => { clearInterval(timer); timer = null; };
    steps.forEach((s, k) => s.addEventListener('pointerenter', () => { stop(); i = k; show(k); }));
    pl.addEventListener('pointerleave', start);
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(pl);
    show(0);
  });

  /* ---------- use-case scrollspy ---------- */
  const ucLinks = $$('.uc-index a');
  if (ucLinks.length) {
    const map = new Map(ucLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        ucLinks.forEach((a) => a.classList.remove('active'));
        const a = map.get(en.target.id);
        if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- demo request form → email (FormSubmit) ---------- */
  const form = $('#demo-form');
  if (form) {
    const ENDPOINT = 'https://formsubmit.co/ajax/sakshamservices2025@gmail.com';
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    if (new URLSearchParams(location.search).get('type') === 'technical') {
      $('#f-msg').value = 'Technical deep-dive: architecture, security and integrations.';
    }
    const emailRe =/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const rules = {
      name: (v) => v.trim().length >= 2 || 'Please enter your full name.',
      email: (v) => emailRe.test(v.trim()) || 'Please enter a valid work email.',
      phone: (v) => !v.trim() || /^[+()\-\s\d]{7,20}$/.test(v.trim()) || 'Please enter a valid phone number.',
      institution: (v) => v.trim().length >= 2 || 'Please enter your institution name.',
      institution_type: (v) => !!v || 'Please select your institution type.',
      role: (v) => !!v || 'Please select your role.',
      consent: (_, el) => el.checked || 'Please agree to be contacted so we can respond.',
    };
    const check = (el) => {
      const rule = rules[el.name];
      if (!rule) return true;
      const res = rule(el.value, el);
      const field = el.closest('.field, .consent-wrap');
      const err = field && $('.err', field);
      const ok = res === true;
      field && field.classList.toggle('invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (err) err.textContent = ok ? '' : res;
      return ok;
    };
    $$('input, select, textarea', form).forEach((el) => {
      el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') check(el); });
      el.addEventListener('input', () => { if (el.closest('.invalid')) check(el); });
      el.addEventListener('change', () => { if (el.closest('.invalid')) check(el); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      const fields = $$('[name]', form).filter((el) => rules[el.name]);
      const results = fields.map(check);
      if (results.includes(false)) { const bad = $('[aria-invalid="true"]', form); bad && bad.focus(); return; }

      const fd = new FormData(form);
      const showSuccess = () => {
        $('.form-grid', form).style.display = 'none';
        $('.success', form.parentElement).classList.add('show');
        $('.success', form.parentElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      if (fd.get('_honey')) { showSuccess(); return; } // bot trap

      try {
        const last = +localStorage.getItem('cz-demo-sent') || 0;
        if (Date.now() - last < 30000) { status.className = 'form-status error'; status.textContent = 'Your request was just sent. Please wait a few seconds before sending another.'; return; }
      } catch (err) { /* storage unavailable */ }

      const payload = {
        'Full name': fd.get('name').trim(),
        'Work email': fd.get('email').trim(),
        'Phone number': fd.get('phone').trim() || '—',
        'Institution name': fd.get('institution').trim(),
        'Institution type': fd.get('institution_type'),
        'Role': fd.get('role'),
        'Monthly loan applications': fd.get('volume') || '—',
        'Primary lending focus': fd.get('focus') || '—',
        'What they would like to see': fd.get('message').trim() || '—',
        'Consent to contact': 'Yes',
        'Submitted from': location.href,
        _subject: `New CredZenta demo request — ${fd.get('institution').trim()}`,
        _replyto: fd.get('email').trim(),
        _template: 'table',
        _captcha: 'false',
      };

      btn.disabled = true; btn.classList.add('loading');
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !(json.success === true || json.success === 'true')) throw new Error(json.message || 'Request failed');
        try { localStorage.setItem('cz-demo-sent', String(Date.now())); } catch (err) { /* ignore */ }
        showSuccess();
      } catch (err) {
        status.className = 'form-status error';
        status.innerHTML = 'Something went wrong. Please try again, or email us directly at <a href="mailto:sakshamservices2025@gmail.com?subject=CredZenta%20demo%20request">sakshamservices2025@gmail.com</a>.';
      } finally {
        btn.disabled = false; btn.classList.remove('loading');
      }
    });
  }
})();
