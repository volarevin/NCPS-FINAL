const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Add cancelled_by column
        try {
            await connection.execute(`
                ALTER TABLE appointments 
                ADD COLUMN cancelled_by INT NULL,
                ADD CONSTRAINT fk_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(user_id)
            `);
            console.log('Added cancelled_by column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('cancelled_by column already exists.');
            else console.error('Error adding cancelled_by:', e.message);
        }

        // 2. Add deletion columns
        try {
            await connection.execute(`
                ALTER TABLE appointments 
                ADD COLUMN marked_for_deletion BOOLEAN DEFAULT FALSE,
                ADD COLUMN deletion_marked_at DATETIME NULL,
                ADD COLUMN deletion_marked_by INT NULL,
                ADD CONSTRAINT fk_deletion_marked_by FOREIGN KEY (deletion_marked_by) REFERENCES users(user_id)
            `);
            console.log('Added deletion columns.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('Deletion columns already exist.');
            else console.error('Error adding deletion columns:', e.message);
        }

    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();