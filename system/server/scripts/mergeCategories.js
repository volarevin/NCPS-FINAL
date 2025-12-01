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
        // 1. Ensure "Others" category exists
        const [othersResult] = await db.promise().query('SELECT category_id FROM service_categories WHERE name = "Others"');
        let othersId;

        if (othersResult.length === 0) {
            const [createResult] = await db.promise().query('INSERT INTO service_categories (name) VALUES ("Others")');
            othersId = createResult.insertId;
            console.log('Created "Others" category with ID:', othersId);
        } else {
            othersId = othersResult[0].category_id;
            console.log('"Others" category exists with ID:', othersId);
        }

        // 2. Get IDs for "Consultation" and "Configuration"
        const [oldCats] = await db.promise().query('SELECT category_id, name FROM service_categories WHERE name IN ("Consultation", "Configuration")');
        
        if (oldCats.length === 0) {
            console.log('No "Consultation" or "Configuration" categories found.');
        } else {
            const oldIds = oldCats.map(c => c.category_id);
            console.log('Found old categories:', oldCats.map(c => `${c.name} (${c.category_id})`).join(', '));

            // 3. Update services to point to "Others"
            const [updateResult] = await db.promise().query(`UPDATE services SET category_id = ? WHERE category_id IN (${oldIds.join(',')})`, [othersId]);
            console.log(`Updated ${updateResult.changedRows} services to "Others" category.`);

            // 4. Delete old categories
            // Note: This might fail if there are other foreign key constraints, but usually services is the main one.
            // If appointments link to services, we are fine. If appointments link to categories directly, we might have issues, but schema suggests appointments -> services.
            try {
                await db.promise().query(`DELETE FROM service_categories WHERE category_id IN (${oldIds.join(',')})`);
                console.log('Deleted old categories.');
            } catch (delErr) {
                console.warn('Could not delete old categories (might be referenced elsewhere):', delErr.message);
            }
        }

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        db.end();
        process.exit();
    }
});
