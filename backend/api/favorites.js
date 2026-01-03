// Türkçe: Favoriler (favorites) modülü
// Amaç: Kullanıcıların favori tezlerini yönetmek
// Kayıtlı endpointler:
//   - GET    /favorites/:userId       (kullanıcının favorilerini listele)
//   - POST   /favorites               (favori ekle)
//   - DELETE /favorites/:userId/:thesisId (favori kaldır)
//   - GET    /favorites/:userId/:thesisId/check (favori durumunu kontrol et)

module.exports = function registerFavorites(app, pool) {
  // Tablo oluştur (eğer yoksa)
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, thesis_id)
    )
  `;
  
  pool.query(createTableSQL)
    .then(() => console.log('✅ Favorites tablosu hazır'))
    .catch(err => console.error('❌ Favorites tablo hatası:', err));

  // Kullanıcının favorilerini listele
  app.get('/favorites/:userId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'Geçersiz user_id' });
      }

      const sql = `
        SELECT f.id, f.thesis_id, f.created_at,
               t.title, t.abstract, t.author_name, t.publication_year,
               t.view_count, t.download_count, t.bibliography_count,
               u.full_name AS advisor_name,
               fac.name AS faculty_name
        FROM public.favorites f
        JOIN public.theses t ON t.id = f.thesis_id
        LEFT JOIN public.users u ON u.id = t.advisor_id
        LEFT JOIN public.departments d ON d.id = t.department_id
        LEFT JOIN public.faculties fac ON fac.id = d.faculty_id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
      `;
      
      const { rows } = await pool.query(sql, [userId]);
      return res.json(rows);
    } catch (err) {
      console.error('favorites list error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Favori ekle
  app.post('/favorites', async (req, res) => {
    try {
      const { user_id, thesis_id } = req.body || {};
      const userId = Number(user_id);
      const thesisId = Number(thesis_id);

      if (!Number.isInteger(userId) || !Number.isInteger(thesisId)) {
        return res.status(400).json({ error: 'Geçersiz user_id veya thesis_id' });
      }

      // Kullanıcı var mı kontrol et
      const userCheck = await pool.query('SELECT id FROM public.users WHERE id = $1', [userId]);
      if (userCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      // Tez var mı kontrol et
      const thesisCheck = await pool.query('SELECT id FROM public.theses WHERE id = $1', [thesisId]);
      if (thesisCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Tez bulunamadı' });
      }

      const sql = `
        INSERT INTO public.favorites (user_id, thesis_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, thesis_id) DO NOTHING
        RETURNING id, user_id, thesis_id, created_at
      `;
      
      const { rows } = await pool.query(sql, [userId, thesisId]);
      
      if (rows.length === 0) {
        return res.status(200).json({ message: 'Zaten favorilerde', exists: true });
      }
      
      return res.status(201).json({ favorite: rows[0], message: 'Favorilere eklendi' });
    } catch (err) {
      console.error('favorites add error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Favori kaldır
  app.delete('/favorites/:userId/:thesisId', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const thesisId = Number(req.params.thesisId);

      if (!Number.isInteger(userId) || !Number.isInteger(thesisId)) {
        return res.status(400).json({ error: 'Geçersiz user_id veya thesis_id' });
      }

      const sql = `DELETE FROM public.favorites WHERE user_id = $1 AND thesis_id = $2`;
      const { rowCount } = await pool.query(sql, [userId, thesisId]);

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Favori bulunamadı' });
      }

      return res.json({ ok: true, message: 'Favorilerden kaldırıldı' });
    } catch (err) {
      console.error('favorites delete error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Favori durumunu kontrol et
  app.get('/favorites/:userId/:thesisId/check', async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const thesisId = Number(req.params.thesisId);

      if (!Number.isInteger(userId) || !Number.isInteger(thesisId)) {
        return res.status(400).json({ error: 'Geçersiz user_id veya thesis_id' });
      }

      const sql = `SELECT id FROM public.favorites WHERE user_id = $1 AND thesis_id = $2 LIMIT 1`;
      const { rows } = await pool.query(sql, [userId, thesisId]);

      return res.json({ isFavorite: rows.length > 0 });
    } catch (err) {
      console.error('favorites check error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
