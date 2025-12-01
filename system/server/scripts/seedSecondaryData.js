const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

const feedbackTemplates = [
    { rating: 5, text: "Excellent service! The technician was very professional and efficient." },
    { rating: 5, text: "Great job, highly recommended. Fixed the issue quickly." },
    { rating: 5, text: "Very happy with the installation. The cameras are crystal clear." },
    { rating: 4, text: "Good service, but arrived a bit late. Work quality was great though." },
    { rating: 4, text: "Satisfied with the installation. Clean work." },
    { rating: 3, text: "Average service. The camera works but the angle isn't what I asked for." },
    { rating: 3, text: "Took longer than expected, but the job got done." },
    { rating: 2, text: "Technician was rude and left a mess." },
    { rating: 1, text: "Terrible experience. System stopped working after 2 days." }
];

const logActions = [
    "User Logged In",
    "Viewed Dashboard",
    "Updated Profile",
    "Checked Appointments",
    "Downloaded Report",
    "Changed Password",
    "Viewed Service List",
    "Contacted Support"
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedSecondary() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Generate Reviews for Completed Appointments
        console.log('Generating Reviews...');
        const [completedAppts] = await connection.execute(
            'SELECT appointment_id, customer_id, technician_id, appointment_date FROM appointments WHERE status = "Completed" AND technician_id IS NOT NULL'
        );

        let reviewCount = 0;
        for (const appt of completedAppts) {
            // Check if review already exists
            const [existing] = await connection.execute('SELECT review_id FROM reviews WHERE appointment_id = ?', [appt.appointment_id]);
            
            if (existing.length === 0 && Math.random() < 0.8) { // 80% chance to leave a review if none exists
                const template = getRandomElement(feedbackTemplates);
                // Add slight date offset from appointment date
                const reviewDate = new Date(new Date(appt.appointment_date).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Within 7 days
                
                await connection.execute(
                    'INSERT INTO reviews (appointment_id, customer_id, technician_id, rating, feedback_text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [appt.appointment_id, appt.customer_id, appt.technician_id, template.rating, template.text, reviewDate]
                );
                reviewCount++;
            }
        }
        console.log(`Generated ${reviewCount} new reviews.`);

        // 2. Generate Notifications
        console.log('Generating Notifications...');
        const [allAppts] = await connection.execute('SELECT * FROM appointments');
        
        let notifCount = 0;
        for (const appt of allAppts) {
            const date = new Date(appt.created_at);
            
            // Check if notifications already exist for this appointment to avoid massive dupes if run multiple times
            // (Simplification: just insert, assuming this is for testing and dupes are okay or table was empty)
            // Better: Check count.
            const [existingNotifs] = await connection.execute('SELECT count(*) as count FROM notifications WHERE related_appointment_id = ?', [appt.appointment_id]);
            if (existingNotifs[0].count > 0) continue;

            // Notification for Customer
            if (appt.status === 'Confirmed') {
                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, is_read, related_appointment_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [appt.customer_id, 'Appointment Confirmed', `Your appointment on ${new Date(appt.appointment_date).toLocaleDateString()} has been confirmed.`, Math.random() < 0.5, appt.appointment_id, date]
                );
                notifCount++;
            } else if (appt.status === 'Cancelled') {
                 await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, is_read, related_appointment_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [appt.customer_id, 'Appointment Cancelled', `Appointment #${appt.appointment_id} has been cancelled.`, Math.random() < 0.5, appt.appointment_id, date]
                );
                notifCount++;
            } else if (appt.status === 'Completed') {
                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, is_read, related_appointment_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [appt.customer_id, 'Service Completed', `Your service for Appointment #${appt.appointment_id} is complete. Please leave a review!`, Math.random() < 0.5, appt.appointment_id, date]
                );
                notifCount++;
            }

            // Notification for Technician
            if (appt.technician_id) {
                await connection.execute(
                    'INSERT INTO notifications (user_id, title, message, is_read, related_appointment_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [appt.technician_id, 'New Job Assigned', `You have been assigned to Appointment #${appt.appointment_id}.`, Math.random() < 0.5, appt.appointment_id, date]
                );
                notifCount++;
            }
        }
        console.log(`Generated ${notifCount} notifications.`);

        // 3. Generate Activity Logs
        console.log('Generating Activity Logs...');
        const [users] = await connection.execute('SELECT user_id FROM users');
        
        // Generate 300 logs
        for (let i = 0; i < 300; i++) {
            const user = getRandomElement(users);
            const action = getRandomElement(logActions);
            const date = getRandomDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()); // Last 90 days
            
            await connection.execute(
                'INSERT INTO activity_logs (user_id, action_type, description, created_at) VALUES (?, ?, ?, ?)',
                [user.user_id, 'User Action', `${action}`, date]
            );
        }
        console.log('Activity logs generated.');

    } catch (err) {
        console.error('Error seeding secondary data:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seedSecondary();
