const db = require('../config/db');
const bcrypt = require('bcryptjs');

const updatePassword = async (username, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const query = 'UPDATE users SET password_hash = ? WHERE username = ?';
  
  return new Promise((resolve, reject) => {
    db.query(query, [hashedPassword, username], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const main = async () => {
  try {
    console.log('Resetting passwords for default users...');
    
    await updatePassword('sherwin', 'password123');
    console.log('Updated sherwin (Admin)');
    
    await updatePassword('ishi', 'password123');
    console.log('Updated ishi (Receptionist)');
    
    await updatePassword('frank', 'password123');
    console.log('Updated frank (Technician)');

    console.log('All passwords reset to "password123"');
    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
};

main();
