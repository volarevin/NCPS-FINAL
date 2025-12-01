const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

const services = [
    { name: 'CCTV Installation (Basic)', category: 'Installation', price: 1500.00, duration: 120 },
    { name: 'CCTV Installation (Advanced)', category: 'Installation', price: 3000.00, duration: 240 },
    { name: 'Camera Repair', category: 'Repair', price: 800.00, duration: 60 },
    { name: 'System Maintenance', category: 'Maintenance', price: 1200.00, duration: 90 },
    { name: 'DVR/NVR Configuration', category: 'Configuration', price: 1000.00, duration: 60 },
    { name: 'Cabling & Wiring', category: 'Installation', price: 2000.00, duration: 180 },
    { name: 'Remote Viewing Setup', category: 'Configuration', price: 500.00, duration: 45 },
    { name: 'Security Consultation', category: 'Consultation', price: 0.00, duration: 30 }
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Hash password
        const passwordHash = await bcrypt.hash('password123', 10);
        console.log('Password hashed.');

        // 2. Update existing users
        await connection.execute('UPDATE users SET password_hash = ?', [passwordHash]);
        console.log('Updated existing users passwords.');

        // 3. Ensure Service Categories exist
        const categories = [...new Set(services.map(s => s.category))];
        for (const cat of categories) {
            await connection.execute('INSERT IGNORE INTO service_categories (name) VALUES (?)', [cat]);
        }

        // 4. Ensure Services exist
        for (const service of services) {
            // Get category ID
            const [rows] = await connection.execute('SELECT category_id FROM service_categories WHERE name = ?', [service.category]);
            if (rows.length > 0) {
                const catId = rows[0].category_id;
                await connection.execute(
                    'INSERT IGNORE INTO services (category_id, name, estimated_price, duration_minutes) VALUES (?, ?, ?, ?)',
                    [catId, service.name, service.price, service.duration]
                );
            }
        }
        console.log('Services checked/inserted.');

        // 5. Insert Receptionists
        const receptionists = [
            { first: 'Luna', last: 'Marie', email: 'luna.marie@example.com' },
            { first: 'Sarah', last: 'Connor', email: 'sarah.connor@example.com' },
            { first: 'Pam', last: 'Beesly', email: 'pam.beesly@example.com' }
        ];

        for (const r of receptionists) {
            const username = r.first.toLowerCase() + r.last.toLowerCase();
            try {
                await connection.execute(
                    'INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [username, r.first, r.last, r.email, '09' + Math.floor(Math.random() * 1000000000), passwordHash, 'Receptionist', 'Active']
                );
            } catch (e) {
                if (e.code !== 'ER_DUP_ENTRY') console.error('Error inserting receptionist:', e);
            }
        }
        console.log('Receptionists inserted.');

        // 6. Insert Technicians
        const techNames = [
            { first: 'Bob', last: 'Builder' },
            { first: 'Fix', last: 'It' },
            { first: 'Handy', last: 'Manny' },
            { first: 'Tim', last: 'Taylor' },
            { first: 'Al', last: 'Borland' }
        ];

        for (const t of techNames) {
            const username = t.first.toLowerCase() + t.last.toLowerCase();
            const email = `${username}@example.com`;
            try {
                const [res] = await connection.execute(
                    'INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [username, t.first, t.last, email, '09' + Math.floor(Math.random() * 1000000000), passwordHash, 'Technician', 'Active']
                );
                
                // Insert Profile
                await connection.execute(
                    'INSERT INTO technician_profiles (user_id, specialty, availability_status) VALUES (?, ?, ?)',
                    [res.insertId, 'General Installation', 'Available']
                );
            } catch (e) {
                if (e.code !== 'ER_DUP_ENTRY') console.error('Error inserting technician:', e);
            }
        }
        console.log('Technicians inserted.');

        // 7. Insert Customers
        for (let i = 0; i < 20; i++) {
            const first = getRandomElement(firstNames);
            const last = getRandomElement(lastNames);
            const username = `${first.toLowerCase()}${last.toLowerCase()}${i}`;
            const email = `${username}@example.com`;
            
            try {
                await connection.execute(
                    'INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [username, first, last, email, '09' + Math.floor(Math.random() * 1000000000), passwordHash, 'Customer', 'Active']
                );
            } catch (e) {
                // Ignore dupes
            }
        }
        console.log('Customers inserted.');

        // 8. Generate Appointments
        // Get IDs
        const [custRows] = await connection.execute('SELECT user_id FROM users WHERE role = "Customer"');
        const customerIds = custRows.map(r => r.user_id);

        const [techRows] = await connection.execute('SELECT user_id FROM users WHERE role = "Technician"');
        const technicianIds = techRows.map(r => r.user_id);

        const [serviceRows] = await connection.execute('SELECT service_id, estimated_price FROM services');
        const serviceList = serviceRows;

        const cancellationReasons = ['Changed Mind', 'Found Cheaper', 'Emergency', 'Tech Unavailable', 'Other'];
        const statuses = ['Completed', 'Cancelled', 'Pending', 'Confirmed', 'In Progress'];

        // Generate 150 appointments
        for (let i = 0; i < 150; i++) {
            const customerId = getRandomElement(customerIds);
            const service = getRandomElement(serviceList);
            
            // Date distribution: 70% past (last 6 months), 30% future (next 1 month)
            const isPast = Math.random() < 0.7;
            let date;
            if (isPast) {
                const start = new Date();
                start.setMonth(start.getMonth() - 6);
                date = getRandomDate(start, new Date());
            } else {
                const end = new Date();
                end.setMonth(end.getMonth() + 1);
                date = getRandomDate(new Date(), end);
            }

            let status;
            let techId = null;
            let cancelReason = null;
            let cancelCategory = null;
            let paymentStatus = 'Unpaid';

            if (isPast) {
                // Past appointments are mostly Completed or Cancelled
                status = Math.random() < 0.8 ? 'Completed' : 'Cancelled';
                if (status === 'Completed') {
                    techId = getRandomElement(technicianIds);
                    paymentStatus = 'Paid';
                } else {
                    cancelCategory = getRandomElement(cancellationReasons);
                    cancelReason = `Customer reason: ${cancelCategory}`;
                }
            } else {
                // Future appointments
                status = Math.random() < 0.5 ? 'Pending' : 'Confirmed';
                if (status === 'Confirmed') {
                    techId = getRandomElement(technicianIds);
                }
            }

            const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

            await connection.execute(
                `INSERT INTO appointments 
                (customer_id, technician_id, service_id, appointment_date, status, total_cost, cancellation_reason, cancellation_category, payment_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [customerId, techId, service.service_id, formattedDate, status, service.estimated_price, cancelReason, cancelCategory, paymentStatus]
            );
        }
        console.log('Appointments generated.');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
