const fs = require('fs');
const https = require('https');
const path = require('path');

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
    // A better image for "Expert Server Maintenance" - Technician working on server rack
    // Unsplash ID: photo-1551703599-6b3e8379aa8c (Technician in data center)
    const url = 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    
    const filepath = path.join(__dirname, '../uploads/services', 'hero-server.jpg');
    
    console.log(`Downloading hero-server.jpg from ${url}...`);
    try {
        await downloadImage(url, filepath);
        console.log('Successfully downloaded hero-server.jpg');
        
        const stats = fs.statSync(filepath);
        console.log(`Size: ${stats.size} bytes`);

    } catch (error) {
        console.error('Failed to download:', error);
    }
}

run();
