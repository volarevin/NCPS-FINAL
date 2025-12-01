-- 1. Add presence columns to users
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

DELIMITER //

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(255),
    IN colName VARCHAR(255),
    IN colDef VARCHAR(255)
)
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    AND table_name = tableName
    AND column_name = colName;

    IF colCount = 0 THEN
        SET @s = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

CALL AddColumnIfNotExists('users', 'is_online', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL AddColumnIfNotExists('users', 'last_seen', 'DATETIME NULL');

-- 2. Update technician_profiles availability_status ENUM
-- First, normalize existing data to lowercase/new values to avoid truncation errors
UPDATE technician_profiles SET availability_status = 'busy' WHERE availability_status = 'On Job';
UPDATE technician_profiles SET availability_status = 'available' WHERE availability_status = 'Available';
UPDATE technician_profiles SET availability_status = 'offline' WHERE availability_status = 'Offline';

-- Now modify the column definition
ALTER TABLE technician_profiles MODIFY COLUMN availability_status ENUM('available','busy','offline') NOT NULL DEFAULT 'offline';

-- 3. Cancellation Cleanup
-- Fill NULL cancellation_category/reason for status IN ('Cancelled','Rejected')
UPDATE appointments
SET cancellation_category = ELT(FLOOR(1 + RAND() * 7), 
    'No-show', 
    'Rescheduled', 
    'Customer unavailable', 
    'Duplicate booking', 
    'Inventory/parts issue', 
    'Weather/transport', 
    'Pricing disagreement'
),
cancellation_reason = 'Automated cleanup: Missing cancellation details filled.'
WHERE status IN ('Cancelled', 'Rejected') AND (cancellation_category IS NULL OR cancellation_category = '');

-- Ensure no records remain with NULL cancellation_category for Cancelled/Rejected
UPDATE appointments
SET cancellation_category = 'Other'
WHERE status IN ('Cancelled', 'Rejected') AND (cancellation_category IS NULL OR cancellation_category = '');

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
