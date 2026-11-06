// Service Worker: แคชเฉพาะไฟล์หน้าเว็บ (app shell) — ข้อมูลจาก Apps Script (POST) ไม่ถูกแคช
// เมื่อแก้ไฟล์ ให้เปลี่ยนเลข VER เพื่อให้เครื่องผู้ใช้อัปเดต
const VER = 'lunch-v7';
const SHELL = ['./index.html', './config.js', './pwa.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

// Chrome ไม่ยอมให้ตอบหน้าเว็บด้วย response ที่ผ่าน redirect → คัดลอกเป็น response ใหม่ (เคยทำให้เปิดแอปไม่ได้)
function clean(r) {
  if (!r || !r.redirected) return Promise.resolve(r);
  return r.clone().blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers }));
}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => fetch(u, { cache: 'reload' }).then(clean).then(r => r && r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VER).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(
    fetch(req).then(clean).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(nav ? './index.html' : req, cp)); }
      return r;
    }).catch(() => caches.match(nav ? './index.html' : req).then(h => h || caches.match('./index.html')))
  );
});
