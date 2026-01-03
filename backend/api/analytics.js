// Türkçe: Analitik modülü
// Amaç: Tez görüntülenmeleri ve atıf istatistikleri gibi analitik verileri sunmak
// Kayıtlı endpointler:
//   - GET  /theses/:id/analytics/citations/impact
//   - GET  /theses/:id/analytics/citations/by-year
//   - GET  /theses/:id/analytics/citations/by-type
//   - POST /theses/:id/view
//   - GET  /theses/:id/analytics/views/daily
//   - GET  /theses/:id/analytics/views/monthly
module.exports = function registerAnalytics(app, pool) {
  // Genel istatistikler (anasayfa için)
  app.get('/stats', async (req, res) => {
    try {
      const thesesResult = await pool.query('SELECT COUNT(*)::int AS count FROM public.theses');
      const advisorsResult = await pool.query("SELECT COUNT(*)::int AS count FROM public.users WHERE role_id = 2");
      const usersResult = await pool.query('SELECT COUNT(*)::int AS count FROM public.users');
      
      return res.json({
        theses: thesesResult.rows[0]?.count || 0,
        advisors: advisorsResult.rows[0]?.count || 0,
        users: usersResult.rows[0]?.count || 0
      });
    } catch (err) {
      console.error('stats error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.get('/dashboard/analytics', async (req, res) => {
    try {
      const months = req.query.months ? Math.max(1, Math.min(36, Number(req.query.months))) : 12;

      const uploadsTrendSql = `
        SELECT date_trunc('month', t.created_at) AS bucket,
               TO_CHAR(date_trunc('month', t.created_at), 'Mon') AS month,
               COUNT(*)::int AS uploads
        FROM public.theses t
        WHERE t.created_at >= date_trunc('month', NOW()) - (($1::int - 1)::text || ' months')::interval
        GROUP BY 1, 2
        ORDER BY 1 ASC;
      `;
      const uploadsTrendResult = await pool.query(uploadsTrendSql, [months]);

      const thesesByDepartmentSql = `
        SELECT COALESCE(d.name, 'Unknown') AS name,
               COUNT(*)::int AS value
        FROM public.theses t
        LEFT JOIN public.departments d ON d.id = t.department_id
        GROUP BY 1
        ORDER BY value DESC, name ASC
        LIMIT 12;
      `;
      const thesesByDepartmentResult = await pool.query(thesesByDepartmentSql);

      const thesesByFacultySql = `
        SELECT COALESCE(f.name, 'Unknown') AS name,
               COUNT(*)::int AS value
        FROM public.theses t
        LEFT JOIN public.departments d ON d.id = t.department_id
        LEFT JOIN public.faculties f ON f.id = d.faculty_id
        GROUP BY 1
        ORDER BY value DESC, name ASC
        LIMIT 12;
      `;
      const thesesByFacultyResult = await pool.query(thesesByFacultySql);

      const engagementByDepartmentSql = `
        SELECT COALESCE(d.name, 'Unknown') AS name,
               COALESCE(SUM(t.view_count), 0)::int AS views,
               COALESCE(SUM(t.download_count), 0)::int AS downloads
        FROM public.theses t
        LEFT JOIN public.departments d ON d.id = t.department_id
        GROUP BY 1
        ORDER BY views DESC, downloads DESC, name ASC
        LIMIT 8;
      `;
      const engagementByDepartmentResult = await pool.query(engagementByDepartmentSql);

      return res.json({
        uploads_trend: uploadsTrendResult.rows.map((r) => ({
          month: String(r.month || '').trim(),
          uploads: Number(r.uploads || 0),
        })),
        theses_by_faculty: thesesByFacultyResult.rows.map((r) => ({
          name: r.name,
          value: Number(r.value || 0),
        })),
        theses_by_department: thesesByDepartmentResult.rows.map((r) => ({
          name: r.name,
          value: Number(r.value || 0),
        })),
        engagement_by_department: engagementByDepartmentResult.rows.map((r) => ({
          name: r.name,
          views: Number(r.views || 0),
          downloads: Number(r.downloads || 0),
        })),
      });
    } catch (err) {
      console.error('dashboard analytics error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Atıf etki puanı (impact)
  app.get('/theses/:id/analytics/citations/impact', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz tez id' });
      const { rows } = await pool.query(
        `WITH c AS (
           SELECT publication_type, year_published
           FROM public.citations
           WHERE thesis_id = $1
         )
         SELECT COALESCE(SUM(
           CASE
             WHEN LOWER(COALESCE(c.publication_type,'')) LIKE '%journal%' OR LOWER(COALESCE(c.publication_type,'')) LIKE '%dergi%' THEN 3
             WHEN LOWER(COALESCE(c.publication_type,'')) LIKE '%conference%' OR LOWER(COALESCE(c.publication_type,'')) LIKE '%konferans%' THEN 2
             WHEN LOWER(COALESCE(c.publication_type,'')) LIKE '%thesis%' OR LOWER(COALESCE(c.publication_type,'')) LIKE '%tez%' THEN 1
             ELSE 1
           END
           * POWER(0.9, GREATEST(0, EXTRACT(YEAR FROM NOW())::int - COALESCE(c.year_published, EXTRACT(YEAR FROM NOW())::int)))
         ), 0) AS impact
         FROM c`,
        [id]
      );
      const impact = Number(rows?.[0]?.impact ?? 0);
      return res.json({ impact });
    } catch (err) {
      console.error('citation impact error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Analitik: yıllara göre atıf sayısı
  app.get('/theses/:id/analytics/citations/by-year', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz tez id' });
      const { rows } = await pool.query(
        `SELECT year_published AS year, COUNT(*)::int AS count
         FROM public.citations
         WHERE thesis_id = $1 AND year_published IS NOT NULL
         GROUP BY year_published
         ORDER BY year_published ASC`,
        [id]
      );
      return res.json(rows);
    } catch (err) {
      console.error('citations by year analytics error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Analitik: yayın türüne göre atıf sayısı
  app.get('/theses/:id/analytics/citations/by-type', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz tez id' });
      const { rows } = await pool.query(
        `SELECT LOWER(TRIM(publication_type)) AS type, COUNT(*)::int AS count
         FROM public.citations
         WHERE thesis_id = $1 AND COALESCE(TRIM(publication_type), '') <> ''
         GROUP BY 1
         ORDER BY count DESC, type ASC`,
        [id]
      );
      return res.json(rows);
    } catch (err) {
      console.error('citations by type analytics error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Görüntüleme kaydı oluştur ve sayacı artır
  app.post('/theses/:id/view', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      await pool.query('UPDATE public.theses SET view_count = COALESCE(view_count,0) + 1 WHERE id = $1', [id]);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.thesis_view_events (
          id SERIAL PRIMARY KEY,
          thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query('INSERT INTO public.thesis_view_events (thesis_id) VALUES ($1)', [id]);
      return res.json({ ok: true });
    } catch (err) {
      console.error('thesis view register error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Günlük görüntülenmeler
  app.get('/theses/:id/analytics/views/daily', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz tez id' });
      const days = req.query.days ? Math.max(1, Math.min(365, Number(req.query.days))) : 30;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.thesis_view_events (
          id SERIAL PRIMARY KEY,
          thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      const { rows } = await pool.query(
        `SELECT date_trunc('day', viewed_at) AS bucket, COUNT(*)::int AS count
         FROM public.thesis_view_events
         WHERE thesis_id = $1 AND viewed_at >= NOW() - ($2::text || ' days')::interval
         GROUP BY 1
         ORDER BY 1 ASC`,
        [id, String(days)]
      );
      return res.json(rows.map(r => ({ date: r.bucket, count: r.count })));
    } catch (err) {
      console.error('daily views analytics error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Aylık görüntülenmeler
  app.get('/theses/:id/analytics/views/monthly', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz tez id' });
      const months = req.query.months ? Math.max(1, Math.min(60, Number(req.query.months))) : 12;
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.thesis_view_events (
          id SERIAL PRIMARY KEY,
          thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      const { rows } = await pool.query(
        `SELECT date_trunc('month', viewed_at) AS bucket, COUNT(*)::int AS count
         FROM public.thesis_view_events
         WHERE thesis_id = $1 AND viewed_at >= NOW() - ($2::text || ' months')::interval
         GROUP BY 1
         ORDER BY 1 ASC`,
        [id, String(months)]
      );
      return res.json(rows.map(r => ({ date: r.bucket, count: r.count })));
    } catch (err) {
      console.error('monthly views analytics error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
