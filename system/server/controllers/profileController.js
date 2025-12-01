const db = require('../config/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profile_pics');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'user-' + req.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
}).single('profilePicture');

exports.uploadProfilePicture = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const userId = req.userId;
    const relativePath = '/uploads/profile_pics/' + req.file.filename;

    // Get old profile picture to delete
    db.query('SELECT profile_picture FROM users WHERE user_id = ?', [userId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      
      const oldPath = results[0]?.profile_picture;
      if (oldPath) {
        const absoluteOldPath = path.join(__dirname, '..', oldPath);
        if (fs.existsSync(absoluteOldPath)) {
          fs.unlinkSync(absoluteOldPath);
        }
      }

      // Update DB
      (req.db || db).query('UPDATE users SET profile_picture = ? WHERE user_id = ?', [relativePath, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error updating profile picture' });
        res.json({ message: 'Profile picture updated', profilePicture: relativePath });
      });
    });
  });
};

exports.getProfile = (req, res) => {
  const userId = req.userId;

  const query = `
    SELECT user_id, username, first_name, last_name, email, phone_number, role, profile_picture, created_at 
    FROM users WHERE user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = results[0];

    // Fetch addresses
    const addressQuery = 'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC';
    db.query(addressQuery, [userId], (err, addresses) => {
      if (err) return res.status(500).json({ message: 'Error fetching addresses' });
      
      user.addresses = addresses;
      res.json(user);
    });
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.userId;
  const { username, firstName, lastName, email, phone } = req.body;

  // Check if username exists (if changed)
  (req.db || db).query('SELECT user_id FROM users WHERE username = ? AND user_id != ?', [username, userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) return res.status(400).json({ message: 'Username already taken' });

    const query = `
      UPDATE users SET username = ?, first_name = ?, last_name = ?, email = ?, phone_number = ?
      WHERE user_id = ?
    `;

    (req.db || db).query(query, [username, firstName, lastName, email, phone, userId], (err) => {
      if (err) return res.status(500).json({ message: 'Error updating profile' });
      res.json({ message: 'Profile updated successfully' });
    });
  });
};

exports.getLoginHistory = (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT * FROM login_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;

  db.query(query, [userId, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error fetching login history' });
    }
    
    db.query('SELECT COUNT(*) as total FROM login_history WHERE user_id = ?', [userId], (err, countResult) => {
      if (err) return res.status(500).json({ message: 'Error counting history' });
      
      res.json({
        history: results,
        total: countResult[0].total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit)
      });
    });
  });
};


exports.addAddress = (req, res) => {
  const userId = req.userId;
  const { addressLine, isPrimary } = req.body;

  if (!addressLine) return res.status(400).json({ message: 'Address is required' });

  // Helper to insert
  const insertAddress = (forcePrimary) => {
    const query = 'INSERT INTO user_addresses (user_id, address_line, is_primary) VALUES (?, ?, ?)';
    db.query(query, [userId, addressLine, forcePrimary], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error adding address' });
      res.json({ message: 'Address added successfully', addressId: result.insertId });
    });
  };

  // If setting as primary, unset other primaries first
  if (isPrimary) {
    db.query('UPDATE user_addresses SET is_primary = FALSE WHERE user_id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      insertAddress(true);
    });
  } else {
    // If this is the first address, make it primary automatically
    db.query('SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results[0].count === 0) {
            insertAddress(true);
        } else {
            insertAddress(false);
        }
    });
  }
};

exports.updateAddress = (req, res) => {
  const userId = req.userId;
  const addressId = req.params.id;
  const { addressLine } = req.body;

  const query = 'UPDATE user_addresses SET address_line = ? WHERE address_id = ? AND user_id = ?';
  db.query(query, [addressLine, addressId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error updating address' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address updated successfully' });
  });
};

exports.deleteAddress = (req, res) => {
  const userId = req.userId;
  const addressId = req.params.id;

  db.query('DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?', [addressId, userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting address' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted successfully' });
  });
};

exports.setPrimaryAddress = (req, res) => {
  const userId = req.userId;
  const addressId = req.params.id;

  // Unset all, then set one
  db.query('UPDATE user_addresses SET is_primary = FALSE WHERE user_id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    
    db.query('UPDATE user_addresses SET is_primary = TRUE WHERE address_id = ? AND user_id = ?', [addressId, userId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error setting primary address' });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Address not found' });
      res.json({ message: 'Primary address updated' });
    });
  });
};

exports.changePassword = async (req, res) => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ message: 'Error updating password' });
            res.json({ message: 'Password updated successfully' });
        });
    });
};
