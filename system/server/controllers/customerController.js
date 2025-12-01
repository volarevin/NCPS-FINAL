const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getNotifications = (req, res) => {
  const userId = req.userId;
  const query = `
    SELECT n.*, s.name as service_name, a.appointment_date
    FROM notifications n
    LEFT JOIN appointments a ON n.related_appointment_id = a.appointment_id
    LEFT JOIN services s ON a.service_id = s.service_id
    WHERE n.user_id = ? 
    ORDER BY n.created_at DESC 
    LIMIT 10
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching notifications.' });
    }
    res.json(results);
  });
};

exports.deleteNotification = (req, res) => {
  const userId = req.userId;
  const notificationId = req.params.id;
  
  const query = 'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?';
  
  db.query(query, [notificationId, userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error deleting notification.' });
    }
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Notification not found or not authorized.' });
    }
    res.json({ message: 'Notification deleted successfully.' });
  });
};

exports.clearAllNotifications = (req, res) => {
  const userId = req.userId;
  
  const query = 'DELETE FROM notifications WHERE user_id = ?';
  
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error clearing notifications.' });
    }
    res.json({ message: 'All notifications cleared successfully.' });
  });
};

exports.getDashboardStats = (req, res) => {
  const userId = req.userId;
  const query = 'CALL sp_get_customer_stats(?)';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching stats.' });
    }
    res.json(results[0][0]);
  });
};

exports.getAppointments = (req, res) => {
  const userId = req.userId;
  const query = `
    SELECT a.*, s.name as service_name, u.first_name as tech_first_name, u.last_name as tech_last_name, u.phone_number as tech_phone, u.email as tech_email, u.profile_picture as tech_profile_picture,
           r.rating, r.feedback_text
    FROM appointments a
    JOIN services s ON a.service_id = s.service_id
    LEFT JOIN users u ON a.technician_id = u.user_id
    LEFT JOIN reviews r ON a.appointment_id = r.appointment_id
    WHERE a.customer_id = ?
    ORDER BY a.appointment_date DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching appointments.' });
    }
    res.json(results);
  });
};

exports.getAddresses = (req, res) => {
  const userId = req.userId;
  const query = 'SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching addresses.' });
    }
    res.json(results);
  });
};

exports.addAddress = (req, res) => {
  const userId = req.userId;
  const { address, label, isDefault } = req.body;

  if (!address) {
    return res.status(400).json({ message: 'Address is required.' });
  }

  // If setting as default, unset other defaults first
  if (isDefault) {
    (req.db || db).query('UPDATE customer_addresses SET is_default = 0 WHERE user_id = ?', [userId], (err) => {
      if (err) console.error('Error resetting default addresses:', err);
    });
  }

  const query = 'INSERT INTO customer_addresses (user_id, address_line, address_label, is_default) VALUES (?, ?, ?, ?)';
  (req.db || db).query(query, [userId, address, label || 'Home', isDefault ? 1 : 0], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error adding address.' });
    }
    res.status(201).json({ message: 'Address added successfully.', addressId: result.insertId });
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.userId;
  const { firstName, lastName, email, phone, address } = req.body;

  const query = `
    UPDATE users 
    SET first_name = ?, last_name = ?, email = ?, phone_number = ?, address = ?
    WHERE user_id = ?
  `;

  (req.db || db).query(query, [firstName, lastName, email, phone, address, userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error updating profile.' });
    }
    res.json({ message: 'Profile updated successfully.' });
  });
};

exports.changePassword = (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords.' });
  }

  // Get current password hash
  const query = 'SELECT password_hash FROM users WHERE user_id = ?';
  (req.db || db).query(query, [userId], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const updateQuery = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
    (req.db || db).query(updateQuery, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error updating password.' });
      }
      res.json({ message: 'Password updated successfully.' });
    });
  });
};

exports.deleteAccount = (req, res) => {
  const userId = req.userId;

  // Check for active appointments first to give a better error message
  const checkQuery = "SELECT COUNT(*) as count FROM appointments WHERE customer_id = ? AND status IN ('Pending', 'Confirmed', 'In Progress')";
  (req.db || db).query(checkQuery, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results[0].count > 0) {
      return res.status(400).json({ message: 'Cannot delete account with active appointments. Please cancel them first.' });
    }

    // Proceed with deletion (this might still fail if there are other FK constraints like completed appointments)
    // If we want to allow deletion even with history, we might need to anonymize or cascade delete.
    // For now, let's try to delete and catch the error.
    const deleteQuery = 'DELETE FROM users WHERE user_id = ?';
    (req.db || db).query(deleteQuery, [userId], (err, result) => {
      if (err) {
        console.error(err);
        // Check for foreign key constraint error
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: 'Cannot delete account because it has related records (e.g. past appointments). Please contact support.' });
        }
        return res.status(500).json({ message: 'Database error deleting account.' });
      }
      res.json({ message: 'Account deleted successfully.' });
    });
  });
};

exports.getProfile = (req, res) => {
  const userId = req.userId;
  const query = 'SELECT first_name, last_name, email, phone_number, address FROM users WHERE user_id = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching profile.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(results[0]);
  });
};

exports.getFeaturedServices = (req, res) => {
  // Join with service_categories to get icon and category name
  const query = `
    SELECT s.service_id, s.category_id, s.name as service_name, s.description, s.estimated_price as base_price, s.price_type, s.duration_minutes, s.is_active, sc.name as category_name, sc.icon as category_icon, sc.color as category_color 
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.category_id
    LIMIT 5
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching featured services.' });
    }
    
    // Add mock ratings for display purposes since we don't have a ratings table yet
    const servicesWithRatings = results.map(service => ({
      ...service,
      rating: (4 + Math.random()).toFixed(1), // Random rating between 4.0 and 5.0
      reviewCount: Math.floor(Math.random() * 100) + 10
    }));

    res.json(servicesWithRatings);
  });
};

exports.getAllServices = (req, res) => {
  const query = `
    SELECT s.service_id, s.category_id, s.name as service_name, s.description, s.estimated_price as base_price, s.price_type, s.duration_minutes, s.is_active, sc.name as category_name, sc.icon as category_icon, sc.color as category_color 
    FROM services s
    LEFT JOIN service_categories sc ON s.category_id = sc.category_id
    ORDER BY sc.name, s.name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching services.' });
    }
    
    const servicesWithRatings = results.map(service => ({
      ...service,
      rating: (4 + Math.random()).toFixed(1),
      reviewCount: Math.floor(Math.random() * 100) + 10
    }));

    res.json(servicesWithRatings);
  });
};