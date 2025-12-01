const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Use a connection pool instead of a single connection
// This allows for better concurrency and is required for the session-variable audit logging approach
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to database as id ' + connection.threadId);
  connection.release();
});

module.exports = pool;