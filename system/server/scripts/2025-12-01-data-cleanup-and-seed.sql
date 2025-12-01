-- 1. Ensure required columns exist (Idempotent checks)
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

-- Add columns to services
CALL AddColumnIfNotExists('services', 'estimated_price', 'DECIMAL(10,2) NULL');

-- Add columns to appointments
CALL AddColumnIfNotExists('appointments', 'total_cost', 'DECIMAL(10,2) NULL');
CALL AddColumnIfNotExists('appointments', 'cost_currency', "VARCHAR(3) NOT NULL DEFAULT 'PHP'");
CALL AddColumnIfNotExists('appointments', 'cost_notes', 'TEXT NULL');
CALL AddColumnIfNotExists('appointments', 'cancellation_category', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('appointments', 'cancellation_reason', 'TEXT NULL');

-- 2. Fill NULLs for Completed with realistic totals
UPDATE appointments a
JOIN services s ON a.service_id = s.service_id
SET a.total_cost = ROUND(COALESCE(s.estimated_price, 1000) * (0.9 + RAND() * 0.4), 2),
    a.cost_currency = 'PHP'
WHERE a.status = 'Completed' AND a.total_cost IS NULL;

-- 3. Fill NULLs for Cancelled/Rejected with categories/reasons
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

-- 4. Normalize invalid or nonsensical rows

-- Delete rows with NULL service_id or appointment_date
DELETE FROM appointments WHERE service_id IS NULL OR appointment_date IS NULL;

-- Fix invalid statuses
UPDATE appointments 
SET status = 'Pending' 
WHERE status NOT IN ('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected');

-- Fix future completed appointments
UPDATE appointments 
SET status = 'Confirmed' 
WHERE status = 'Completed' AND appointment_date > NOW();

-- Fix invalid technician references (Set to NULL if technician doesn't exist)
UPDATE appointments a
LEFT JOIN users u ON a.technician_id = u.user_id
SET a.technician_id = NULL
WHERE a.technician_id IS NOT NULL AND u.user_id IS NULL;

-- 5. Seed sample records

-- Insert ~20 Completed appointments
INSERT INTO appointments (customer_id, service_id, technician_id, appointment_date, status, total_cost, cost_currency, customer_notes, created_at, updated_at)
SELECT 
    (SELECT user_id FROM users WHERE role = 'Customer' ORDER BY RAND() LIMIT 1),
    (SELECT service_id FROM services ORDER BY RAND() LIMIT 1),
    (SELECT user_id FROM users WHERE role = 'Technician' ORDER BY RAND() LIMIT 1),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    'Completed',
    NULL, -- Will be updated below
    'PHP',
    'Seeded completed appointment',
    NOW(),
    NOW()
FROM information_schema.tables LIMIT 20;

-- Update costs for newly inserted completed appointments
UPDATE appointments a
JOIN services s ON a.service_id = s.service_id
SET a.total_cost = ROUND(COALESCE(s.estimated_price, 1500) * (0.9 + RAND() * 0.4), 2)
WHERE a.customer_notes = 'Seeded completed appointment' AND a.total_cost IS NULL;

-- Insert Ratings for Completed appointments (if missing)
-- Ensure we have valid customer and technician IDs
INSERT INTO reviews (appointment_id, customer_id, technician_id, rating, feedback_text)
SELECT 
    a.appointment_id,
    a.customer_id,
    a.technician_id,
    FLOOR(3 + RAND() * 3), -- 3 to 5
    ELT(FLOOR(1 + RAND() * 5), 'Great service!', 'Very professional.', 'Good job.', 'Satisfied with the work.', 'Technician was on time.')
FROM appointments a
LEFT JOIN reviews r ON a.appointment_id = r.appointment_id
WHERE a.status = 'Completed' 
  AND r.review_id IS NULL
  AND a.customer_id IS NOT NULL
  AND a.technician_id IS NOT NULL;

-- Insert ~10 Cancelled appointments
INSERT INTO appointments (customer_id, service_id, appointment_date, status, cancellation_category, cancellation_reason, customer_notes, created_at, updated_at)
SELECT 
    (SELECT user_id FROM users WHERE role = 'Customer' ORDER BY RAND() LIMIT 1),
    (SELECT service_id FROM services ORDER BY RAND() LIMIT 1),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    'Cancelled',
    ELT(FLOOR(1 + RAND() * 7), 'No-show', 'Rescheduled', 'Customer unavailable', 'Duplicate booking', 'Inventory/parts issue', 'Weather/transport', 'Pricing disagreement'),
    'Seeded cancellation',
    'Seeded cancelled appointment',
    NOW(),
    NOW()
FROM information_schema.tables LIMIT 10;

-- Insert ~10 Rejected appointments
INSERT INTO appointments (customer_id, service_id, appointment_date, status, cancellation_category, cancellation_reason, customer_notes, created_at, updated_at)
SELECT 
    (SELECT user_id FROM users WHERE role = 'Customer' ORDER BY RAND() LIMIT 1),
    (SELECT service_id FROM services ORDER BY RAND() LIMIT 1),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY),
    'Rejected',
    'Pricing disagreement',
    'Seeded rejection',
    'Seeded rejected appointment',
    NOW(),
    NOW()
FROM information_schema.tables LIMIT 10;

-- Insert Pending/Confirmed appointments
INSERT INTO appointments (customer_id, service_id, appointment_date, status, customer_notes, created_at, updated_at)
SELECT 
    (SELECT user_id FROM users WHERE role = 'Customer' ORDER BY RAND() LIMIT 1),
    (SELECT service_id FROM services ORDER BY RAND() LIMIT 1),
    DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 14) DAY),
    ELT(FLOOR(1 + RAND() * 2), 'Pending', 'Confirmed'),
    'Seeded future appointment',
    NOW(),
    NOW()
FROM information_schema.tables LIMIT 10;

-- 6. Payment workflow completeness checks
-- Ensure completed have total_cost
UPDATE appointments a
JOIN services s ON a.service_id = s.service_id
SET a.total_cost = ROUND(COALESCE(s.estimated_price, 1000), 2)
WHERE a.status = 'Completed' AND a.total_cost IS NULL;

-- Ensure pending/confirmed have NULL total_cost
UPDATE appointments
SET total_cost = NULL
WHERE status IN ('Pending', 'Confirmed', 'In Progress');

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
