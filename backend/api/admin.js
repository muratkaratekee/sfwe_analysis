// Türkçe: Yönetim (admin) modülü
// Amaç: Kullanıcı yönetimi ve fakülte/bölüm oluşturma işlemleri
// Kayıtlı endpointler:
//   - GET    /admin/users
//   - PUT    /admin/users/:id
//   - DELETE /admin/users/:id
//   - POST   /admin/faculties
//   - POST   /admin/departments
module.exports = function registerAdmin(app, pool) {
  // Admin: kullanıcıları listele
  app.get('/admin/users', async (req, res) => {
    try {
      const sql = `
        SELECT u.id, u.full_name, u.email, u.role_id, u.created_at,
               u.faculties_id, u.department_id,
               f.name AS faculty_name,
               d.name AS department_name
        FROM public.users u
        LEFT JOIN public.faculties f ON f.id = u.faculties_id
        LEFT JOIN public.departments d ON d.id = u.department_id
        ORDER BY u.created_at DESC NULLS LAST, u.id DESC
      `;
      const { rows } = await pool.query(sql);
      return res.json(rows);
    } catch (err) {
      console.error('admin users error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Admin: kullanıcı güncelle
  app.put('/admin/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });

      const { full_name, role_id, faculties_id, department_id, email } = req.body || {};
      const fields = {};
      if (typeof full_name === 'string' && full_name.trim()) fields.full_name = full_name.trim();
      if (role_id !== undefined) {
        const r = Number(role_id);
        if (![0,1,2,3].includes(r)) return res.status(400).json({ error: 'Geçersiz role_id' });
        fields.role_id = r;
      }
      if (typeof email === 'string' && email.trim()) {
        const mail = String(email).trim().toLowerCase();
        if (!mail.includes('@')) return res.status(400).json({ error: 'Geçersiz email' });
        fields.email = mail;
      }
      let facId = faculties_id !== undefined ? Number(faculties_id) : undefined;
      let depId = department_id !== undefined ? Number(department_id) : undefined;

      if (depId !== undefined) {
        const dep = await pool.query('SELECT id, faculty_id FROM public.departments WHERE id = $1 LIMIT 1', [depId]);
        if (dep.rowCount === 0) return res.status(400).json({ error: 'Bölüm bulunamadı' });
        const depRow = dep.rows[0];
        if (facId === undefined) facId = depRow.faculty_id; // bölümden fakülteyi türet
        else if (facId !== depRow.faculty_id) return res.status(400).json({ error: 'Bölüm seçilen fakülteye ait değil' });
        fields.department_id = depId;
      }
      if (facId !== undefined) fields.faculties_id = facId;

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'Güncellenecek alan yok' });

      const cols = Object.keys(fields);
      const setSql = cols.map((c, i) => `${c} = $${i+1}`).join(', ');
      const vals = cols.map((c) => fields[c]);
      vals.push(id);
      const q = `UPDATE public.users SET ${setSql} WHERE id = $${vals.length} RETURNING id, full_name, email, role_id, faculties_id, department_id`;
      const { rows } = await pool.query(q, vals);
      return res.json({ user: rows[0] });
    } catch (err) {
      console.error('admin users update error', err);
      if (err && err.code === '23505') {
        return res.status(409).json({ error: 'E-posta zaten kayıtlı' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Admin: kullanıcı sil
  app.delete('/admin/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Geçersiz id' });
      const del = await pool.query('DELETE FROM public.users WHERE id = $1', [id]);
      if (del.rowCount === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('admin users delete error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Admin: fakülte oluştur
  app.post('/admin/faculties', async (req, res) => {
    try {
      const { name } = req.body || {};
      const nm = String(name || '').trim();
      if (!nm) return res.status(400).json({ error: 'Geçerli bir fakülte adı giriniz' });
      const { rows } = await pool.query(
        'INSERT INTO public.faculties (name) VALUES ($1) RETURNING id, name',
        [nm]
      );
      return res.status(201).json({ faculty: rows[0] });
    } catch (err) {
      console.error('admin faculties create error', err);
      if (err && err.code === '23505') {
        return res.status(409).json({ error: 'Bu fakülte zaten mevcut' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Admin: bölüm oluştur
  app.post('/admin/departments', async (req, res) => {
    try {
      const { name, faculty_id } = req.body || {};
      const nm = String(name || '').trim();
      const facId = Number(faculty_id);
      if (!nm || !Number.isInteger(facId)) return res.status(400).json({ error: 'Geçerli bir bölüm adı ve faculty_id giriniz' });
      const f = await pool.query('SELECT id FROM public.faculties WHERE id = $1 LIMIT 1', [facId]);
      if (f.rowCount === 0) return res.status(400).json({ error: 'Fakülte bulunamadı' });
      const { rows } = await pool.query(
        'INSERT INTO public.departments (name, faculty_id) VALUES ($1, $2) RETURNING id, name, faculty_id',
        [nm, facId]
      );
      return res.status(201).json({ department: rows[0] });
    } catch (err) {
      console.error('admin departments create error', err);
      if (err && err.code === '23505') {
        return res.status(409).json({ error: 'Bu bölüm zaten mevcut' });
      }
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
