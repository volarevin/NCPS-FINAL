const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

async function addServiceImageColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        try {
            await connection.execute(`
                ALTER TABLE services 
                ADD COLUMN image VARCHAR(255) NULL AFTER description
            `);
            console.log('Added image column to services table.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('image column already exists in services table.');
            } else {
                console.error('Error adding image column:', e.message);
            }
        }

        // Optional: Update some services with dummy images if they exist in uploads
        // For now we just ensure the column exists so the API doesn't crash.

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addServiceImageColumn();
