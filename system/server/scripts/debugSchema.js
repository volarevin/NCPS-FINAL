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

  const queries = [
    "DESCRIBE users",
    "DESCRIBE technician_profiles",
    "SHOW COLUMNS FROM technician_profiles LIKE 'specialty'"
  ];

  let completed = 0;

  queries.forEach((query) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`Error executing query "${query}":`, err);
      } else {
        console.log(`\nResults for "${query}":`);
        console.table(results);
      }
      completed++;
      if (completed === queries.length) {
        db.end();
      }
    });
  });
});
