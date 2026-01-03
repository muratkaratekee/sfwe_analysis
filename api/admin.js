module.exports = function registerAdmin(app, pool) {
  async function ensureUsersTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL DEFAULT 1,
        faculties_id INTEGER,
        department_id INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;`);
  }

  async function ensureFacultiesTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.faculties (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        short_code TEXT,
        dean_name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE public.faculties ADD COLUMN IF NOT EXISTS short_code TEXT;`);
    await pool.query(`ALTER TABLE public.faculties ADD COLUMN IF NOT EXISTS dean_name TEXT;`);
    await pool.query(`ALTER TABLE public.faculties ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  }

  async function ensureDepartmentsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        faculty_id INTEGER REFERENCES public.faculties(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS description TEXT;`);
    await pool.query(`ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  }

  app.get('/admin/users', async (req, res) => {
    try {
      await ensureUsersTable();
      const { rows } = await pool.query(`
        SELECT 
          u.id, u.full_name, u.email, u.role_id, u.faculties_id, u.department_id,
          u.is_active, u.created_at,
          f.name AS faculty_name,
          d.name AS department_name
        FROM public.users u
        LEFT JOIN public.faculties f ON f.id = u.faculties_id
        LEFT JOIN public.departments d ON d.id = u.department_id
        ORDER BY u.created_at DESC, u.id DESC
      `);
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.put('/admin/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const { full_name, role_id, faculties_id, department_id, is_active, admin_user_id } = req.body || {};
      
      // Admin kendisini inactive yapamaz
      if (typeof is_active === 'boolean' && is_active === false && admin_user_id === id) {
        return res.status(403).json({ error: 'You cannot deactivate yourself' });
      }
      
      // Admin kendi rolünü değiştiremez
      if (role_id !== undefined && admin_user_id === id) {
        return res.status(403).json({ error: 'You cannot change your own role' });
      }
      
      await ensureUsersTable();
      const fields = {};
      if (typeof full_name === 'string' && full_name.trim() !== '') fields.full_name = full_name.trim();
      if (Number.isInteger(Number(role_id))) fields.role_id = Number(role_id);
      if (Number.isInteger(Number(faculties_id))) fields.faculties_id = Number(faculties_id);
      if (Number.isInteger(Number(department_id))) fields.department_id = Number(department_id);
      if (typeof is_active === 'boolean') fields.is_active = is_active;
      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });
      const cols = Object.keys(fields);
      const setSql = cols.map((c, i) => `${c} = $${i+1}`).join(', ');
      const vals = cols.map((c) => fields[c]);
      vals.push(id);
      const { rows } = await pool.query(`UPDATE public.users SET ${setSql} WHERE id = $${vals.length} RETURNING id, full_name, email, role_id, faculties_id, department_id`, vals);
      if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return res.json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.delete('/admin/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      
      // Admin kendisini silemez
      const adminUserId = Number(req.query.admin_user_id || req.body?.admin_user_id);
      if (adminUserId === id) {
        return res.status(403).json({ error: 'Kendinizi silemezsiniz' });
      }
      
      await ensureUsersTable();
      const del = await pool.query('DELETE FROM public.users WHERE id = $1', [id]);
      if (del.rowCount === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.post('/admin/faculties', async (req, res) => {
    try {
      const { name, short_code, dean_name } = req.body || {};
      const fname = typeof name === 'string' ? name.trim() : '';
      if (!fname) return res.status(400).json({ error: 'Fakülte adı gerekli' });
      if (short_code && String(short_code).trim().length > 10) {
        return res.status(400).json({ error: 'Kısaltma 10 karakterden uzun olamaz' });
      }
      await ensureFacultiesTable();
      const params = [
        fname,
        short_code ? String(short_code).trim().toUpperCase() : null,
        dean_name ? String(dean_name).trim() : null
      ];
      const { rows } = await pool.query(
        'INSERT INTO public.faculties (name, short_code, dean_name) VALUES ($1, $2, $3) RETURNING id, name, short_code, dean_name, created_at',
        params
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.put('/admin/faculties/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const { name, short_code, dean_name } = req.body || {};
      await ensureFacultiesTable();
      const updates = [];
      const values = [];

      if (typeof name === 'string' && name.trim() !== '') {
        updates.push(`name = $${updates.length + 1}`);
        values.push(name.trim());
      }

      if (short_code !== undefined) {
        updates.push(`short_code = $${updates.length + 1}`);
        const sc = typeof short_code === 'string' ? short_code.trim().toUpperCase() : '';
        if (sc && sc.length > 10) return res.status(400).json({ error: 'Kısaltma 10 karakterden uzun olamaz' });
        values.push(sc === '' ? null : sc);
      }

      if (dean_name !== undefined) {
        updates.push(`dean_name = $${updates.length + 1}`);
        const dn = typeof dean_name === 'string' ? dean_name.trim() : '';
        values.push(dn === '' ? null : dn);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE public.faculties SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, name, short_code, dean_name, created_at`,
        values
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Fakülte bulunamadı' });
      return res.json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.post('/admin/departments', async (req, res) => {
    try {
      const { name, faculty_id, description } = req.body || {};
      const fname = typeof name === 'string' ? name.trim() : '';
      const facId = Number(faculty_id);
      if (!fname || !Number.isInteger(facId)) return res.status(400).json({ error: 'Bölüm adı ve faculty_id gerekli' });
      await Promise.all([ensureFacultiesTable(), ensureDepartmentsTable()]);
      const fac = await pool.query('SELECT id FROM public.faculties WHERE id = $1 LIMIT 1', [facId]);
      if (fac.rowCount === 0) return res.status(400).json({ error: 'Fakülte bulunamadı' });
      const { rows } = await pool.query(
        'INSERT INTO public.departments (name, faculty_id, description) VALUES ($1, $2, $3) RETURNING id, name, faculty_id, description',
        [fname, facId, description ? String(description).trim() : null]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.put('/admin/departments/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const { name, faculty_id, description } = req.body || {};
      await Promise.all([ensureFacultiesTable(), ensureDepartmentsTable()]);
      const updates = [];
      const values = [];

      if (typeof name === 'string' && name.trim() !== '') {
        updates.push(`name = $${updates.length + 1}`);
        values.push(name.trim());
      }

      if (faculty_id !== undefined) {
        const fid = Number(faculty_id);
        if (!Number.isInteger(fid)) return res.status(400).json({ error: 'Geçersiz faculty_id' });
        const fac = await pool.query('SELECT id FROM public.faculties WHERE id = $1 LIMIT 1', [fid]);
        if (fac.rowCount === 0) return res.status(400).json({ error: 'Fakülte bulunamadı' });
        updates.push(`faculty_id = $${updates.length + 1}`);
        values.push(fid);
      }

      if (description !== undefined) {
        updates.push(`description = $${updates.length + 1}`);
        const desc = typeof description === 'string' ? description.trim() : '';
        values.push(desc === '' ? null : desc);
      }

      if (updates.length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE public.departments SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, name, faculty_id, description`,
        values
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Bölüm bulunamadı' });
      return res.json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
