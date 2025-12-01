const db = require('../config/db');

const checkAndFixTechnicianProfile = async () => {
  // 1. Get Frank's ID
  const getUserQuery = "SELECT user_id FROM users WHERE username = 'frank'";
  
  db.query(getUserQuery, (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      process.exit(1);
    }
    
    if (results.length === 0) {
      console.error('User frank not found');
      process.exit(1);
    }

    const userId = results[0].user_id;
    console.log(`Found frank with ID: ${userId}`);

    // 2. Check if profile exists
    const checkProfileQuery = "SELECT * FROM technician_profiles WHERE user_id = ?";
    db.query(checkProfileQuery, [userId], (err, profiles) => {
      if (err) {
        console.error('Error checking profile:', err);
        process.exit(1);
      }

      if (profiles.length > 0) {
        console.log('Technician profile already exists.');
        process.exit(0);
      }

      console.log('Profile missing. Creating default technician profile...');

      // 3. Create profile
      const insertProfileQuery = `
        INSERT INTO technician_profiles (user_id, specialty, availability_status, average_rating, total_jobs_completed)
        VALUES (?, 'General Technician', 'Available', 5.0, 0)
      `;

      db.query(insertProfileQuery, [userId], (err, result) => {
        if (err) {
          console.error('Error creating profile:', err);
          process.exit(1);
        }
        console.log('Technician profile created successfully!');
        process.exit(0);
      });
    });
  });
};

checkAndFixTechnicianProfile();
