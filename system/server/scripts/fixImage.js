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
    // New URL for Server Room (ID 5)
    const url5 = 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; 
    // If that fails, try: https://plus.unsplash.com/premium_photo-1661877737564-96d979d1ccd2?w=800&q=80
    
    const filepath5 = path.join(__dirname, '../uploads/services', '5.jpg');
    
    console.log(`Downloading 5.jpg from ${url5}...`);
    try {
        await downloadImage(url5, filepath5);
        console.log('Successfully downloaded 5.jpg');
        
        // Verify size
        const stats = fs.statSync(filepath5);
        console.log(`Size of 5.jpg: ${stats.size} bytes`);
        
        if (stats.size < 1000) {
            console.log('File too small, trying alternative...');
            const altUrl = 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80';
            await downloadImage(altUrl, filepath5);
            const newStats = fs.statSync(filepath5);
            console.log(`New size of 5.jpg: ${newStats.size} bytes`);
        }

    } catch (error) {
        console.error('Failed to download:', error);
    }
}

run();
