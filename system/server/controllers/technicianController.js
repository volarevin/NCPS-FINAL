const db = require('../config/db');

exports.getAssignedJobs = (req, res) => {
  const technicianId = req.userId;
  
  const query = `
    SELECT a.*, u.first_name as customer_first_name, u.last_name as customer_last_name, 
           u.email as customer_email, u.phone_number as customer_phone, u.profile_picture as customer_profile_picture,
           s.name as service_name,
           r.rating, r.feedback_text,
           cb.role as cancelled_by_role, cb.user_id as cancelled_by_id
    FROM appointments a
    JOIN users u ON a.customer_id = u.user_id
    JOIN services s ON a.service_id = s.service_id
    LEFT JOIN reviews r ON a.appointment_id = r.appointment_id
    LEFT JOIN users cb ON a.cancelled_by = cb.user_id
    WHERE a.technician_id = ?
    ORDER BY a.appointment_date ASC
  `;

  db.query(query, [technicianId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching jobs.' });
    }
    res.json(results);
  });
};

exports.getProfile = (req, res) => {
  const userId = req.userId;
  
  const query = `
    SELECT tp.profile_id, tp.specialty, tp.bio, tp.availability_status, tp.average_rating,
           (SELECT COUNT(*) FROM appointments WHERE technician_id = u.user_id AND status = 'Completed') as total_jobs_completed,
           u.first_name, u.last_name, u.email, u.phone_number, u.address, u.created_at, u.profile_picture
    FROM users u
    LEFT JOIN technician_profiles tp ON u.user_id = tp.user_id
    WHERE u.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching profile.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const data = results[0];
    // Provide defaults if profile is missing
    if (!data.specialty) {
        data.specialty = 'General';
        data.availability_status = 'Available';
        data.average_rating = 0;
    }
    
    res.json(data);
  });
};

exports.updateAvailability = (req, res) => {
  const userId = req.userId;
  const { status } = req.body; // 'Available', 'On Job', 'Offline'

  const query = 'UPDATE technician_profiles SET availability_status = ? WHERE user_id = ?';

  (req.db || db).query(query, [status, userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error updating availability.' });
    }
    res.json({ message: 'Availability updated successfully.' });
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.userId;
  const { name, email, phone, specialization, address, bio } = req.body;
  
  // Split name into first and last (simple split)
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const runTransaction = (conn, shouldRelease) => {
      conn.beginTransaction(err => {
        if (err) {
            if (shouldRelease) conn.release();
            return res.status(500).json({ message: 'Database transaction error.' });
        }

        // Update users table
        const userQuery = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, address = ? WHERE user_id = ?';
        conn.query(userQuery, [firstName, lastName, email, phone, address, userId], (err, result) => {
          if (err) {
            return conn.rollback(() => {
              if (shouldRelease) conn.release();
              res.status(500).json({ message: 'Error updating user info.' });
            });
          }

          // Update technician_profiles table
          const techQuery = 'UPDATE technician_profiles SET specialty = ?, bio = ? WHERE user_id = ?';
          conn.query(techQuery, [specialization, bio, userId], (err, result) => {
            if (err) {
              return conn.rollback(() => {
                if (shouldRelease) conn.release();
                res.status(500).json({ message: 'Error updating technician info.' });
              });
            }

            conn.commit(err => {
              if (err) {
                return conn.rollback(() => {
                  if (shouldRelease) conn.release();
                  res.status(500).json({ message: 'Error committing transaction.' });
                });
              }
              if (shouldRelease) conn.release();
              res.json({ message: 'Profile updated successfully.' });
            });
          });
        });
      });
  };

  if (!req.db) {
      db.getConnection((err, conn) => {
          if (err) return res.status(500).json({ message: 'Database connection error.' });
          runTransaction(conn, true);
      });
  } else {
      runTransaction(req.db, false);
  }
};

exports.getNotifications = (req, res) => {
  const technicianId = req.userId;
  
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `;

  db.query(query, [technicianId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching notifications.' });
    }
    
    // Map to frontend format if needed, or just send as is.
    // The frontend expects: id, type, title, message, time, color
    // The DB has: notification_id, title, message, created_at, related_appointment_id
    
    const notifications = results.map(n => {
        let type = 'info';
        let color = 'blue';
        
        if (n.title.includes('Assigned')) { type = 'assignment'; color = 'blue'; }
        else if (n.title.includes('Rating')) { type = 'review'; color = 'yellow'; }
        else if (n.title.includes('Completed')) { type = 'completed'; color = 'green'; }
        
        return {
            id: n.notification_id,
            type: type,
            title: n.title,
            message: n.message,
            time: n.created_at,
            color: color,
            related_appointment_id: n.related_appointment_id
        };
    });

    res.json(notifications);
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
    res.json({ message: 'All notifications cleared successfully.' });
  });
};

exports.getAvailability = (req, res) => {
  const userId = req.params.id || req.userId;
  
  const query = `
    SELECT tp.availability_status, u.is_online, u.last_seen 
    FROM users u 
    LEFT JOIN technician_profiles tp ON u.user_id = tp.user_id 
    WHERE u.user_id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'Technician not found.' });
    
    res.json(results[0]);
  });
};

exports.updateAvailability = (req, res) => {
  const userId = req.userId;
  const { status } = req.body; // 'available' or 'offline'
  
  if (!['available', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status override.' });
  }
  
  // Check if busy
  const checkBusy = "SELECT COUNT(*) as count FROM appointments WHERE technician_id = ? AND status = 'In Progress'";
  db.query(checkBusy, [userId], (err, busyRes) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      
      if (busyRes[0].count > 0) {
          return res.status(409).json({ message: 'Cannot change status while busy with an appointment.' });
      }
      
      db.query("UPDATE technician_profiles SET availability_status = ? WHERE user_id = ?", [status, userId], (updateErr) => {
          if (updateErr) return res.status(500).json({ message: 'Database error updating status.' });
          res.json({ message: 'Status updated.', status });
      });
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