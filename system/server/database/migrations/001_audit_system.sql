-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    actor_role VARCHAR(50) NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id INT NULL,
    changes JSON NULL, -- Stores OLD and NEW values
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_id (user_id)
);

-- Login History Table
CREATE TABLE IF NOT EXISTS login_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_login (user_id, created_at)
);

-- Ensure profile_picture exists in users table
-- (This is idempotent; if it exists, this might fail or do nothing depending on strict mode, 
-- but standard SQL doesn't have IF NOT EXISTS for columns easily. 
-- Assuming it exists based on previous context, but if not:)
-- ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL;

-- Triggers for Appointments
DROP TRIGGER IF EXISTS trg_appointments_insert;
DROP TRIGGER IF EXISTS trg_appointments_update;
DROP TRIGGER IF EXISTS trg_appointments_delete;
DROP TRIGGER IF EXISTS trg_users_update;
DELIMITER $$

CREATE TRIGGER trg_appointments_insert AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, actor_role, action, table_name, record_id, changes, created_at)
    VALUES (
        @app_user_id, 
        @app_user_role, 
        'CREATE', 
        'appointments', 
        NEW.appointment_id, 
        JSON_OBJECT(
            'new', JSON_OBJECT(
                'status', NEW.status, 
                'date', NEW.appointment_date, 
                'customer_id', NEW.customer_id
            )
        ),
        NOW()
    );
END$$

CREATE TRIGGER trg_appointments_update AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, actor_role, action, table_name, record_id, changes, created_at)
    VALUES (
        @app_user_id, 
        @app_user_role, 
        'UPDATE', 
        'appointments', 
        NEW.appointment_id, 
        JSON_OBJECT(
            'old', JSON_OBJECT('status', OLD.status, 'date', OLD.appointment_date, 'technician_id', OLD.technician_id),
            'new', JSON_OBJECT('status', NEW.status, 'date', NEW.appointment_date, 'technician_id', NEW.technician_id)
        ),
        NOW()
    );
END$$

CREATE TRIGGER trg_appointments_delete AFTER DELETE ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, actor_role, action, table_name, record_id, changes, created_at)
    VALUES (
        @app_user_id, 
        @app_user_role, 
        'DELETE', 
        'appointments', 
        OLD.appointment_id, 
        JSON_OBJECT(
            'old', JSON_OBJECT('status', OLD.status, 'date', OLD.appointment_date)
        ),
        NOW()
    );
END$$

-- Triggers for Users (Profile Updates)
CREATE TRIGGER trg_users_update AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Only log if significant fields changed
    IF (OLD.first_name != NEW.first_name OR OLD.last_name != NEW.last_name OR OLD.email != NEW.email OR OLD.role != NEW.role OR OLD.profile_picture != NEW.profile_picture) THEN
        INSERT INTO audit_logs (user_id, actor_role, action, table_name, record_id, changes, created_at)
        VALUES (
            @app_user_id, 
            @app_user_role, 
            'UPDATE', 
            'users', 
            NEW.user_id, 
            JSON_OBJECT(
                'old', JSON_OBJECT('first_name', OLD.first_name, 'last_name', OLD.last_name, 'email', OLD.email, 'role', OLD.role),
                'new', JSON_OBJECT('first_name', NEW.first_name, 'last_name', NEW.last_name, 'email', NEW.email, 'role', NEW.role)
            ),
            NOW()
        );
    END IF;
END$$

DELIMITER ;
