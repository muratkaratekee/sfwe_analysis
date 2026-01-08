// Türkçe: Sözlük/veri listeleri (lookups) modülü
// Amaç: Fakülte, bölüm ve danışman listelerini sağlamak
// Kayıtlı endpointler:
//   - GET /faculties
//   - GET /departments (faculty_id ile opsiyonel filtre)
//   - GET /advisors
module.exports = function registerLookups(app, pool) {
  // Fakülteler
  app.get('/faculties', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, name FROM public.faculties WHERE name IS NOT NULL AND TRIM(name) != \'\'  ORDER BY name');
      return res.json(rows);
    } catch (err) {
      console.error('faculties error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Bölümler (opsiyonel faculty_id filtresi)
  app.get('/departments', async (req, res) => {
    try {
      const facultyId = req.query.faculty_id ? Number(req.query.faculty_id) : null;
      if (facultyId) {
        const { rows } = await pool.query(
          'SELECT id, name, faculty_id FROM public.departments WHERE faculty_id = $1 AND name IS NOT NULL AND TRIM(name) != \'\' ORDER BY name',
          [facultyId]
        );
        return res.json(rows);
      } else {
        const { rows } = await pool.query('SELECT id, name, faculty_id FROM public.departments WHERE name IS NOT NULL AND TRIM(name) != \'\' ORDER BY name');
        return res.json(rows);
      }
    } catch (err) {
      console.error('departments error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Danışmanlar
  app.get('/advisors', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, full_name FROM public.users WHERE role_id = 2 ORDER BY full_name');
      return res.json(rows);
    } catch (err) {
      console.error('advisors error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  // Öğrenciler
  app.get('/students', async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, full_name FROM public.users WHERE role_id = 1 ORDER BY full_name');
      return res.json(rows);
    } catch (err) {
      console.error('students error', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  });
};
