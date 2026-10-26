(function () {
  'use strict';
  const decode = value =&gt; Uint8Array.from(atob(value), c =&gt; c.charCodeAt(0));
  document.querySelectorAll('.private-unlock').forEach(form =&gt; {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async event =&gt; {
      event.preventDefault();
      const status = form.querySelector('[role="status"]');
      const button = form.querySelector('button');
      const input = form.querySelector('input');
      if (!window.crypto || !window.crypto.subtle) {
        status.textContent = '请通过 HTTPS 或 localhost 打开文章后解锁。';
        return;
      }
      button.disabled = true;
      status.textContent = '正在解密正文和图片…';
      try {
        const section = form.closest('.private-content');
        const payload = JSON.parse(section.querySelector('.private-payload').textContent);
        if (payload.v !== 1) throw new Error('Unsupported version');
        const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt:decode(payload.salt), iterations:payload.iterations}, material, {name:'AES-GCM', length:256}, false, ['decrypt']);
        const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(payload.iv)}, key, decode(payload.data));
        input.value = '';
        section.innerHTML = new TextDecoder().decode(plaintext);
        if (window.Prism) window.Prism.highlightAllUnder(section);
      } catch (error) {
        status.textContent = '解锁失败：密码错误或文章数据已损坏。';
      } finally {
        button.disabled = false;
      }
    });
  });
})();
