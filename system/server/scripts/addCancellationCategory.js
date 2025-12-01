const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL Database');

  // Add cancellation_category column if it doesn't exist
  const query = "ALTER TABLE appointments ADD COLUMN cancellation_category VARCHAR(100) DEFAULT NULL AFTER status";

  db.query(query, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ Column cancellation_category already exists.');
      } else {
        console.error('❌ Error adding column:', err.message);
      }
    } else {
      console.log('✅ Successfully added cancellation_category column.');
    }
    db.end();
  });
});