const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

async function checkData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [services] = await connection.execute('SELECT service_id, name, image FROM services');
        console.log('Services:', services);

        const [reviews] = await connection.execute(`
            SELECT r.rating, u.first_name, u.last_name 
            FROM reviews r 
            JOIN users u ON r.customer_id = u.user_id 
            WHERE r.rating = 5
        `);
        console.log('5-Star Reviews:', reviews);

    } catch (error) {
        console.error(error);
    } finally {
        if (connection) await connection.end();
    }
}

checkData();
