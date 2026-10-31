// ===== Scroll progress bar =====
const progressBar = document.getElementById('progressBar');
function updateProgress(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  if(progressBar) progressBar.style.width = scrolled + '%';
}
window.addEventListener('scroll', updateProgress, {passive:true});

// ===== Header hide/reveal on scroll =====
const header = document.getElementById('siteHeader');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const current = window.scrollY;
  if(current > lastScroll && current > 120){
    header.classList.add('hide');
  } else {
    header.classList.remove('hide');
  }
  lastScroll = current;
}, {passive:true});

// ===== Mobile menu =====
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if(navToggle){
  const setMenu = (open) => {
    mobileMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };
  navToggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenu(false));
  });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && mobileMenu.classList.contains('open')){ setMenu(false); navToggle.focus(); } });
}

// ===== Count-up stats =====
function animateCount(el){
  const target = parseFloat(el.dataset.count);
  const duration = 1400;
  const start = performance.now();
  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased);
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, {threshold:0.4});

document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

// ===== Scroll reveals =====
// Hero content animates with pure CSS (see style.css). Everything else with
// .reveal-up fades up the first time it scrolls into view. CSS transitions
// (not rAF-driven tweens) mean a throttled background tab can't leave content
// stuck half-hidden — the transition just completes when the tab is shown.
const revealEls = document.querySelectorAll('.reveal-up');
if('IntersectionObserver' in window){
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {rootMargin:'0px 0px -8% 0px'});
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// ===== Hero brand reel: brands cut in and out, the analytics card follows the brand on screen =====
(function(){
  const reel = document.getElementById('heroReel');
  if(!reel) return;
  const shots = [...reel.querySelectorAll('.reel-shot')];
  if(shots.length < 2) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MS = reduce ? 4200 : 2400;
  const CUTS = ['cut-punch','cut-wipe','cut-slide','cut-split'];
  const $ = (id) => document.getElementById(id);
  const ticks = $('reelTicks');
  ticks.innerHTML = shots.map(() => '<span></span>').join('');
  ticks.style.setProperty('--reel-ms', MS + 'ms');
  const caption = reel.querySelector('.reel-caption');
  const spark = reel.querySelector('.ri-spark');
  let i = 0, timer = null, started = performance.now(), running = false;

  // A rising, slightly bumpy line per brand (seeded by name so each brand keeps its shape).
  function series(seed, n){
    let h = 0; for(const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pts = []; let v = 0.15;
    for(let k = 0; k < n; k++){ h = (h * 1103515245 + 12345) >>> 0; v += 0.05 + ((h % 1000) / 1000 - 0.35) * 0.09; pts.push(Math.min(0.95, Math.max(0.05, v))); }
    return pts;
  }
  function drawSpark(seed){
    const W = 240, H = 70, pts = series(seed, 12);
    const xy = pts.map((p, k) => [k * (W / (pts.length - 1)), H - p * H]);
    const d = xy.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    $('riLine').setAttribute('d', d);
    $('riArea').setAttribute('d', d + ` L${W} ${H} L0 ${H} Z`);
    const last = xy[xy.length - 1]; $('riDot').setAttribute('cx', last[0]); $('riDot').setAttribute('cy', last[1]);
    spark.classList.remove('draw'); void spark.getBoundingClientRect(); spark.classList.add('draw');
    const s = series(seed + 'x', 3);
    $('riBar1').style.width = (55 + s[0] * 45) + '%'; $('riBar2').style.width = (45 + s[1] * 50) + '%'; $('riBar3').style.width = (60 + s[2] * 40) + '%';
  }
  function retrigger(el, cls){ el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function show(n, cut){
    const prev = shots[i], next = shots[n];
    if(prev !== next){
      shots.forEach(s => s.classList.remove('is-leaving'));
      prev.classList.remove('is-active', ...CUTS); prev.classList.add('is-leaving');
      next.classList.remove(...CUTS);
      if(cut && !reduce) next.classList.add(CUTS[Math.floor(Math.random() * CUTS.length)]);
      void next.offsetWidth; next.classList.add('is-active');
      if(cut && !reduce && Math.random() < 0.45) retrigger(reel.querySelector('.reel-flash'), 'go');
    }
    i = n;
    const d = next.dataset;
    $('reelBrand').textContent = d.brand; $('reelChannel').textContent = d.channel; retrigger(caption, 'swap');
    $('riBrand').textContent = d.brand; $('riLabel').textContent = d.label; $('riValue').textContent = d.value; retrigger($('riValue'), 'swap');
    drawSpark(d.brand);
    [...ticks.children].forEach((t, k) => { t.className = k < n ? 'done' : ''; });
    void ticks.offsetWidth; ticks.children[n].className = 'now';
  }
  function step(){ show((i + 1) % shots.length, true); }
  function play(){ if(running) return; running = true; timer = setInterval(step, MS); }
  function pause(){ running = false; clearInterval(timer); }

  // Timecode, like a camera monitor.
  (function tc(){
    const t = (performance.now() - started) / 1000, f = Math.floor((t % 1) * 24);
    const p = (x) => String(Math.floor(x)).padStart(2, '0');
    $('reelTc').textContent = `${p(t / 3600)}:${p((t / 60) % 60)}:${p(t % 60)}:${p(f)}`;
    requestAnimationFrame(tc);
  })();

  show(0, false);
  if('IntersectionObserver' in window){
    new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? play() : pause()), {threshold: 0.25}).observe(reel);
  } else play();
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
})();


// ===== Cookie consent =====
// Google Analytics (Consent Mode v2) and the Meta Pixel start denied (see the inline script in each page's <head>).
// The banner asks once; the choice is kept in localStorage and can be changed from "Your privacy choices" in the footer.
// A browser Global Privacy Control signal counts as "reject" and can't be overridden by the banner.
(function(){
  const KEY = 'fg_consent';
  const gpc = navigator.globalPrivacyControl === true;
  const read = () => { try { return localStorage.getItem(KEY); } catch(e){ return null; } };
  const apply = (granted) => {
    const v = granted ? 'granted' : 'denied';
    if(typeof window.gtag === 'function') window.gtag('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    if(typeof window.fbq === 'function') window.fbq('consent', granted ? 'grant' : 'revoke');
  };
  let lastFocus = null;
  const banner = document.createElement('div');
  banner.className = 'consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'consentTitle');
  banner.setAttribute('aria-describedby', 'consentText');
  banner.hidden = true;
  const policy = (location.pathname.indexOf('/blog/') === 0 ? '../' : '') + 'privacy.html#cookies';
  banner.innerHTML =
    '<div class="consent-inner">' +
      '<div>' +
        '<h2 id="consentTitle" class="consent-title">Your privacy</h2>' +
        '<p id="consentText">We use cookies for analytics (Google Analytics) and to measure our ads (Meta). They only turn on if you accept. ' +
        (gpc ? 'Your browser is sending a Global Privacy Control signal, so we keep them off. ' : '') +
        '<a href="' + policy + '">Cookie details</a></p>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn btn-pill btn-outline-light" data-consent="denied">Reject non-essential</button>' +
        (gpc ? '' : '<button type="button" class="btn btn-pill btn-accent" data-consent="granted">Accept all</button>') +
      '</div>' +
    '</div>';
  const open = () => { lastFocus = document.activeElement; banner.hidden = false; const b = banner.querySelector('button'); if(b) b.focus(); };
  const close = () => { banner.hidden = true; if(lastFocus && lastFocus.focus) lastFocus.focus(); };
  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent]');
    if(!btn) return;
    const granted = btn.getAttribute('data-consent') === 'granted' && !gpc;
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch(e){}
    apply(granted);
    close();
  });
  banner.addEventListener('keydown', (e) => { if(e.key === 'Escape' && read()) close(); });
  const start = () => {
    document.body.appendChild(banner);
    if(!read()) open();
    document.querySelectorAll('[data-open-consent]').forEach(b => b.addEventListener('click', open));
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

// ===== Article "On this page" list =====
// Builds a numbered list from the article's h2s and highlights the section
// being read. Shown beside the text on wide screens only (CSS).
(() => {
  const article = document.querySelector('main > article');
  const body = article && article.querySelector('.article-body');
  if(!body) return;
  const heads = [...body.querySelectorAll('h2')];
  if(heads.length < 2) return;
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nav = document.createElement('nav');
  nav.className = 'article-toc';
  nav.setAttribute('aria-label', 'On this page');
  const title = document.createElement('h4');
  title.textContent = 'On this page';
  const list = document.createElement('ol');
  const links = heads.map((h, i) => {
    if(!h.id) h.id = slug(h.textContent) || 'section-' + (i + 1);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });
  nav.append(title, list);
  body.after(nav);
  const setActive = (id) => links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
  if('IntersectionObserver' in window){
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id));
      const first = heads.find(h => seen.has(h.id));
      if(first) setActive(first.id);
    }, {rootMargin: '-80px 0px -60% 0px'});
    heads.forEach(h => io.observe(h));
  }
  setActive(heads[0].id);
})();

// ===== Hero case-study carousel =====
(() => {
  const root = document.getElementById('caseReel');
  if(!root) return;
  const slides = [...root.querySelectorAll('.cs-slide')];
  const dots = [...root.querySelectorAll('.cs-dot')];
  if(slides.length < 2) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MS = 7000;
  root.style.setProperty('--cs-ms', MS + 'ms');
  let i = 0, timer = null, paused = false;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { const on = k === i; s.hidden = !on; s.classList.toggle('is-active', on); });
    dots.forEach((d, k) => {
      const on = k === i; d.setAttribute('aria-selected', String(on));
      d.classList.remove('is-active'); if(on){ void d.offsetWidth; d.classList.add('is-active'); }
    });
  };
  const schedule = () => { clearTimeout(timer); if(!reduce && !paused) timer = setTimeout(() => { show(i + 1); schedule(); }, MS); };
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); schedule(); }));
  root.querySelectorAll('.cs-arrow').forEach(b => b.addEventListener('click', () => { show(i + Number(b.dataset.dir)); schedule(); }));
  const pause = (on) => { paused = on; root.classList.toggle('is-paused', on); if(on) clearTimeout(timer); else schedule(); };
  root.addEventListener('mouseenter', () => pause(true));
  root.addEventListener('mouseleave', () => pause(false));
  root.addEventListener('focusin', () => pause(true));
  root.addEventListener('focusout', (e) => { if(!root.contains(e.relatedTarget)) pause(false); });
  document.addEventListener('visibilitychange', () => { if(document.hidden) clearTimeout(timer); else schedule(); });
  schedule();
})();

// ===== Open a <details> when a link points at it =====
(() => {
  const openTarget = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    if(el && el.tagName === 'DETAILS') el.open = true;
  };
  window.addEventListener('hashchange', openTarget);
  openTarget();
})();
