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

// ===== GSAP reveals =====
if(window.gsap){
  gsap.registerPlugin(ScrollTrigger);

  // Hero words
  gsap.to('.reveal-word', {
    y:'0%', duration:0.9, ease:'power4.out', stagger:0.06, delay:0.2
  });

  // Generic reveal-up elements
  document.querySelectorAll('.reveal-up').forEach((el) => {
    gsap.to(el, {
      opacity:1, y:0, duration:0.8, ease:'power3.out',
      scrollTrigger:{
        trigger: el,
        start:'top 88%',
        toggleActions:'play none none none'
      }
    });
  });
} else {
  // Fallback: just show everything if GSAP fails to load
  document.querySelectorAll('.reveal-up, .reveal-word').forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
}

// ===== Safety net: guarantee content is visible even if an animation stalls =====
// Covers: hidden/background tabs throttling requestAnimationFrame, GSAP/CDN
// hiccups, or any other case where the reveal animation never completes.
// Kills any in-progress GSAP tween first — just setting inline styles isn't
// enough, since an active tween overwrites them again on its next tick.
setTimeout(() => {
  const stuck = Array.from(document.querySelectorAll('.reveal-up, .reveal-word')).filter(el => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.opacity) < 1 || cs.transform !== 'none';
  });
  if(!stuck.length) return;
  // Kill every ScrollTrigger/tween outright — past the intended reveal
  // window, nothing should still be animating these elements.
  if(window.ScrollTrigger) ScrollTrigger.getAll().forEach(st => st.kill());
  if(window.gsap) gsap.killTweensOf('.reveal-up, .reveal-word');
  stuck.forEach(el => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
}, 2500);
