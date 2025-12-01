-- Idempotent migration: create audit_logs and migrate activity_logs if present
-- Run with system/server/scripts/apply_migrations.js

-- Ensure audit_logs exists (V1 structure or V2)
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  actor_role VARCHAR(50) NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NULL,
  changes JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_table_record (table_name, record_id),
  INDEX idx_user_id (user_id)
);

-- Upgrade to V2: Add actor_username if missing
DROP PROCEDURE IF EXISTS UpgradeAuditLogs;
DELIMITER $$
CREATE PROCEDURE UpgradeAuditLogs()
BEGIN
  IF NOT EXISTS (SELECT * FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'audit_logs' AND column_name = 'actor_username') THEN
    ALTER TABLE audit_logs ADD COLUMN actor_username VARCHAR(150) NULL AFTER actor_role;
  END IF;
  
  -- Update table_name length if needed
  ALTER TABLE audit_logs MODIFY COLUMN table_name VARCHAR(128) NOT NULL;
END$$
DELIMITER ;
CALL UpgradeAuditLogs();
DROP PROCEDURE UpgradeAuditLogs;

-- If activity_logs exists, migrate safe fields into audit_logs
DROP PROCEDURE IF EXISTS MigrateActivityLogs;
DELIMITER $$
CREATE PROCEDURE MigrateActivityLogs()
BEGIN
  DECLARE activity_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO activity_exists FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'activity_logs';

  IF activity_exists > 0 THEN
    INSERT INTO audit_logs (user_id, actor_role, actor_username, action, table_name, record_id, changes, ip_address, user_agent, created_at)
    SELECT 
      user_id,
      'User',
      '',
      action_type,
      '',
      NULL,
      JSON_OBJECT('meta', description, 'note', description),
      '',
      '',
      created_at
    FROM activity_logs;
  END IF;
END$$
DELIMITER ;

CALL MigrateActivityLogs();
DROP PROCEDURE MigrateActivityLogs;

-- Note: optional drop is provided in separate migration after manual verification.
