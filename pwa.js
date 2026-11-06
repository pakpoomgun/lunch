// ตัวเชื่อม PWA: จำลอง google.script.run ให้เรียก Apps Script ผ่าน fetch
// ทำให้ index.html ใช้โค้ดเดียวกับ Index.html ใน Apps Script ได้เลย (ไม่ต้องแก้โค้ดในหน้า)
(function () {
  if (window.google && window.google.script && window.google.script.run) return;   // เปิดใน Apps Script เดิม → ไม่ทำอะไร
  const C = window.APP_CONFIG || {};
  // หน้าโหลด: วงกลมหมุนระหว่างรอข้อมูลครั้งแรก (ปิดได้ที่ config.js → SPLASH: false)
  let hideSplash = function () {};
  if (C.SPLASH !== false) {
    const sp = document.createElement('div'); sp.id = 'pwa-splash';
    const sst = document.createElement('style');
    sst.textContent = '#pwa-splash{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:#eef1fb;transition:opacity .35s}' +
      '@media(prefers-color-scheme:dark){#pwa-splash{background:#05060d}}' +
      '#pwa-splash i{width:44px;height:44px;border-radius:50%;border:4px solid rgba(120,120,160,.25);border-top-color:#0a84ff;border-right-color:#bf5af2;animation:pwaspin .8s linear infinite}' +
      '@keyframes pwaspin{to{transform:rotate(360deg)}}';
    sp.appendChild(document.createElement('i'));
    document.documentElement.appendChild(sst); document.documentElement.appendChild(sp);
    let done = false;
    hideSplash = function () {
      if (done) return; done = true;
      sp.style.opacity = '0'; setTimeout(function () { sp.remove(); }, 400);
    };
    setTimeout(hideSplash, 15000);   // กันค้าง
  }

  function call(fn, args, ok, fail) {
    const ok0 = ok || function () {}, fail0 = fail || function () {};
    ok = function (v) { hideSplash(); ok0(v); };
    fail = function (e) { hideSplash(); fail0(e); };
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

  // ล็อคไม่ให้ถ่างนิ้วซูม (ปิดได้ที่ config.js → LOCK_ZOOM: false)
  if (C.LOCK_ZOOM !== false) {
    const vp = document.querySelector('meta[name=viewport]');
    if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
    const z = document.createElement('style');
    z.textContent = 'html,body{touch-action:pan-x pan-y}';
    document.head.appendChild(z);
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {   // กันซูมบน iOS
      document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
    });
  }

  // โหมดเต็มจอ: เติมแถบสีบางๆ ด้านบนให้กลืนกับรูกล้องหน้า แล้วดันเนื้อหาลงใต้แถบ (ตั้งค่าที่ config.js)
  if (C.TOP_BAR !== false && !/iPhone|iPad|iPod/.test(navigator.userAgent) &&
      window.matchMedia && matchMedia('(display-mode: fullscreen)').matches) {
    const H = 'max(env(safe-area-inset-top,0px),' + (C.TOP_BAR_HEIGHT || 36) + 'px)';
    document.addEventListener('DOMContentLoaded', function () {
      const st = document.createElement('style');
      st.textContent =
        '#pwa-top{position:fixed;top:0;left:0;right:0;height:' + H + ';background:' + (C.TOP_BAR_COLOR || '#000') + ';color:' + (C.TOP_BAR_TEXT_COLOR || '#fff') + ';z-index:2147483647;pointer-events:none;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,env(safe-area-inset-right)) 0 max(18px,env(safe-area-inset-left));font:600 14px/1 -apple-system,BlinkMacSystemFont,"IBM Plex Sans Thai","Noto Sans Thai",Roboto,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:.2px}' +
        '#pwa-top span{opacity:.92}' +
        '.wrap{padding-top:calc(' + H + ' + 10px)!important}#toast{top:calc(' + H + ' + 8px)!important}' +
        '@media(orientation:landscape) and (max-height:500px){#pwa-top{display:none}.wrap{padding-top:8px!important}#toast{top:8px!important}}';
      document.head.appendChild(st);
      const b = document.createElement('div'); b.id = 'pwa-top';
      const tl = document.createElement('span'), tr = document.createElement('span');
      b.appendChild(tl); b.appendChild(tr); document.body.appendChild(b);
      const pad = function (n) { return (n < 10 ? '0' : '') + n; };
      const tick = function () {
        const d = new Date();
        tl.textContent = C.TOP_BAR_CLOCK === false ? '' : pad(d.getHours()) + ':' + pad(d.getMinutes());
        tr.textContent = C.TOP_BAR_DATE === false ? '' : d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      };
      tick(); setInterval(tick, 10000);
      document.addEventListener('visibilitychange', tick);
    });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
