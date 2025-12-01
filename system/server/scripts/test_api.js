// const fetch = require('node-fetch'); // Not available in this env, use built-in fetch if Node 18+ or https module

async function testApi() {
    try {
        // 1. Login as Receptionist
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'ishi@gmail.com', password: 'password123' })
        });
        
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }
        
        const token = loginData.token;
        console.log('Logged in as Receptionist. Token obtained.');

        // 2. Fetch Appointments
        const res = await fetch('http://localhost:5000/api/receptionist/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error('Fetch failed:', res.status, res.statusText);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }

        const data = await res.json();
        console.log('Fetch successful. Count:', data.length);
        if (data.length > 0) {
            console.log('First appointment sample:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No appointments found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();