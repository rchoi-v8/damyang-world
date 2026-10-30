'use strict';
(() => {
  const mobile = window.matchMedia('(max-width:760px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  const guide = document.querySelector('.guide');
  const speech = document.querySelector('.speech');
  const mapTitle = document.getElementById('directory-title');
  const mapHint = document.querySelector('#places .section-title > span');
  const originalMapHint = mapHint.textContent;
  const closingTitle = document.querySelector('footer > h2');
  const originalSpeech = [...speech.childNodes].map(node => node.cloneNode(true));
  const character = guide.querySelector('svg');
  const guideButton = document.createElement('button');
  guideButton.type = 'button';
  guideButton.className = 'egg-guide-button';
  guideButton.setAttribute('aria-label', '대롱이');
  const titleButton = document.createElement('button');
  titleButton.type = 'button';
  titleButton.className = 'egg-title-button';
  const starButton = document.createElement('button');
  starButton.type = 'button';
  starButton.className = 'egg-star-button';
  starButton.textContent = '✦';
  starButton.setAttribute('aria-label', '작은 별');
  const modal = document.createElement('dialog');
  modal.className = 'egg-dialog';
  modal.setAttribute('aria-labelledby', 'egg-dialog-title');
  modal.setAttribute('aria-describedby', 'egg-dialog-message');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'egg-close';
  close.textContent = '닫기 ×';
  close.autofocus = true;
  const modalTitle = document.createElement('h2');
  modalTitle.id = 'egg-dialog-title';
  const modalCharacter = character.cloneNode(true);
  modalCharacter.classList.add('egg-character');
  modalCharacter.setAttribute('aria-hidden', 'true');
  modalCharacter.removeAttribute('role');
  modalCharacter.removeAttribute('aria-label');
  const message = document.createElement('p');
  message.id = 'egg-dialog-message';
  modal.append(close, modalTitle, modalCharacter, message);
  let opener;
  let guideTaps = 0;
  let mapTaps = 0;
  let lastGuideTap = 0;
  let lastMapTap = 0;
  function showSecret(title, text, showCharacter, trigger) {
    if (!mobile.matches || modal.open) return;
    opener = trigger;
    modalTitle.textContent = title;
    message.textContent = text;
    modalCharacter.hidden = !showCharacter;
    modal.showModal();
  }
  close.addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    if (event.target === modal) {
      const box = modal.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) modal.close();
    }
  });
  modal.addEventListener('close', () => {
    if (mobile.matches && opener?.isConnected) opener.focus({preventScroll:true});
  });
  guideButton.addEventListener('click', () => {
    if (!mobile.matches) return;
    const now = Date.now();
    guideTaps = now - lastGuideTap > 8000 ? 1 : guideTaps + 1;
    lastGuideTap = now;
    if (guideTaps < 5) return;
    guideTaps = 0;
    speech.textContent = '혜정아, 반가워!';
    speech.classList.add('egg-greeting');
    if (reducedMotion.matches) return;
    speech.animate([
      {transform:'scale(.9) rotate(-3deg)', filter:'brightness(1.2)'},
      {transform:'scale(1.06) rotate(1deg)', offset:.55},
      {transform:'scale(1) rotate(0)', filter:'brightness(1)'}
    ], {duration:650,easing:'ease-out'});
    guide.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)'},{transform:'translateY(0)'}], {duration:450});
    const sparkle = document.createElement('span');
    sparkle.className = 'egg-sparkles';
    sparkle.setAttribute('aria-hidden','true');
    sparkle.textContent = '✦  ·  ✧  ·  ✦';
    speech.append(sparkle);
    sparkle.addEventListener('animationend', () => sparkle.remove(), {once:true});
  });
  titleButton.addEventListener('click', () => {
    if (!mobile.matches) return;
    const now = Date.now();
    mapTaps = now - lastMapTap > 8000 ? 1 : mapTaps + 1;
    lastMapTap = now;
    if (mapTaps < 3) return;
    mapTaps = 0;
    const label = document.createElement('span');
    label.className = 'egg-ticket-label';
    label.textContent = '⌖ 오늘의 진짜 목적지:';
    const destination = document.createElement('strong');
    destination.textContent = '함께 좋은 추억 만들기.';
    mapHint.replaceChildren(label, destination);
    mapHint.classList.add('egg-map-reveal');
    if (!reducedMotion.matches) {
      mapHint.animate([
        {opacity:0,transform:'perspective(500px) rotateX(-65deg) translateY(-6px)'},
        {opacity:1,transform:'perspective(500px) rotateX(0) translateY(0)'}
      ], {duration:550,easing:'ease-out'});
    }
  });
  starButton.addEventListener('click', () => {
    showSecret('대롱이의 비밀 초대', '히든 장소 발견!\n여기는 우리만 아는 담양.', true, starButton);
  });
  function syncMobileEggs() {
    guideTaps = mapTaps = 0;
    if (mobile.matches) {
      guideButton.append(character);
      guide.append(guideButton);
      titleButton.append(...mapTitle.childNodes);
      mapTitle.append(titleButton);
      closingTitle.append(starButton);
      speech.setAttribute('aria-live','polite');
      mapHint.setAttribute('aria-live','polite');
      document.body.append(modal);
    } else {
      if (modal.open) modal.close();
      if (guideButton.parentNode) guideButton.replaceWith(character);
      if (titleButton.parentNode) titleButton.replaceWith(...titleButton.childNodes);
      starButton.remove();
      modal.remove();
      speech.classList.remove('egg-greeting');
      speech.removeAttribute('aria-live');
      speech.replaceChildren(...originalSpeech.map(node => node.cloneNode(true)));
      mapHint.classList.remove('egg-map-reveal');
      mapHint.removeAttribute('aria-live');
      mapHint.textContent = originalMapHint;
    }
  }
  mobile.addEventListener('change', syncMobileEggs);
  syncMobileEggs();
})();
