const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logLogin } = require('../utils/auditHelper');

exports.register = async (req, res) => {
  const { username, firstName, lastName, email, phone, password, role } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';
    db.query(checkUserQuery, [email, username], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error checking user.' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'User with this email or username already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const insertUserQuery = `
        INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Default role to Customer if not provided or invalid
      const userRole = ['Admin', 'Receptionist', 'Technician', 'Customer'].includes(role) ? role : 'Customer';

      db.query(insertUserQuery, [username, firstName, lastName, email, phone || '', hashedPassword, userRole], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error registering user.' });
        }

        res.status(201).json({ message: 'User registered successfully.' });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.login = (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password.' });
  }

  const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
  db.query(query, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results.length === 0) {
      // Log failed attempt (if we can find user by email, we log it, but here we don't have user ID yet easily unless we query by email first)
      // For security, maybe we don't log user_id if user not found, or we log '0' or similar.
      // But wait, if user not found, we can't log user_id.
      // Let's skip logging for non-existent users to avoid spam, or log with user_id=null if table allows.
      // My table says user_id NOT NULL. So skip.
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = results[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logLogin(user.user_id, false, 'Invalid password', req);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create JWT Token
    const payload = {
      id: user.user_id,
      role: user.role,
      username: user.username
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    logLogin(user.user_id, true, null, req);

    // Update presence
    db.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE user_id = ?', [user.user_id]);
    
    // If technician, update availability to 'available' if not 'busy'
    if (user.role === 'Technician') {
       // Check if busy (has in-progress appointment)
       const checkBusy = "SELECT COUNT(*) as count FROM appointments WHERE technician_id = ? AND status = 'In Progress'";
       db.query(checkBusy, [user.user_id], (err, busyRes) => {
          if (!err && busyRes[0].count === 0) {
             db.query("UPDATE technician_profiles SET availability_status = 'available' WHERE user_id = ? AND availability_status != 'busy'", [user.user_id]);
          }
       });
    }

    res.json({
      token,
      user: {
        id: user.user_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  });
};

exports.logout = (req, res) => {
  const userId = req.userId;
  if (userId) {
    db.query('UPDATE users SET is_online = 0, last_seen = NOW() WHERE user_id = ?', [userId]);
    
    // If technician, set to offline (unless busy? No, if logged out, they are offline regardless of busy status usually, but "busy" implies working. 
    // However, "offline" means not reachable on the system. 
    // The prompt says: "offline: is_online=0". So we set to offline.
    // But wait, "busy: technician has any appointment with status='In Progress'".
    // If they have an in-progress appointment but log out, are they busy or offline?
    // Prompt: "busy: technician has any appointment with status='In Progress'".
    // "offline: is_online=0".
    // These rules conflict if both are true.
    // Usually "In Progress" means they are physically working, so they might be "Busy" even if the system session ends.
    // But "Offline" implies they can't receive new requests.
    // Let's follow the prompt's view logic: "busy: technician has any appointment... available: is_online=1 AND no in-progress... offline: is_online=0".
    // So if is_online=0, they are offline.
    // So we just update users table. The view/logic will handle the rest.
    // But we also have `technician_profiles.availability_status` column. We should update it to keep it in sync for simple queries.
    
    db.query("UPDATE technician_profiles SET availability_status = 'offline' WHERE user_id = ?", [userId]);
  }
  res.json({ message: 'Logged out successfully.' });
};

exports.heartbeat = (req, res) => {
  const userId = req.userId;
  db.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE user_id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    // Also ensure technician is 'available' if they were 'offline' but now sending heartbeat, AND not busy
    // This auto-recovers status if they come back online
    if (req.userRole === 'Technician') {
        const checkBusy = "SELECT COUNT(*) as count FROM appointments WHERE technician_id = ? AND status = 'In Progress'";
        db.query(checkBusy, [userId], (err, busyRes) => {
            if (!err && busyRes[0].count === 0) {
                // Only update if currently offline or null, don't overwrite 'busy'
                db.query("UPDATE technician_profiles SET availability_status = 'available' WHERE user_id = ? AND availability_status = 'offline'", [userId]);
            }
        });
    }
    
    res.json({ status: 'ok' });
  });
};
