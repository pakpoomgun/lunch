// ★ ไฟล์ตั้งค่า — แก้ที่นี่ที่เดียว (ตอนอัปเดต index.html ไม่ต้องแตะไฟล์นี้)
window.APP_CONFIG = {
  // URL ของ Apps Script Web App (ลงท้ายด้วย /exec)
  API_URL: 'https://script.google.com/macros/s/AKfycbxbIh_qVhus5VkDVLZkVkQ5nuzT1_sUvAKPrYMDTVIVeb20cW4RPJD1EERP-QA56BQg/exec',
  // เวลารอสูงสุดต่อคำขอ (มิลลิวินาที)
  TIMEOUT_MS: 60000,
  // โหมดเต็มจอ (Android): แถบด้านบนกลบรูกล้องหน้า + แสดงนาฬิกา/วันที่
  TOP_BAR: true,            // false = ปิดแถบ
  TOP_BAR_HEIGHT: 36,       // ความสูงแถบ (px) เพิ่ม/ลดได้ให้พอดีรูกล้อง
  TOP_BAR_COLOR: '#000',    // สีแถบ
  TOP_BAR_TEXT_COLOR: '#fff', // สีตัวอักษรนาฬิกา
  TOP_BAR_CLOCK: true,      // แสดงเวลาด้านซ้าย
  TOP_BAR_DATE: true        // แสดงวันที่ด้านขวา
};
