const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // az önce oluşturduğun kullanıcı
  host: 'localhost',
  database: 'maygulu_db', // az önce oluşturduğun veritabanı
  password: 'mehmet07', // myuser için belirlediğin şifre
  port: 5432,
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL connected'))
  .catch(err => console.error('❌ Connection error', err));

module.exports = pool;
