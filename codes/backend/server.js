const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { UPLOAD_DIR, upload } = require('./api/thesesupload');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/files', express.static(UPLOAD_DIR));

// Route modules
require('./api/health')(app, pool);
require('./api/auth')(app, pool);
require('./api/lookups')(app, pool);
require('./api/citations')(app, pool);
require('./api/analytics')(app, pool);
require('./api/comments')(app, pool);
require('./api/admin')(app, pool);
require('./api/theses')(app, pool, { upload, UPLOAD_DIR });
require('./api/favorites')(app, pool);

// DEBUG: List all users (remove in production)
app.get('/debug/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, email, full_name, role_id, password_hash FROM public.users ORDER BY id');
        res.json(rows);
    } catch (err) {
        console.error('Debug users error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DEBUG: Reset password for a user
const bcrypt = require('bcrypt');
app.post('/debug/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hash = await bcrypt.hash(newPassword, 10);
        const { rowCount } = await pool.query('UPDATE public.users SET password_hash = $1 WHERE email = $2', [hash, email]);
        res.json({ updated: rowCount, email, hash });
    } catch (err) {
        console.error('Debug reset error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DEBUG: Show users table schema
app.get('/debug/schema', async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
