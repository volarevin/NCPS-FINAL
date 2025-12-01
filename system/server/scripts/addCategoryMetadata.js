const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db'
});

db.connect(async (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    try {
        // Add color and icon columns to service_categories if they don't exist
        await db.promise().query(`
            ALTER TABLE service_categories 
            ADD COLUMN color VARCHAR(20) DEFAULT '#9CA3AF',
            ADD COLUMN icon VARCHAR(50) DEFAULT 'Menu'
        `);
        console.log('Added color and icon columns to service_categories.');

        // Update default values for known categories
        const updates = [
            { name: 'Installation', color: '#5B8FFF', icon: 'Settings' },
            { name: 'Repair', color: '#FF9B66', icon: 'Wrench' },
            { name: 'Upgrade & Maintenance', color: '#4ADE80', icon: 'Sparkles' },
            { name: 'Others', color: '#9CA3AF', icon: 'Box' }
        ];

        for (const update of updates) {
            await db.promise().query(
                'UPDATE service_categories SET color = ?, icon = ? WHERE name = ?',
                [update.color, update.icon, update.name]
            );
            console.log(`Updated metadata for category: ${update.name}`);
        }

    } catch (error) {
        // Ignore "Duplicate column name" error
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping ALTER TABLE.');
            
            // Still try to update values just in case
             const updates = [
                { name: 'Installation', color: '#5B8FFF', icon: 'Settings' },
                { name: 'Repair', color: '#FF9B66', icon: 'Wrench' },
                { name: 'Upgrade & Maintenance', color: '#4ADE80', icon: 'Sparkles' },
                { name: 'Others', color: '#9CA3AF', icon: 'Box' }
            ];

            for (const update of updates) {
                await db.promise().query(
                    'UPDATE service_categories SET color = ?, icon = ? WHERE name = ?',
                    [update.color, update.icon, update.name]
                );
                console.log(`Updated metadata for category: ${update.name}`);
            }

        } else {
            console.error('Error during migration:', error);
        }
    } finally {
        db.end();
        process.exit();
    }
});
