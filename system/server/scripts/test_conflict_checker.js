const db = require('../config/db');
const checkTechnicianConflict = require('../utils/conflictChecker');

const runTest = async () => {
    console.log('Starting Conflict Checker Test...');

    // 1. Setup: Create a dummy technician and service if needed, or use existing.
    // For simplicity, we'll assume we have at least one technician and service.
    // We'll fetch one.
    
    const getTech = () => new Promise((resolve, reject) => {
        db.query("SELECT user_id FROM users WHERE role = 'Technician' LIMIT 1", (err, res) => {
            if (err) reject(err);
            resolve(res[0]?.user_id);
        });
    });

    const getService = () => new Promise((resolve, reject) => {
        db.query("SELECT service_id, duration_minutes FROM services LIMIT 1", (err, res) => {
            if (err) reject(err);
            resolve(res[0]);
        });
    });

    try {
        const techId = await getTech();
        const service = await getService();

        if (!techId || !service) {
            console.error('No technician or service found to test with.');
            process.exit(1);
        }

        console.log(`Testing with Tech ID: ${techId}, Service ID: ${service.service_id} (${service.duration_minutes} mins)`);

        // 2. Create a test appointment
        const testDate = '2025-12-25 10:00:00';
        const insertQuery = `
            INSERT INTO appointments (customer_id, service_id, technician_id, appointment_date, status, service_address)
            VALUES ((SELECT user_id FROM users WHERE role='Customer' LIMIT 1), ?, ?, ?, 'Pending', 'Test Address')
        `;
        
        const insertResult = await new Promise((resolve, reject) => {
            db.query(insertQuery, [service.service_id, techId, testDate], (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });

        const appointmentId = insertResult.insertId;
        console.log(`Created test appointment #${appointmentId} at ${testDate}`);

        // 3. Test Conflict (Overlapping)
        // Try to book same time
        console.log('Test 1: Exact Overlap');
        const conflict1 = await checkTechnicianConflict(techId, testDate, service.duration_minutes);
        if (conflict1 && conflict1.conflict) {
            console.log('PASS: Conflict detected for exact overlap.');
        } else {
            console.error('FAIL: No conflict detected for exact overlap.');
        }

        // Try to book overlapping (start inside)
        console.log('Test 2: Partial Overlap (Start inside)');
        const overlapDate = '2025-12-25 10:15:00'; // 15 mins into the appointment
        const conflict2 = await checkTechnicianConflict(techId, overlapDate, service.duration_minutes);
        if (conflict2 && conflict2.conflict) {
            console.log('PASS: Conflict detected for partial overlap.');
        } else {
            console.error('FAIL: No conflict detected for partial overlap.');
        }

        // 4. Test No Conflict (After)
        console.log('Test 3: No Conflict (After)');
        // Calculate end time of first appointment
        const endDate = new Date(new Date(testDate).getTime() + service.duration_minutes * 60000 + 60000); // 1 min after
        const noConflictDate = endDate.toISOString().slice(0, 19).replace('T', ' ');
        
        const conflict3 = await checkTechnicianConflict(techId, noConflictDate, service.duration_minutes);
        if (!conflict3) {
            console.log('PASS: No conflict detected for non-overlapping time.');
        } else {
            console.error('FAIL: Conflict detected where there should be none.', conflict3);
        }

        // 5. Test Exclude ID (Update scenario)
        console.log('Test 4: Exclude ID (Update same appointment)');
        const conflict4 = await checkTechnicianConflict(techId, testDate, service.duration_minutes, appointmentId);
        if (!conflict4) {
            console.log('PASS: No conflict when excluding own ID.');
        } else {
            console.error('FAIL: Conflict detected when excluding own ID.');
        }

        // Cleanup
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM appointments WHERE appointment_id = ?', [appointmentId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Test failed with error:', error);
    } finally {
        process.exit(0);
    }
};

runTest();
