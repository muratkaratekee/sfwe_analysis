// Türkçe: Yorumlar (comments) modülü
// Amaç: Tezlere ait yorumları listelemek, eklemek ve silmek
// Kayıtlı endpointler:
//   - GET    /theses/:id/comments
//   - POST   /theses/:id/comments
//   - DELETE /comments/:id
module.exports = function registerComments(app, pool) {
  // Tez yorumlarını listele
  app.get('/theses/:id/comments', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      const sql = `
        SELECT c.id, c.user_id, c.comment, c.created_at, c.thesis_id,
               u.full_name AS user_full_name, u.role_id AS user_role_id
        FROM public.comments c
        LEFT JOIN public.users u ON u.id = c.user_id
        WHERE c.thesis_id = $1
        ORDER BY c.created_at ASC, c.id ASC
      `;
      const { rows } = await pool.query(sql, [thesisId]);
      return res.json(rows);
    } catch (err) {
      console.error('comments list error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Yorum ekle (sadece danışman; rol kontrolü istemci tarafında tutulur)
  app.post('/theses/:id/comments', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      const { user_id, comment } = req.body || {};
      const userId = Number(user_id);
      const text = String(comment || '').trim();
      if (!Number.isInteger(userId) || !text) return res.status(400).json({ error: 'Geçersiz parametreler' });
      const t = await pool.query('SELECT 1 FROM public.theses WHERE id = $1 LIMIT 1', [thesisId]);
      if (t.rowCount === 0) return res.status(404).json({ error: 'Tez bulunamadı' });
      const u = await pool.query('SELECT id, full_name, role_id FROM public.users WHERE id = $1 LIMIT 1', [userId]);
      if (u.rowCount === 0) return res.status(400).json({ error: 'Kullanıcı bulunamadı' });
      const user = u.rows[0];
      if (Number(user.role_id) !== 2) return res.status(403).json({ error: 'Sadece danışmanlar yorum yapabilir' });
      const ins = await pool.query(
        'INSERT INTO public.comments (user_id, comment, thesis_id, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id, user_id, comment, created_at, thesis_id',
        [userId, text, thesisId]
      );
      const row = ins.rows[0];
      row.user_full_name = user.full_name;
      row.user_role_id = user.role_id;
      return res.status(201).json({ comment: row });
    } catch (err) {
      console.error('comment create error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Yorumu sil (admin)
  app.delete('/comments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const del = await pool.query('DELETE FROM public.comments WHERE id = $1', [id]);
      if (del.rowCount === 0) return res.status(404).json({ error: 'Yorum bulunamadı' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('comment delete error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
