'use strict';
const content = window.BAR_CONTENT;
let menuPage = 0;
let suppressMenuClickUntil = 0;
const menuTrack = document.getElementById('menu-track');
const menuThumbs = document.getElementById('menu-thumbs');
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
if (content && Array.isArray(content.menu) && content.menu.length && menuTrack) {
  document.getElementById('hero-title').textContent = content.heroTitle;
  document.querySelector('address').textContent = content.address;
  const hours = document.querySelector('.opening-hours');
  hours.replaceChildren(...content.hours.map(row => {
    const div = element('div'); div.append(element('dt', '', row.days), element('dd', '', row.time)); return div;
  }));
  document.querySelectorAll('a[href*="myfunnow.com"]').forEach(a => a.href = content.booking);
  document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = content.instagram);
  document.querySelectorAll('a[href*="facebook.com"]').forEach(a => a.href = content.facebook);
  menuTrack.replaceChildren(); menuThumbs.replaceChildren();
  content.menu.forEach((page, i) => {
    const slide = element('div', 'menu-slide');
    const link = element('a'); link.href = './' + page.src;
    Object.assign(link.dataset, { viewer: '', group: 'menu', caption: String(i + 1).padStart(2, '0') + ' / ' + page.title, credit: 'Bar Easy 店家提供', source: './' + page.src });
    link.setAttribute('aria-label', '放大第 ' + (i + 1) + ' 頁：' + page.title);
    const img = element('img'); img.src = './' + page.src; img.alt = '第 ' + (i + 1) + ' 頁：' + page.title; img.loading = 'lazy'; img.width = 941; img.height = 1672;
    link.append(img, element('span', 'menu-zoom-label', '＋ 點擊放大菜單')); slide.append(link); menuTrack.append(slide);
    const thumb = element('button', 'menu-thumb'); thumb.type = 'button'; thumb.dataset.menuPage = String(i); thumb.setAttribute('aria-label', img.alt);
    const mini = element('img'); mini.src = img.src; mini.alt = ''; mini.loading = 'lazy';
    thumb.append(mini, element('span', '', String(i + 1).padStart(2, '0'))); menuThumbs.append(thumb);
  });
}
function selectMenuPage(index) {
  const slides = Array.from(menuTrack.children);
  menuPage = (index + slides.length) % slides.length;
  menuTrack.style.transform = 'translateX(-' + (menuPage * 100) + '%)';
  slides.forEach((slide, i) => { slide.setAttribute('aria-hidden', String(i !== menuPage)); slide.inert = i !== menuPage; });
  const current = slides[menuPage].querySelector('a');
  document.getElementById('menu-page-title').textContent = current.dataset.caption.split(' / ').slice(1).join(' / ');
  document.getElementById('menu-page-count').textContent = String(menuPage + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  menuThumbs.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === menuPage)));
  const thumb = menuThumbs.children[menuPage];
  if (thumb) {
    const left = thumb.offsetLeft;
    if (left < menuThumbs.scrollLeft || left + thumb.offsetWidth > menuThumbs.scrollLeft + menuThumbs.clientWidth) menuThumbs.scrollTo({left: Math.max(0, left - menuThumbs.clientWidth / 2 + thumb.offsetWidth / 2), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
}
if (menuTrack) {
  document.getElementById('menu-prev').addEventListener('click', () => selectMenuPage(menuPage - 1));
  document.getElementById('menu-next').addEventListener('click', () => selectMenuPage(menuPage + 1));
  menuThumbs.addEventListener('click', event => { const button = event.target.closest('[data-menu-page]'); if (button) selectMenuPage(Number(button.dataset.menuPage)); });
  const viewport = document.getElementById('menu-viewport'); let start = null;
  viewport.addEventListener('pointerdown', event => { if (event.isPrimary && event.button === 0) start = {x:event.clientX,y:event.clientY}; });
  viewport.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y; start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { suppressMenuClickUntil = Date.now() + 400; selectMenuPage(menuPage + (dx < 0 ? 1 : -1)); }
  });
  viewport.addEventListener('pointercancel', () => { start = null; });
  viewport.addEventListener('dragstart', event => event.preventDefault());
  document.querySelector('.menu-book').addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); selectMenuPage(menuPage + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  selectMenuPage(0);
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const dialog = document.getElementById('photo-dialog');
const viewerImage = document.getElementById('viewer-image');
const viewerStage = document.getElementById('viewer-stage');
const viewerTitle = document.getElementById('photo-title');
const viewerSource = document.getElementById('photo-source');
const viewerCount = document.getElementById('photo-count');
const prev = document.getElementById('photo-prev');
const next = document.getElementById('photo-next');
const zoom = document.getElementById('photo-zoom');
let activePhotos = [];
let activeIndex = 0;
let returnFocus = null;
function resetZoom() {
  viewerStage.classList.remove('is-zoomed');
  zoom.setAttribute('aria-pressed', 'false');
  zoom.textContent = '放大';
  viewerStage.scrollTop = 0;
  viewerStage.scrollLeft = 0;
}
function showPhoto(index) {
  activeIndex = (index + activePhotos.length) % activePhotos.length;
  const item = activePhotos[activeIndex];
  viewerImage.src = item.getAttribute('href');
  viewerImage.alt = item.dataset.caption;
  viewerTitle.textContent = item.dataset.caption;
  viewerSource.textContent = item.dataset.credit + ' ↗';
  viewerSource.href = item.dataset.source;
  viewerCount.textContent = (activeIndex + 1) + ' / ' + activePhotos.length;
  prev.hidden = next.hidden = activePhotos.length < 2;
  resetZoom();
}
if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-viewer]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (link.dataset.group === 'menu' && Date.now() < suppressMenuClickUntil) { event.preventDefault(); return; }
      event.preventDefault();
      activePhotos = Array.from(document.querySelectorAll('[data-viewer]')).filter(item => item.dataset.group === link.dataset.group);
      returnFocus = link;
      showPhoto(activePhotos.indexOf(link));
      dialog.showModal();
      document.body.classList.add('viewer-open');
      document.getElementById('photo-close').focus();
    });
  });
  prev.addEventListener('click', () => showPhoto(activeIndex - 1));
  next.addEventListener('click', () => showPhoto(activeIndex + 1));
  document.getElementById('photo-close').addEventListener('click', () => dialog.close());
  zoom.addEventListener('click', () => {
    const enlarged = viewerStage.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.textContent = enlarged ? '適合畫面' : '放大';
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    resetZoom();
    if (returnFocus) returnFocus.focus();
  });
}

// Motion enhances the page without hiding content or changing its reading order.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let sectionObserver = null;
let heroObserver = null;
let heroFrame = 0;
let heroInView = true;
const hero = document.getElementById('home');
function updateHeroMotion() {
  heroFrame = 0;
  if (motionPreference.matches || !heroInView || !hero) return;
  const distance = Math.max(0, -hero.getBoundingClientRect().top);
  hero.style.setProperty('--hero-drift', Math.min(38, distance * 0.065).toFixed(1) + 'px');
}
function scheduleHeroMotion() {
  if (!motionPreference.matches && heroInView && !heroFrame) heroFrame = requestAnimationFrame(updateHeroMotion);
}
function setupMotion() {
  if (sectionObserver) sectionObserver.disconnect();
  if (heroObserver) heroObserver.disconnect();
  if (heroFrame) cancelAnimationFrame(heroFrame);
  heroFrame = 0;
  window.removeEventListener('scroll', scheduleHeroMotion);
  document.querySelectorAll('.reveal-enter').forEach(el => el.classList.remove('reveal-enter'));
  if (hero) hero.style.setProperty('--hero-drift', '0px');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal-enter');
      sectionObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 35px 0px' });
  document.querySelectorAll('.gallery-heading, .gallery-card, .about-copy, .about-photo, .drinks-heading, .drink-photo, .drink-item, .menu-heading, .menu-aside, .whisky-menu, .visit-title, .visit-info').forEach((el, index) => {
    el.style.setProperty('--reveal-delay', ((index % 3) * 70) + 'ms');
    sectionObserver.observe(el);
  });
  if (hero) {
    heroObserver = new IntersectionObserver(entries => {
      heroInView = entries[0].isIntersecting;
      if (heroInView) scheduleHeroMotion();
    });
    heroObserver.observe(hero);
    window.addEventListener('scroll', scheduleHeroMotion, { passive: true });
    scheduleHeroMotion();
  }
}
setupMotion();
motionPreference.addEventListener('change', setupMotion);
