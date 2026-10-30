'use strict';
(() => {
  const config = window.DAMYANG_COMMENTS;
  const form = document.getElementById('comment-form');
  const nickname = document.getElementById('comment-nickname');
  const body = document.getElementById('comment-body');
  const submit = document.getElementById('comment-submit');
  const status = document.getElementById('comment-status');
  const list = document.getElementById('comment-list');
  const refresh = document.getElementById('comments-refresh');
  const more = document.getElementById('comments-more');
  if (!config?.url || !config?.key) {
    status.textContent = '댓글 연결을 준비 중이에요.';
    return;
  }
  const endpoint = config.url + '/rest/v1/damyang_comments';
  const headers = {apikey:config.key, 'Content-Type':'application/json'};
  let clientId;
  try {
    clientId = localStorage.getItem('damyang-comment-client');
    if (!/^[0-9a-f-]{36}$/i.test(clientId || '')) {
      clientId = crypto.randomUUID();
      localStorage.setItem('damyang-comment-client', clientId);
    }
  } catch { clientId = crypto.randomUUID(); }
  let loading = false;
  let sending = false;
  let offset = 0;
  let pending = null;
  const dateFormat = new Intl.DateTimeFormat('ko-KR', {month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'});
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {...options, headers:{...headers,...options.headers},signal:controller.signal,cache:'no-store'});
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw Object.assign(new Error(error.message || 'request failed'), {code:error.code});
      }
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } finally { clearTimeout(timer); }
  }
  function renderComment(comment) {
    const item = document.createElement('li');
    const head = document.createElement('div');
    const author = document.createElement('b');
    author.textContent = comment.nickname;
    const time = document.createElement('time');
    time.dateTime = comment.created_at;
    time.textContent = dateFormat.format(new Date(comment.created_at));
    const text = document.createElement('p');
    text.textContent = comment.body;
    head.append(author,time);
    item.append(head,text);
    return item;
  }
  async function loadComments(append = false, quiet = false) {
    if (loading || sending) return;
    loading = true;
    refresh.disabled = more.disabled = true;
    try {
      const start = append ? offset : 0;
      const comments = await request(endpoint + '?select=id,nickname,body,created_at&order=created_at.desc,id.desc&limit=20&offset=' + start);
      if (!append) list.replaceChildren();
      list.append(...comments.map(renderComment));
      offset = start + comments.length;
      more.hidden = comments.length < 20;
      if (!quiet) status.textContent = offset ? '함께 남긴 이야기를 읽어 보세요.' : '아직 댓글이 없어요. 첫 이야기를 남겨 주세요.';
    } catch {
      status.textContent = '댓글을 불러오지 못했어요. 새로고침 버튼으로 다시 시도해 주세요.';
    } finally {
      loading = false;
      refresh.disabled = more.disabled = false;
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const name = nickname.value.trim();
    const text = body.value.trim();
    if (!name || !text) { status.textContent = '닉네임과 댓글을 입력해 주세요.'; return; }
    if (!pending || pending.nickname !== name || pending.body !== text) {
      pending = {id:crypto.randomUUID(),client_id:clientId,nickname:name,body:text};
    }
    sending = true;
    submit.disabled = true;
    status.textContent = '댓글을 올리고 있어요…';
    let saved = false;
    try {
      await request(endpoint, {method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(pending)});
      saved = true;
    } catch (error) {
      // A retried request may already have been saved before its response was lost.
      if (error.code === '23505') saved = true;
      else status.textContent = error.message.includes('comment_rate_limit')
        ? '잠시 쉬었다 남겨 주세요. 댓글은 30초에 한 번, 하루 20개까지 작성할 수 있어요.'
        : '댓글을 올리지 못했어요. 입력 내용은 남아 있으니 다시 시도해 주세요.';
    } finally {
      sending = false;
      submit.disabled = false;
    }
    if (saved) {
      body.value = '';
      pending = null;
      status.textContent = '댓글을 남겼어요. 다른 방문자도 볼 수 있어요.';
      await loadComments(false,true);
    }
  });
  refresh.addEventListener('click', () => loadComments());
  more.addEventListener('click', () => loadComments(true));
  submit.disabled = false;
  loadComments();
  setInterval(() => {
    if (!document.hidden && form.getClientRects().length && offset <= 20) loadComments(false,true);
  }, 30000);
})();
