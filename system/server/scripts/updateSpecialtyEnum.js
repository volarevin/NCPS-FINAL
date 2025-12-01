const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ncps_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database.');

  const alterQuery = `
    ALTER TABLE technician_profiles 
    MODIFY COLUMN specialty ENUM(
      'Hardware Repair',
      'Software Support',
      'Network Setup',
      'Data Recovery',
      'System Maintenance',
      'Virus Removal',
      'Custom Build',
      'Consultation',
      'General'
    ) DEFAULT 'General';
  `;

  db.query(alterQuery, (err, result) => {
    if (err) {
      console.error('Error updating specialty column:', err);
    } else {
      console.log('Successfully updated specialty column to ENUM.');
    }
    db.end();
  });
});
