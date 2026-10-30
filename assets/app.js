'use strict';
// Reading content and navigation work without JavaScript.
const dialog = document.getElementById('photo-dialog');
const largePhoto = document.getElementById('large-photo');
let opener;
document.querySelectorAll('.photo-open').forEach(button => {
  button.addEventListener('click', () => {
    if (typeof dialog.showModal !== 'function') {
      window.open(button.dataset.image, '_blank', 'noopener');
      return;
    }
    opener = button;
    largePhoto.src = button.dataset.image;
    largePhoto.alt = button.dataset.caption;
    document.getElementById('photo-caption').textContent = button.dataset.caption;
    dialog.showModal();
  });
});
document.getElementById('close-photo').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { if (opener) opener.focus({preventScroll:true}); });
const navLinks = [...document.querySelectorAll('.sidebar nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    if (!visible.length) return;
    const id = visible.sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target.id;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin:'-90px 0px -65% 0px', threshold:0});
  document.querySelectorAll('.place').forEach(section => observer.observe(section));
}

// On phones, read one page at a time. Hash links remain usable on every screen.
const phoneLayout = window.matchMedia('(max-width:760px)');
const homePage = document.querySelector('.hero-wrap');
const readingPages = [homePage, ...document.querySelector('.content').children];
const pageNames = ['처음 화면', ...readingPages.slice(1).map(page =>
  page.querySelector('h2')?.textContent.trim() || '답사 마무리')];
const pageIds = ['home', ...readingPages.slice(1).map(page => page.id || 'journey-end')];
readingPages.forEach((page, index) => {
  page.classList.add('reading-page');
  if (!page.id && index > 0) page.id = pageIds[index];
});
const pager = document.createElement('nav');
pager.className = 'mobile-pager';
pager.setAttribute('aria-label', '답사 페이지 이동');
const previousPage = document.createElement('button');
previousPage.type = 'button';
previousPage.textContent = '← 이전';
const pagePicker = document.createElement('select');
pagePicker.setAttribute('aria-label', '읽을 페이지 선택');
pageNames.forEach((name, index) => {
  const option = document.createElement('option');
  option.value = String(index);
  option.textContent = `${index + 1} / ${readingPages.length} · ${name}`;
  pagePicker.append(option);
});
const nextPage = document.createElement('button');
nextPage.type = 'button';
nextPage.textContent = '다음 →';
const pageAnnouncement = document.createElement('span');
pageAnnouncement.className = 'page-announcement';
pageAnnouncement.setAttribute('role', 'status');
pager.append(previousPage, pagePicker, nextPage, pageAnnouncement);
document.body.append(pager);
let currentPage = 0;

function showReadingPage(index, updateHash = false) {
  currentPage = Math.max(0, Math.min(readingPages.length - 1, index));
  const mobile = phoneLayout.matches;
  // Move focus out of a page before hiding it from keyboard and screen readers.
  if (mobile && readingPages.some((page, i) => i !== currentPage && page.contains(document.activeElement))) {
    pagePicker.focus({preventScroll:true});
  }
  readingPages.forEach((page, i) => page.classList.toggle('current-page', i === currentPage));
  document.body.classList.toggle('mobile-reading', mobile);
  previousPage.disabled = currentPage === 0;
  nextPage.disabled = currentPage === readingPages.length - 1;
  pagePicker.value = String(currentPage);
  pageAnnouncement.textContent = mobile ? `${pageNames[currentPage]}, ${currentPage + 1} / ${readingPages.length} 페이지` : '';
  if (updateHash) {
    const hash = '#' + pageIds[currentPage];
    if (location.hash !== hash) history.pushState(null, '', hash);
  }
}
function pageFromHash() {
  const index = pageIds.indexOf(location.hash.slice(1));
  showReadingPage(index >= 0 ? index : currentPage);
}
previousPage.addEventListener('click', () => showReadingPage(currentPage - 1, true));
nextPage.addEventListener('click', () => showReadingPage(currentPage + 1, true));
pagePicker.addEventListener('change', () => showReadingPage(Number(pagePicker.value), true));
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!phoneLayout.matches || !link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const index = pageIds.indexOf(link.getAttribute('href').slice(1));
  if (index < 0) return;
  event.preventDefault();
  showReadingPage(index, true);
});
window.addEventListener('hashchange', pageFromHash);
window.addEventListener('popstate', pageFromHash);
phoneLayout.addEventListener('change', () => {
  pageFromHash();
  if (!phoneLayout.matches && location.hash) {
    document.getElementById(pageIds[currentPage])?.scrollIntoView({behavior:'instant'});
  }
});

// Vertical gestures scroll the text; deliberate horizontal gestures change pages.
let swipeStart = null;
readingPages.forEach(page => {
  page.addEventListener('touchstart', event => {
    swipeStart = null;
    if (!phoneLayout.matches || dialog.open || event.touches.length !== 1 ||
        event.target.closest('a, button, select, input, textarea, summary, .history-details')) return;
    const touch = event.touches[0];
    swipeStart = {x:touch.clientX, y:touch.clientY, time:Date.now()};
  }, {passive:true});
  page.addEventListener('touchmove', event => {
    if (!swipeStart) return;
    if (event.touches.length !== 1 || Math.abs(event.touches[0].clientY - swipeStart.y) > 35) swipeStart = null;
  }, {passive:true});
  page.addEventListener('touchcancel', () => { swipeStart = null; }, {passive:true});
  page.addEventListener('touchend', event => {
    const start = swipeStart;
    swipeStart = null;
    if (!start || !phoneLayout.matches || dialog.open || !event.changedTouches.length || window.getSelection()?.toString()) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Date.now() - start.time < 1000 && Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      showReadingPage(currentPage + (dx < 0 ? 1 : -1), true);
    }
  }, {passive:true});
});
pageFromHash();
