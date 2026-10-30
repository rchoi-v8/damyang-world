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
