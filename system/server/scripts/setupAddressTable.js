const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Adjust path to .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function setupAddressTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db'
  });

  try {
    console.log('Connected to database.');

    // Create user_addresses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        address_id int(11) NOT NULL AUTO_INCREMENT,
        user_id int(11) NOT NULL,
        address_line text NOT NULL,
        is_primary boolean DEFAULT FALSE,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (address_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('user_addresses table created or already exists.');

    // Migrate existing addresses
    const [users] = await connection.execute('SELECT user_id, address FROM users WHERE address IS NOT NULL AND address != ""');
    
    for (const user of users) {
      // Check if user already has addresses
      const [existing] = await connection.execute('SELECT * FROM user_addresses WHERE user_id = ?', [user.user_id]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO user_addresses (user_id, address_line, is_primary) VALUES (?, ?, TRUE)',
          [user.user_id, user.address]
        );
        console.log(`Migrated address for user ${user.user_id}`);
      }
    }

    console.log('Address migration complete.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

setupAddressTable();
