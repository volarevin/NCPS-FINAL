const db = require('../config/db');

async function diagnose() {
    console.log('Starting diagnosis...');
    
    // 1. Test DB Connection
    db.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('DB Connection Failed:', err);
            return;
        }
        console.log('DB Connection Successful');

        // 2. Test Receptionist Query
        const receptionistQuery = `
            SELECT COUNT(*) as count
            FROM appointments a
            JOIN users u ON a.customer_id = u.user_id
            JOIN services s ON a.service_id = s.service_id
            LEFT JOIN users t ON a.technician_id = t.user_id
            WHERE (a.marked_for_deletion = 0 OR a.marked_for_deletion IS NULL)
        `;
        
        db.query(receptionistQuery, (err, results) => {
            if (err) {
                console.error('Receptionist Query Failed:', err);
            } else {
                console.log('Receptionist Query Count:', results[0].count);
            }

            // 3. Test Admin Query
            const adminQuery = `
                SELECT COUNT(*) as count
                FROM appointments a
                JOIN users u ON a.customer_id = u.user_id
                LEFT JOIN users t ON a.technician_id = t.user_id
                JOIN services s ON a.service_id = s.service_id
                LEFT JOIN reviews r ON a.appointment_id = r.appointment_id
                LEFT JOIN users cb ON a.cancelled_by = cb.user_id
                WHERE a.marked_for_deletion = 0 OR a.marked_for_deletion IS NULL
            `;

            db.query(adminQuery, (err, results) => {
                if (err) {
                    console.error('Admin Query Failed:', err);
                } else {
                    console.log('Admin Query Count:', results[0].count);
                }
                process.exit();
            });
        });
    });
}

diagnose();