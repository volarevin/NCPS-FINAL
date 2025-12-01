const db = require('../config/db');

exports.getPublicServices = (req, res) => {
  const query = `
    SELECT service_id, name, description, estimated_price, image 
    FROM services 
    WHERE is_active = 1 
    LIMIT 8
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching services.' });
    }
    res.json(results);
  });
};

exports.getTestimonials = (req, res) => {
  const query = `
    SELECT r.rating, r.feedback_text, u.first_name, u.last_name, u.profile_picture, s.name as service_name
    FROM reviews r
    JOIN users u ON r.customer_id = u.user_id
    JOIN appointments a ON r.appointment_id = a.appointment_id
    JOIN services s ON a.service_id = s.service_id
    WHERE r.rating >= 4
    ORDER BY RAND()
    LIMIT 4
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching testimonials.' });
    }
    res.json(results);
  });
};
