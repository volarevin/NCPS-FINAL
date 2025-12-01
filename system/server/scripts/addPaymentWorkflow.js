const db = require('../config/db');

const runMigration = async () => {
  console.log('Starting payment workflow migration...');

  const queries = [
    // 1. Add estimate_price to services table
    `ALTER TABLE services ADD COLUMN IF NOT EXISTS estimate_price DECIMAL(10,2) DEFAULT 0.00;`,

    // 2. Add cost columns to appointments table
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) NULL;`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'PHP';`,
    `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cost_notes TEXT NULL;`,

    // 3. Create payments audit table
    `CREATE TABLE IF NOT EXISTS payments (
      payment_id INT AUTO_INCREMENT PRIMARY KEY,
      appointment_id INT NOT NULL,
      technician_id INT NOT NULL,
      total_cost DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'PHP',
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
      FOREIGN KEY (technician_id) REFERENCES users(user_id)
    );`
  ];

  for (const query of queries) {
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      console.log('Executed query successfully.');
    } catch (error) {
      console.error('Error executing query:', error.message);
      // Continue even if error (e.g. column exists)
    }
  }

  console.log('Migration completed.');
  process.exit(0);
};

runMigration();
