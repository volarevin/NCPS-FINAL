const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function addWalkInColumns() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to database.');

    // 1. Modify customer_id to be nullable
    console.log('Modifying customer_id to be nullable...');
    await connection.query('ALTER TABLE appointments MODIFY customer_id INT NULL');

    // 2. Add walk-in columns if they don't exist
    console.log('Adding walk-in columns...');
    
    const columns = [
      'walkin_name VARCHAR(100) DEFAULT NULL',
      'walkin_phone VARCHAR(20) DEFAULT NULL',
      'walkin_email VARCHAR(100) DEFAULT NULL'
    ];

    for (const col of columns) {
      try {
        await connection.query(`ALTER TABLE appointments ADD COLUMN ${col}`);
        console.log(`Added ${col.split(' ')[0]}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`${col.split(' ')[0]} already exists.`);
        } else {
          throw err;
        }
      }
    }

    console.log('Schema update complete.');

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    if (connection) await connection.end();
  }
}

addWalkInColumns();
