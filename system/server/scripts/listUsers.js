const db = require('../config/db');

const query = 'SELECT user_id, username, email, role FROM users';

db.query(query, (err, results) => {
  if (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
  console.log('Current Users:');
  console.table(results);
  process.exit(0);
});
