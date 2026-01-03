module.exports = function registerComments(app, pool) {
  async function ensureUsersTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role_id INTEGER NOT NULL DEFAULT 1,
        faculties_id INTEGER,
        department_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async function ensureCommentsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.comments (
        id SERIAL PRIMARY KEY,
        thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
        parent_comment_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
        content TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  // Migration: Add parent_comment_id column if it doesn't exist
  async function ensureParentCommentIdColumn() {
    try {
      await pool.query(`
        ALTER TABLE public.comments 
        ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE
      `);
    } catch (err) {
      // Column might already exist, ignore error
    }
  }

  async function getCommentsTextColumnName() {
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'comments' AND column_name IN ('content','comment')
    `);
    const names = rows.map(r => String(r.column_name));
    if (names.includes('content')) return 'content';
    if (names.includes('comment')) return 'comment';
    try {
      await pool.query(`ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content TEXT`);
      return 'content';
    } catch (_) {
      return 'content';
    }
  }

  // GET: Fetch comments with parent_comment_id for nested structure
  app.get('/theses/:id/comments', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      await ensureUsersTable();
      await ensureCommentsTable();
      await ensureParentCommentIdColumn();
      const textCol = await getCommentsTextColumnName();
      const sql = `
        SELECT c.id, c.thesis_id, c.user_id, c.parent_comment_id, u.full_name AS user_full_name, u.role_id AS user_role_id, c.${textCol} AS content, c.created_at
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

  // POST: Add comment with optional parent_comment_id for replies
  app.post('/theses/:id/comments', async (req, res) => {
    try {
      const thesisId = Number(req.params.id);
      if (!Number.isInteger(thesisId)) return res.status(400).json({ error: 'Geçersiz id' });
      const { user_id, content, parent_comment_id } = req.body || {};
      if (!content || String(content).trim() === '') return res.status(400).json({ error: 'Yorum boş olamaz' });
      await ensureUsersTable();
      await ensureCommentsTable();
      await ensureParentCommentIdColumn();
      const textCol = await getCommentsTextColumnName();

      const parentId = Number.isInteger(Number(parent_comment_id)) ? Number(parent_comment_id) : null;

      const sql = `
        INSERT INTO public.comments (thesis_id, user_id, parent_comment_id, ${textCol})
        VALUES ($1, $2, $3, $4)
        RETURNING id, thesis_id, user_id, parent_comment_id, ${textCol} AS content, created_at
      `;
      const { rows } = await pool.query(sql, [
        thesisId,
        Number.isInteger(Number(user_id)) ? Number(user_id) : null,
        parentId,
        String(content).trim()
      ]);
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('comment add error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

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
