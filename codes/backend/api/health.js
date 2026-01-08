// Türkçe: Sağlık (health) kontrol modülü
// Amaç: API'nin ayakta olup olmadığını basit bir sorgu ile kontrol etmek
// Kayıtlı endpointler:
//   - GET /api/health  -> { ok: true } veya hata
module.exports = function registerHealth(app, pool) {
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });
};
