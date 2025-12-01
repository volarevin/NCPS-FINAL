const mysql = require('mysql2');
require('dotenv').config({ path: '../../.env' });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ncps_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database.');

  const alterQuery = "ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL AFTER phone_number";

  db.query(alterQuery, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Address column already exists.');
      } else {
        console.error('Error adding address column:', err);
      }
    } else {
      console.log('Successfully added address column to users table.');
    }
    db.end();
  });
});
