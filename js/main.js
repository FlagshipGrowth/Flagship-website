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
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
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

// ===== Case study intro: full-screen reel of client brands; the Insights card below follows the brand on screen =====
(function(){
  const intro = document.getElementById('introReel');
  if(!intro) return;
  document.body.classList.add('has-intro');
  const shots = [...intro.querySelectorAll('.ir-shot')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MS = reduce ? 5000 : 3200;
  const OPEN_MS = reduce ? 1000 : 2900; // the logo + "We grow brands" opening
  const CUTS = ['cut-wipe','cut-rise','cut-iris','cut-punch'];
  const $ = (id) => document.getElementById(id);
  const ticks = $('irTicks');
  ticks.innerHTML = shots.map(() => '<span></span>').join('');
  ticks.style.setProperty('--ir-ms', MS + 'ms');
  const caption = $('irCaption');
  let i = 0, timer = null, playing = false, userPaused = false, visible = true, ready = false;

  // Insights card (if present): brand, result, a sparkline seeded by the brand so each keeps its shape.
  const card = {brand: $('riBrand'), label: $('riLabel'), value: $('riValue'), line: $('riLine'), area: $('riArea'), dot: $('riDot'), spark: document.querySelector('.ri-spark')};
  function series(seed, n){
    let h = 0; for(const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pts = []; let v = 0.15;
    for(let k = 0; k < n; k++){ h = (h * 1103515245 + 12345) >>> 0; v += 0.05 + ((h % 1000) / 1000 - 0.35) * 0.09; pts.push(Math.min(0.95, Math.max(0.05, v))); }
    return pts;
  }
  function retrigger(el, cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function updateCard(d){
    if(!card.brand) return;
    card.brand.textContent = d.brand; card.label.textContent = d.label; card.value.textContent = d.value; retrigger(card.value, 'swap');
    const W = 240, H = 70, pts = series(d.brand, 12);
    const xy = pts.map((p, k) => [k * (W / (pts.length - 1)), H - p * H]);
    const path = xy.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    card.line.setAttribute('d', path); card.area.setAttribute('d', path + ` L${W} ${H} L0 ${H} Z`);
    const last = xy[xy.length - 1]; card.dot.setAttribute('cx', last[0]); card.dot.setAttribute('cy', last[1]);
    retrigger(card.spark, 'draw');
    const b = series(d.brand + 'x', 3);
    $('riBar1').style.width = (55 + b[0] * 45) + '%'; $('riBar2').style.width = (45 + b[1] * 50) + '%'; $('riBar3').style.width = (60 + b[2] * 40) + '%';
  }

  function show(n, cut){
    const prev = shots[i], next = shots[n];
    if(prev !== next){
      shots.forEach(s => s.classList.remove('is-leaving'));
      prev.classList.remove('is-active', ...CUTS); prev.classList.add('is-leaving');
      next.classList.remove(...CUTS);
      if(cut && !reduce) next.classList.add(CUTS[Math.floor(Math.random() * CUTS.length)]);
      void next.offsetWidth; next.classList.add('is-active');
      if(cut && !reduce && Math.random() < 0.4) retrigger(intro.querySelector('.ir-flash'), 'go');
    }
    i = n;
    const d = next.dataset;
    $('irBrand').textContent = d.brand; $('irChannel').textContent = d.channel; $('irResult').textContent = d.result;
    caption.href = d.href; retrigger(caption, 'swap');
    [...ticks.children].forEach((t, k) => { t.className = k < n ? 'done' : ''; });
    void ticks.offsetWidth; ticks.children[n].className = 'now';
    updateCard(d);
  }
  function play(){ if(!ready || playing || userPaused || !visible || document.hidden) return; playing = true; intro.classList.remove('paused'); timer = setInterval(() => show((i + 1) % shots.length, true), MS); }
  function stop(){ playing = false; clearInterval(timer); }

  $('irPause').addEventListener('click', () => {
    userPaused = !userPaused;
    intro.classList.toggle('paused', userPaused);
    $('irPause').setAttribute('aria-label', userPaused ? 'Play the case study reel' : 'Pause the case study reel');
    userPaused ? stop() : play();
  });

  show(0, false);
  setTimeout(() => { ready = true; ticks.children[0].className = ''; void ticks.offsetWidth; ticks.children[0].className = 'now'; play(); }, OPEN_MS);

  // Pause off screen; the header reads light while it sits over the intro.
  const header = document.getElementById('siteHeader');
  if('IntersectionObserver' in window){
    new IntersectionObserver((es) => es.forEach(e => {
      visible = e.isIntersecting;
      header && header.classList.toggle('on-dark', e.intersectionRatio > 0.12);
      visible ? play() : stop();
    }), {threshold: [0, 0.12, 0.3]}).observe(intro);
  }
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
})();
