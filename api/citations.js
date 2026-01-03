// Türkçe: Atıflar (citations) modülü
// Amaç: Tezlere ait atıfları ekleme, listeleme, güncelleme, silme
// Kayıtlı endpointler:
//   - GET    /theses/:id/citations
//   - POST   /theses/:id/citations
//   - PUT    /citations/:id
//   - DELETE /citations/:id
module.exports = function registerCitations(app, pool) {
  async function ensureCitationsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.citations (
        id SERIAL PRIMARY KEY,
        thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        authors TEXT NOT NULL,
        publication_type TEXT NOT NULL,
        year_published INTEGER,
        citation_context TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  app.put('/citations/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const { authors, publication_type, year_published, citation_context } = req.body || {};
      await ensureCitationsTable();
      const { rows } = await pool.query(
        `UPDATE public.citations
         SET authors = COALESCE($1, authors),
             publication_type = COALESCE($2, publication_type),
             year_published = $3,
             citation_context = $4
         WHERE id = $5
         RETURNING id, thesis_id, user_id, authors, publication_type, year_published, citation_context, created_at`,
        [authors ?? null, publication_type ?? null, Number.isInteger(Number(year_published)) ? Number(year_published) : null, citation_context ?? null, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Atıf bulunamadı' });
      const { rows: joined } = await pool.query(
        `SELECT c.id, c.thesis_id, c.user_id, u.full_name AS user_full_name,
                c.authors, c.publication_type, c.year_published, c.citation_context, c.created_at
         FROM public.citations c
         LEFT JOIN public.users u ON u.id = c.user_id
         WHERE c.id = $1`,
        [id]
      );
      return res.json(joined[0] || rows[0]);
    } catch (err) {
      console.error('citation update error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.delete('/citations/:id', async (req, res) => {
    const client = await pool.connect();
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) { client.release(); return res.status(400).json({ error: 'Geçersiz id' }); }
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT thesis_id FROM public.citations WHERE id = $1', [id]);
      if (rows.length === 0) { await client.query('ROLLBACK'); client.release(); return res.status(404).json({ error: 'Atıf bulunamadı' }); }
      const thesisId = rows[0].thesis_id;
      await client.query('DELETE FROM public.citations WHERE id = $1', [id]);
      try {
        await client.query('UPDATE public.theses SET bibliography_count = GREATEST(COALESCE(bibliography_count,0) - 1, 0) WHERE id = $1', [thesisId]);
      } catch (_) {}
      await client.query('COMMIT');
      return res.json({ ok: true });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('citation delete error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    } finally {
      client.release();
    }
  });

  app.get('/theses/:id/citations', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      await ensureCitationsTable();
      const { rows } = await pool.query(
        `SELECT c.id, c.thesis_id, c.user_id, u.full_name AS user_full_name,
                c.authors, c.publication_type, c.year_published, c.citation_context, c.created_at
         FROM public.citations c
         LEFT JOIN public.users u ON u.id = c.user_id
         WHERE c.thesis_id = $1
         ORDER BY c.created_at DESC, c.id DESC`,
        [thesisId]
      );
      return res.json(rows);
    } catch (err) {
      console.error('citations list error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.post('/theses/:id/citations', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      const { user_id, authors, publication_type, year_published, citation_context } = req.body || {};
      if (!authors || !publication_type) return res.status(400).json({ error: 'Eksik alanlar' });
      await ensureCitationsTable();
      const { rows } = await pool.query(
        `INSERT INTO public.citations (thesis_id, user_id, authors, publication_type, year_published, citation_context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, thesis_id, user_id, authors, publication_type, year_published, citation_context, created_at`,
        [thesisId, Number.isInteger(Number(user_id)) ? Number(user_id) : null, authors, publication_type, Number.isInteger(Number(year_published)) ? Number(year_published) : null, citation_context || null]
      );
      try { await pool.query('UPDATE public.theses SET bibliography_count = COALESCE(bibliography_count,0) + 1 WHERE id = $1', [thesisId]); } catch (_) {}
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('citation add error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Cite butonuna basıldığında sayıyı artır
  app.post('/theses/:id/cite', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      await pool.query('UPDATE public.theses SET bibliography_count = COALESCE(bibliography_count,0) + 1 WHERE id = $1', [thesisId]);
      const { rows } = await pool.query('SELECT bibliography_count FROM public.theses WHERE id = $1', [thesisId]);
      return res.json({ bibliography_count: rows[0]?.bibliography_count ?? 0 });
    } catch (err) {
      console.error('cite error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
