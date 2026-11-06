// ตัวเชื่อม PWA: จำลอง google.script.run ให้เรียก Apps Script ผ่าน fetch
// ทำให้ index.html ใช้โค้ดเดียวกับ Index.html ใน Apps Script ได้เลย (ไม่ต้องแก้โค้ดในหน้า)
(function () {
  if (window.google && window.google.script && window.google.script.run) return;   // เปิดใน Apps Script เดิม → ไม่ทำอะไร
  const C = window.APP_CONFIG || {};
  function call(fn, args, ok, fail) {
    ok = ok || function () {};
    fail = fail || function () {};
    if (!C.API_URL || /PASTE_YOUR/.test(C.API_URL)) return fail(new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js'));
    if (!navigator.onLine) return fail(new Error('ออฟไลน์อยู่ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
    const ac = new AbortController(), to = setTimeout(function () { ac.abort(); }, C.TIMEOUT_MS || 60000);
    fetch(C.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // simple request: ไม่ติด CORS preflight
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: 'follow', signal: ac.signal
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(to);
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง');
      ok(j.data);
    }).catch(function (e) {
      clearTimeout(to);
      fail(new Error(e.name === 'AbortError' ? 'หมดเวลา ลองใหม่อีกครั้ง' : (e.message || 'เชื่อมต่อไม่ได้')));
    });
  }
  function make(ok, fail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return make(f, fail); };
        if (name === 'withFailureHandler') return function (f) { return make(ok, f); };
        return function () { call(name, Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }
  window.google = { script: { run: make() } };

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
