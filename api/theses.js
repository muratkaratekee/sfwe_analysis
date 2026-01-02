// Türkçe: Tezler (theses) modülü
// Amaç: Tez CRUD işlemleri ve dosya indirme işlemlerini sağlamak
// Kayıtlı endpointler:
//   - GET    /theses
//   - GET    /theses/:id
//   - POST   /theses           (dosya yükleme destekli)
//   - PUT    /theses/:id
//   - DELETE /theses/:id
//   - GET    /theses/:id/files/:filePath/download
const path = require('path');
const fs = require('fs');

module.exports = function registerTheses(app, pool, { upload, UPLOAD_DIR }) {
  // Tezleri filtrelerle listele
  app.get('/theses', async (req, res) => {
    try {
      const advisorId = req.query.advisor_id ? Number(req.query.advisor_id) : null;
      const departmentId = req.query.department_id ? Number(req.query.department_id) : null;
      const facultyId = req.query.faculty_id ? Number(req.query.faculty_id) : null;
      const year = req.query.year ? Number(req.query.year) : null;
      const yearFrom = req.query.year_from ? Number(req.query.year_from) : null;
      const yearTo = req.query.year_to ? Number(req.query.year_to) : null;
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const authorName = typeof req.query.author_name === 'string' ? req.query.author_name.trim() : '';
      const sort = typeof req.query.sort === 'string' ? req.query.sort.trim().toLowerCase() : '';

      const baseSql = `
        SELECT t.id, t.title, t.abstract, t.author_name,
               t.view_count, t.download_count, t.bibliography_count,
               t.advisor_id,
               u.full_name AS advisor_name,
               t.created_at,
               f.id AS faculty_id,
               f.name AS faculty_name
        FROM public.theses t
        LEFT JOIN public.users u ON u.id = t.advisor_id
        LEFT JOIN public.departments d ON d.id = t.department_id
        LEFT JOIN public.faculties f ON f.id = d.faculty_id
      `;
      let sql = baseSql;
      const where = [];
      const vals = [];
      const push = (cond, val) => { where.push(cond); vals.push(val); };

      if (Number.isInteger(advisorId)) push('t.advisor_id = $' + (vals.length + 1), advisorId);
      if (Number.isInteger(departmentId)) push('t.department_id = $' + (vals.length + 1), departmentId);
      if (Number.isInteger(facultyId)) push('d.faculty_id = $' + (vals.length + 1), facultyId);
      if (Number.isInteger(year)) push('t.publication_year = $' + (vals.length + 1), year);
      if (Number.isInteger(yearFrom)) push('t.publication_year >= $' + (vals.length + 1), yearFrom);
      if (Number.isInteger(yearTo)) push('t.publication_year <= $' + (vals.length + 1), yearTo);
      if (authorName) {
        const like = `%${authorName}%`;
        push('t.author_name ILIKE $' + (vals.length + 1), like);
      }
      if (q) {
        const like = `%${q}%`;
        const p1 = '$' + (vals.length + 1);
        const p2 = '$' + (vals.length + 2);
        const p3 = '$' + (vals.length + 3);
        where.push(`(t.title ILIKE ${p1} OR t.abstract ILIKE ${p2} OR t.keywords ILIKE ${p3})`);
        vals.push(like, like, like);
      }

      if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
      if (sort === 'views') sql += ' ORDER BY t.view_count DESC NULLS LAST, t.id DESC';
      else if (sort === 'citations') sql += ' ORDER BY t.bibliography_count DESC NULLS LAST, t.id DESC';
      else sql += ' ORDER BY t.created_at DESC NULLS LAST, t.id DESC';
      const { rows } = await pool.query(sql, vals);
      return res.json(rows);
    } catch (err) {
      console.error('theses list error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Tez detayı
  app.get('/theses/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const tSql = `
        SELECT t.id, t.title, t.abstract, t.keywords, t.author_name, t.publication_year,
               t.view_count, t.download_count, t.bibliography_count, t.created_at,
               t.advisor_id,
               t.department_id,
               d.name AS department_name,
               f.id AS faculty_id,
               f.name AS faculty_name,
               u.full_name AS advisor_name
        FROM public.theses t
        LEFT JOIN public.users u ON u.id = t.advisor_id
        LEFT JOIN public.departments d ON d.id = t.department_id
        LEFT JOIN public.faculties f ON f.id = d.faculty_id
        WHERE t.id = $1
        LIMIT 1
      `;
      const { rows: tRows } = await pool.query(tSql, [id]);
      if (tRows.length === 0) return res.status(404).json({ error: 'Tez bulunamadı' });
      const fSql = `SELECT file_name, file_path, file_type, uploaded_at FROM public.thesis_files WHERE thesis_id = $1 ORDER BY uploaded_at ASC`;
      const { rows: files } = await pool.query(fSql, [id]);
      return res.json({ thesis: tRows[0], files });
    } catch (err) {
      console.error('thesis detail error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Tez oluştur (multipart)
  app.post('/theses', upload.array('files'), async (req, res) => {
    try {
      const { title, abstract, publication_year, keywords, author_name, department_id, advisor_id } = req.body || {};
      if (!title || !abstract || !publication_year || !author_name || !department_id || !advisor_id) {
        return res.status(400).json({ error: 'Eksik alanlar var.' });
      }
      const pubYear = Number(publication_year);
      const depId = Number(department_id);
      const advId = Number(advisor_id);
      if (!Number.isInteger(pubYear)) return res.status(400).json({ error: 'Geçerli bir publication_year giriniz.' });
      const dep = await pool.query('SELECT id FROM public.departments WHERE id = $1 LIMIT 1', [depId]);
      if (dep.rowCount === 0) return res.status(400).json({ error: 'Bölüm bulunamadı.' });
      const adv = await pool.query('SELECT id FROM public.users WHERE id = $1 AND role_id = 2 LIMIT 1', [advId]);
      if (adv.rowCount === 0) return res.status(400).json({ error: 'Danışman geçersiz.' });

      const insertSql = `
        INSERT INTO public.theses (
          title, abstract, publication_year, keywords, author_name,
          department_id, advisor_id, view_count, download_count, bibliography_count, search_vector
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,0,NULL)
        RETURNING id
      `;
      const { rows } = await pool.query(insertSql, [
        String(title), String(abstract), pubYear, String(keywords || ''), String(author_name), depId, advId,
      ]);
      const thesisId = rows[0].id;

      const files = Array.isArray(req.files) ? req.files : [];
      for (const f of files) {
        const fileSql = `INSERT INTO public.thesis_files (thesis_id, file_name, file_path, file_type, uploaded_at)
                         VALUES ($1, $2, $3, $4, NOW())`;
        await pool.query(fileSql, [thesisId, f.originalname, f.filename, f.mimetype]);
      }
      return res.status(201).json({ thesis: { id: thesisId }, files_uploaded: files.length });
    } catch (err) {
      console.error('theses create error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Tez güncelle
  app.put('/theses/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const { title, abstract, keywords, publication_year } = req.body || {};
      const fields = {};
      if (typeof title === 'string' && title.trim()) fields.title = String(title).trim();
      if (typeof abstract === 'string' && abstract.trim()) fields.abstract = String(abstract).trim();
      if (typeof keywords === 'string') fields.keywords = String(keywords);
      if (publication_year !== undefined) {
        const y = Number(publication_year);
        if (!Number.isInteger(y)) return res.status(400).json({ error: 'Geçerli bir publication_year giriniz.' });
        fields.publication_year = y;
      }
      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });
      const cols = Object.keys(fields);
      const setSql = cols.map((c, i) => `${c} = $${i+1}`).join(', ');
      const vals = cols.map((c) => fields[c]);
      vals.push(id);
      const q = `UPDATE public.theses SET ${setSql} WHERE id = $${vals.length} RETURNING id, title, abstract, keywords, author_name, publication_year, view_count, download_count, created_at, advisor_id`;
      const { rows } = await pool.query(q, vals);
      if (rows.length === 0) return res.status(404).json({ error: 'Tez bulunamadı' });
      return res.json({ thesis: rows[0] });
    } catch (err) {
      console.error('thesis update error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Tez sil
  app.delete('/theses/:id', async (req, res) => {
    const client = await pool.connect();
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      await client.query('BEGIN');
      const { rows: fileRows } = await client.query('SELECT file_path FROM public.thesis_files WHERE thesis_id = $1', [id]);
      await client.query('DELETE FROM public.comments WHERE thesis_id = $1', [id]);
      await client.query('DELETE FROM public.thesis_files WHERE thesis_id = $1', [id]);
      const del = await client.query('DELETE FROM public.theses WHERE id = $1', [id]);
      if (del.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Tez bulunamadı' }); }
      await client.query('COMMIT');
      try {
        for (const r of fileRows) {
          const p = path.join(UPLOAD_DIR, r.file_path);
          if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch (_) {} }
        }
      } catch (_) {}
      return res.json({ ok: true });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error('thesis delete error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    } finally {
      client.release();
    }
  });

  // Dosya indir
  app.get('/theses/:id/files/:filePath/download', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const filePathParam = String(req.params.filePath || '');
      if (!Number.isInteger(id) || !filePathParam) return res.status(400).json({ error: 'Geçersiz parametre' });
      const fSql = `SELECT thesis_id, file_name, file_path FROM public.thesis_files WHERE thesis_id = $1 AND file_path = $2 LIMIT 1`;
      const { rows } = await pool.query(fSql, [id, filePathParam]);
      if (rows.length === 0) return res.status(404).json({ error: 'Dosya bulunamadı' });
      const file = rows[0];
      await pool.query('UPDATE public.theses SET download_count = COALESCE(download_count,0) + 1 WHERE id = $1', [id]);
      const absPath = path.join(UPLOAD_DIR, file.file_path);
      if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'Dosya sistemde bulunamadı' });
      return res.download(absPath, file.file_name);
    } catch (err) {
      console.error('thesis download error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Advisor istatistikleri - toplam tez sayısı ve toplam alıntı sayısı
  app.get('/advisor/:advisorId/stats', async (req, res) => {
    try {
      const advisorId = Number(req.params.advisorId);
      if (!Number.isInteger(advisorId)) {
        return res.status(400).json({ error: 'Geçersiz advisor ID' });
      }

      // Advisor'ın toplam tez sayısı
      const thesesResult = await pool.query(
        'SELECT COUNT(*) as thesis_count FROM public.theses WHERE advisor_id = $1',
        [advisorId]
      );
      const thesisCount = parseInt(thesesResult.rows[0]?.thesis_count || 0, 10);

      // Advisor'ın tezlerine yapılan toplam alıntı sayısı
      const citationsResult = await pool.query(
        `SELECT COALESCE(SUM(t.bibliography_count), 0) as total_citations
         FROM public.theses t
         WHERE t.advisor_id = $1`,
        [advisorId]
      );
      const totalCitations = parseInt(citationsResult.rows[0]?.total_citations || 0, 10);

      return res.json({
        thesis_count: thesisCount,
        total_citations: totalCitations
      });
    } catch (err) {
      console.error('advisor stats error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
