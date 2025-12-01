const db = require('../config/db');

(async function run() {
  console.log('Removing activity_logs and ip_address from audit_logs...');
  const q = (sql, params) => new Promise((resolve, reject) => db.query(sql, params, (e, r) => e ? reject(e) : resolve(r)));

  try {
    await q('DROP TABLE IF EXISTS activity_logs');
    console.log('Dropped activity_logs (if existed).');

    // Check if ip_address column exists
    const rows = await q(`
      SELECT COUNT(*) as count
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'ip_address'
    `);
    
    const hasColumn = rows[0].count > 0;

    if (hasColumn) {
      await q('ALTER TABLE audit_logs DROP COLUMN ip_address');
      console.log('Dropped ip_address column from audit_logs.');
    } else {
      console.log('ip_address column not found in audit_logs (already removed).');
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
