// Türkçe: Tez dosyaları için yükleme (upload) yapılandırması
// Amaç: Yükleme klasörünü (UPLOAD_DIR) oluşturmak ve Multer depolama ayarlarını tanımlamak
// Dışa aktarılanlar:
//   - UPLOAD_DIR: Yüklenen dosyaların bulunduğu klasör
//   - upload: Multer middleware (storage ayarı ile)
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Upload directory (../thesis from this file)
const UPLOAD_DIR = path.join(__dirname, '..', 'thesis');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + Math.round(Math.random() * 1e9) + '-' + String(file.originalname || '')
      .replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, safe);
  },
});

// Multer instance
const upload = multer({ storage });

module.exports = { UPLOAD_DIR, upload };
