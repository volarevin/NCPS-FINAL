const db = require('../config/db');

const runMigration = async () => {
  console.log('Starting address migration...');

  try {
    // 1. Add service_address to appointments if it doesn't exist
    await new Promise((resolve, reject) => {
      db.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_schema = 'ncps_db' 
        AND table_name = 'appointments' 
        AND column_name = 'service_address'
      `, (err, result) => {
        if (err) return reject(err);
        
        if (result[0].count === 0) {
          console.log('Adding service_address column to appointments...');
          db.query(`
            ALTER TABLE appointments 
            ADD COLUMN service_address TEXT DEFAULT NULL AFTER service_id
          `, (err) => {
            if (err) return reject(err);
            resolve();
          });
        } else {
          console.log('service_address column already exists.');
          resolve();
        }
      });
    });

    // 2. Create customer_addresses table
    await new Promise((resolve, reject) => {
      console.log('Creating customer_addresses table...');
      db.query(`
        CREATE TABLE IF NOT EXISTS customer_addresses (
          address_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          address_label VARCHAR(50) DEFAULT 'Home',
          address_line TEXT NOT NULL,
          is_default TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 3. Migrate existing user addresses to customer_addresses
    await new Promise((resolve, reject) => {
      console.log('Migrating existing user addresses...');
      db.query(`
        INSERT INTO customer_addresses (user_id, address_line, is_default)
        SELECT user_id, address, 1
        FROM users
        WHERE address IS NOT NULL AND address != ''
        AND user_id NOT IN (SELECT user_id FROM customer_addresses)
      `, (err, result) => {
        if (err) return reject(err);
        console.log(`Migrated ${result.affectedRows} addresses.`);
        resolve();
      });
    });

    // 4. Backfill appointments.service_address with current user address
    await new Promise((resolve, reject) => {
      console.log('Backfilling appointment addresses...');
      db.query(`
        UPDATE appointments a
        JOIN users u ON a.customer_id = u.user_id
        SET a.service_address = u.address
        WHERE a.service_address IS NULL
      `, (err, result) => {
        if (err) return reject(err);
        console.log(`Updated ${result.affectedRows} appointments.`);
        resolve();
      });
    });

    console.log('Migration completed successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
