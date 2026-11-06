// Service Worker: แคชเฉพาะไฟล์หน้าเว็บ (app shell) ให้เปิดแอปได้เร็ว/ออฟไลน์ได้
// ข้อมูลจริงมาจาก Apps Script (POST) ซึ่งไม่ถูกแคชเลย จึงได้ข้อมูลล่าสุดเสมอ
// เมื่อแก้ไฟล์ ให้เปลี่ยนเลขเวอร์ชันด้านล่าง เพื่อให้เครื่องผู้ใช้อัปเดต
const VER = 'lunch-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // ฟอนต์ Google: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VER).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // ไฟล์ของแอป: ลองเน็ตก่อน (ได้เวอร์ชันใหม่) ถ้าไม่ได้ค่อยใช้แคช
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
});
