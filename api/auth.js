const bcrypt = require('bcrypt');

module.exports = function registerAuth(app, pool) {
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

  app.post('/auth/register', async (req, res) => {
    try {
      const { full_name, emailUser, password, faculties_id, department_id, role_id } = req.body || {};
      const uname = typeof emailUser === 'string' ? emailUser.trim().toLowerCase() : '';
      const name = typeof full_name === 'string' ? full_name.trim() : '';
      const pass = typeof password === 'string' ? password : '';
      const facId = faculties_id ? Number(faculties_id) : null;
      const depId = department_id ? Number(department_id) : null;
      const roleId = role_id !== undefined ? Number(role_id) : 1;
      if (!uname || !name || !pass) return res.status(400).json({ error: 'Eksik alanlar' });
      const email = `${uname}@final.edu.tr`;
      await ensureUsersTable();
      const existing = await pool.query('SELECT id FROM public.users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rowCount > 0) return res.status(400).json({ error: 'Email zaten kayıtlı' });
      const hash = await bcrypt.hash(pass, 10);
      const { rows } = await pool.query(
        `INSERT INTO public.users (full_name, email, password, role_id, faculties_id, department_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, full_name, email, role_id, faculties_id, department_id`,
        [name, email, hash, Number.isInteger(roleId) ? roleId : 1, Number.isInteger(facId) ? facId : null, Number.isInteger(depId) ? depId : null]
      );
      return res.status(201).json({ user: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  app.post('/auth/login', async (req, res) => {
    try {
      const { emailUser, password } = req.body || {};
      const uname = typeof emailUser === 'string' ? emailUser.trim().toLowerCase() : '';
      const pass = typeof password === 'string' ? password : '';
      console.log('Login attempt:', { emailUser, uname, hasPassword: !!pass });
      if (!uname || !pass) return res.status(400).json({ error: 'Eksik alanlar' });
      const email = `${uname}@final.edu.tr`;
      console.log('Looking for email:', email);
      await ensureUsersTable();
      const { rows } = await pool.query('SELECT id, full_name, email, password, role_id, faculties_id, department_id, is_active FROM public.users WHERE email = $1 LIMIT 1', [email]);
      console.log('Found users:', rows.length, rows.length > 0 ? { id: rows[0].id, email: rows[0].email } : 'none');
      if (rows.length === 0) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      const u = rows[0];
      if (u.is_active === false) {
        return res.status(403).json({ error: 'Contact manager' });
      }
      const ok = await bcrypt.compare(pass, u.password);
      if (!ok) return res.status(401).json({ error: 'Şifre yanlış' });
      const user = {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role_id: u.role_id,
        faculties_id: u.faculties_id,
        department_id: u.department_id,
        is_active: u.is_active !== false,
      };
      return res.json({ user });
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
