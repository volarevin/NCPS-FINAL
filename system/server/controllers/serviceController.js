const db = require('../config/db');

exports.getAllServices = (req, res) => {
  const query = 'SELECT service_id, category_id, name as service_name, description, estimated_price as base_price, price_type, duration_minutes, is_active FROM services ORDER BY name ASC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error fetching services.' });
    }
    res.json(results);
  });
};