// Türkçe: Kimlik doğrulama (auth) modülü
// Amaç: Kayıt olma ve giriş yapma işlemlerini sağlamak
// Kayıtlı endpointler:
//   - POST /auth/register
//   - POST /auth/login
const bcrypt = require('bcrypt');

module.exports = function registerAuth(app, pool) {
  // Kayıt ol
  app.post('/auth/register', async (req, res) => {
    try {
      const { full_name, emailUser, password, faculties_id, department_id } = req.body || {};
      if (!full_name || !emailUser || !password) {
        return res.status(400).json({ error: 'Eksik alanlar var.' });
      }
      const emailLocal = String(emailUser).trim().toLowerCase();
      if (!emailLocal || /\s/.test(emailLocal)) {
        return res.status(400).json({ error: 'Geçerli bir kullanıcı adı giriniz.' });
      }
      const email = `${emailLocal}@final.edu.tr`;

      const facId = faculties_id !== undefined && faculties_id !== '' ? Number(faculties_id) : null;
      const depId = department_id !== undefined && department_id !== '' ? Number(department_id) : null;
      const hasFac = Number.isInteger(facId);
      const hasDep = Number.isInteger(depId);

      if (hasFac && hasDep) {
        const depCheck = await pool.query(
          'SELECT 1 FROM public.departments WHERE id = $1 AND faculty_id = $2 LIMIT 1',
          [depId, facId]
        );
        if (depCheck.rowCount === 0) {
          return res.status(400).json({ error: 'Seçilen bölüm bu fakülteye ait değil.' });
        }
      }

      const hash = await bcrypt.hash(String(password), 10);
      const roleId = (hasFac || hasDep) ? 1 : 0;
      const insertSql = `
        INSERT INTO public.users (full_name, email, password, role_id, department_id, faculties_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, full_name, email, role_id, department_id, faculties_id, created_at
      `;
      const { rows } = await pool.query(insertSql, [
        String(full_name).trim(),
        email,
        hash,
        roleId,
        hasDep ? depId : null,
        hasFac ? facId : null,
      ]);
      return res.status(201).json({ user: rows[0] });
    } catch (err) {
      if (err && err.code === '23505') {
        return res.status(409).json({ error: 'E-posta zaten kayıtlı.' });
      }
      console.error('Register error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Giriş yap
  app.post('/auth/login', async (req, res) => {
    try {
      const { emailUser, password } = req.body || {};
      if (!emailUser || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
      }
      const email = `${String(emailUser).trim().toLowerCase()}@final.edu.tr`;
      const q = `SELECT id, full_name, email, password, role_id, department_id, faculties_id
                 FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1`;
      const { rows } = await pool.query(q, [email]);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
      }
      const user = rows[0];
      const ok = await bcrypt.compare(String(password), user.password);
      if (!ok) return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });
      return res.json({ user: { id: user.id, full_name: user.full_name, email: user.email, role_id: user.role_id, department_id: user.department_id, faculties_id: user.faculties_id } });
    } catch (err) {
      console.error('Login error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
