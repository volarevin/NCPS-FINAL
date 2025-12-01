const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

async function updateServiceImages() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const updates = [
            { id: 1, image: '1.jpg' },
            { id: 2, image: '2.jpg' },
            { id: 3, image: '3.jpg' },
            { id: 4, image: '4.jpg' }
        ];

        for (const update of updates) {
            await connection.execute(
                'UPDATE services SET image = ? WHERE service_id = ?',
                [update.image, update.id]
            );
            console.log(`Updated service ${update.id} with image ${update.image}`);
        }

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateServiceImages();
