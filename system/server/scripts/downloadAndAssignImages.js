const fs = require('fs');
const https = require('https');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncps_db',
};

const imagesToDownload = [
    { id: 5, keyword: 'server-room', filename: '5.jpg' },
    { id: 6, keyword: 'ethernet-cable', filename: '6.jpg' },
    { id: 7, keyword: 'mobile-phone-security', filename: '7.jpg' },
    { id: 8, keyword: 'business-meeting', filename: '8.jpg' }
];

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            const stream = fs.createWriteStream(filepath);
            res.pipe(stream);
            stream.on('finish', () => {
                stream.close();
                resolve();
            });
            stream.on('error', reject);
        }).on('error', reject);
    });
};

async function run() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        for (const item of imagesToDownload) {
            const url = `https://source.unsplash.com/800x600/?${item.keyword}`;
            // Note: source.unsplash.com is deprecated/unreliable recently, let's use images.unsplash.com with specific IDs if possible, 
            // or a different placeholder service if this fails. 
            // Actually, let's try a direct reliable placeholder service that looks real or just generic tech images.
            // Better yet, let's use specific reliable URLs from Pexels or similar if I can't search.
            // Since I can't browse, I will use a reliable random image service or just try unsplash source and hope.
            // Alternative: Use specific IDs from Unsplash to ensure quality.
            
            let specificUrl = '';
            switch(item.id) {
                case 5: specificUrl = 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?w=800&q=80'; break; // Server
                case 6: specificUrl = 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'; break; // Cables
                case 7: specificUrl = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80'; break; // Mobile/Remote
                case 8: specificUrl = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80'; break; // Meeting
            }

            const filepath = path.join(__dirname, '../uploads/services', item.filename);
            console.log(`Downloading ${specificUrl} to ${filepath}...`);
            
            await downloadImage(specificUrl, filepath);
            
            await connection.execute(
                'UPDATE services SET image = ? WHERE service_id = ?',
                [item.filename, item.id]
            );
            console.log(`Updated service ${item.id}`);
        }

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
