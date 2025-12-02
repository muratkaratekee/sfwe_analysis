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

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
