const db = require('../config/db');

const addProfilePictureColumn = async () => {
  try {
    const query = `
      ALTER TABLE users
      ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL AFTER role;
    `;
    
    db.query(query, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('Column profile_picture already exists.');
        } else {
          console.error('Error adding column:', err);
        }
      } else {
        console.log('Successfully added profile_picture column to users table.');
      }
      process.exit();
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addProfilePictureColumn();
