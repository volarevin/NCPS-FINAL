const db = require('../config/db');
const { checkCustomerDuplicate } = require('../utils/conflictChecker');

const runTest = async () => {
    console.log('Starting Duplicate Booking Test...');

    // 1. Setup: Get a customer and service
    const getCustomer = () => new Promise((resolve, reject) => {
        db.query("SELECT user_id FROM users WHERE role = 'Customer' LIMIT 1", (err, res) => {
            if (err) reject(err);
            resolve(res[0]?.user_id);
        });
    });

    const getService = () => new Promise((resolve, reject) => {
        db.query("SELECT service_id FROM services LIMIT 1", (err, res) => {
            if (err) reject(err);
            resolve(res[0]?.service_id);
        });
    });

    try {
        const customerId = await getCustomer();
        const serviceId = await getService();

        if (!customerId || !serviceId) {
            console.error('No customer or service found.');
            process.exit(1);
        }

        console.log(`Testing with Customer ID: ${customerId}, Service ID: ${serviceId}`);

        // 2. Create a test appointment
        const testDate = '2025-12-30';
        const insertQuery = `
            INSERT INTO appointments (customer_id, service_id, appointment_date, status, service_address)
            VALUES (?, ?, ?, 'Pending', 'Test Address')
        `;
        
        const insertResult = await new Promise((resolve, reject) => {
            db.query(insertQuery, [customerId, serviceId, `${testDate} 10:00:00`], (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });

        const appointmentId = insertResult.insertId;
        console.log(`Created test appointment #${appointmentId} on ${testDate}`);

        // 3. Test Duplicate
        console.log('Test 1: Duplicate Booking');
        const conflict = await checkCustomerDuplicate(customerId, serviceId, testDate);
        if (conflict && conflict.conflict) {
            console.log('PASS: Duplicate detected.', conflict.message);
        } else {
            console.error('FAIL: No duplicate detected.');
        }

        // 4. Test Different Date
        console.log('Test 2: Different Date');
        const otherDate = '2025-12-31';
        const conflict2 = await checkCustomerDuplicate(customerId, serviceId, otherDate);
        if (!conflict2) {
            console.log('PASS: No duplicate for different date.');
        } else {
            console.error('FAIL: Duplicate detected for different date.');
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
        console.error('Test failed:', error);
    } finally {
        process.exit(0);
    }
};

runTest();
