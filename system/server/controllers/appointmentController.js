const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { checkTechnicianConflict } = require('../utils/conflictChecker');

exports.createAppointment = (req, res) => {
  const { serviceId, date, time, notes, address, saveAddress } = req.body;
  const customerId = req.userId; // From auth middleware

  if (!serviceId || !date || !time || !address) {
    return res.status(400).json({ message: 'Please provide service, date, time, and address.' });
  }

  // Combine date and time into a single DATETIME string
  const appointmentDate = `${date} ${time}:00`;

  // If saveAddress is true, save it to customer_addresses
  if (saveAddress) {
    // Check if address already exists to avoid duplicates (simple check)
    (req.db || db).query('SELECT * FROM customer_addresses WHERE user_id = ? AND address_line = ?', [customerId, address], (err, results) => {
        if (!err && results.length === 0) {
            (req.db || db).query('INSERT INTO customer_addresses (user_id, address_line, address_label) VALUES (?, ?, ?)', 
                [customerId, address, 'Saved Address']);
        }
    });
  }

  const query = `
    INSERT INTO appointments (customer_id, service_id, appointment_date, customer_notes, service_address, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `;

  (req.db || db).query(query, [customerId, serviceId, appointmentDate, notes, address], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error creating appointment.' });
    }
    res.status(201).json({ message: 'Appointment booked successfully.', appointmentId: result.insertId });
  });
};

exports.updateAppointmentStatus = (req, res) => {
  const { id } = req.params;
  const { status, reason, category, technicianId, overrideConflict, totalCost, costNotes } = req.body;
  const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  const proceedWithUpdate = () => {
    let query = 'UPDATE appointments SET status = ?';
    const params = [status];

    if (technicianId) {
      query += ', technician_id = ?';
      params.push(technicianId);
    }

    if (status === 'Completed' && totalCost !== undefined) {
      query += ', total_cost = ?, cost_notes = ?';
      params.push(totalCost, costNotes || null);
    }

    if (status === 'Cancelled' || status === 'Rejected') {
      if (reason) {
        query += ', cancellation_reason = ?';
        params.push(reason);
      }
      if (category) {
        query += ', cancellation_category = ?';
        params.push(category);
      }
      // Also track who cancelled it if we have user info in request (from middleware)
      if (req.userId) {
          query += ', cancelled_by = ?';
          params.push(req.userId);
      }
    }

    query += ' WHERE appointment_id = ?';
    params.push(id);

    (req.db || db).query(query, params, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error updating appointment.' });
      }

      // If status is Completed, handle payment record and notification
      if (status === 'Completed') {
          // Create payment record if cost is provided
          if (totalCost) {
            const paymentQuery = 'INSERT INTO payments (appointment_id, amount, status) VALUES (?, ?, ?)';
            (req.db || db).query(paymentQuery, [id, totalCost, 'Pending'], (payErr) => {
                if (payErr) console.error('Error creating payment record:', payErr);
            });
          }

          // We need to fetch appointment details to get technician_id and service name
          const detailsQuery = `
              SELECT a.technician_id, s.name as service_name, u.first_name, u.last_name 
              FROM appointments a 
              JOIN services s ON a.service_id = s.service_id 
              JOIN users u ON a.customer_id = u.user_id
              WHERE a.appointment_id = ?
          `;
          (req.db || db).query(detailsQuery, [id], (detErr, detResults) => {
              if (!detErr && detResults.length > 0) {
                  const appt = detResults[0];
                  if (appt.technician_id) {
                      const notifQuery = 'INSERT INTO notifications (user_id, title, message, related_appointment_id) VALUES (?, ?, ?, ?)';
                      const message = `You marked "${appt.service_name}" for ${appt.first_name} ${appt.last_name} as completed. Total Cost: ${totalCost || 'N/A'}`;
                      (req.db || db).query(notifQuery, [appt.technician_id, 'Job Completed', message, id], (notifErr) => {
                          if (notifErr) console.error('Error creating completion notification:', notifErr);
                      });
                  }
              }
          });
      }

      // Update Technician Availability Logic
      const getTechQuery = "SELECT technician_id FROM appointments WHERE appointment_id = ?";
      (req.db || db).query(getTechQuery, [id], (err, techRes) => {
          if (!err && techRes.length > 0 && techRes[0].technician_id) {
              const tId = techRes[0].technician_id;
              
              if (status === 'In Progress') {
                  (req.db || db).query("UPDATE technician_profiles SET availability_status = 'busy' WHERE user_id = ?", [tId]);
              } else {
                  // Check if they have OTHER in-progress appointments
                  const checkBusy = "SELECT COUNT(*) as count FROM appointments WHERE technician_id = ? AND status = 'In Progress' AND appointment_id != ?";
                  (req.db || db).query(checkBusy, [tId, id], (busyErr, busyRes) => {
                      if (!busyErr && busyRes[0].count === 0) {
                          // Not busy anymore. Check if online.
                          (req.db || db).query("SELECT is_online FROM users WHERE user_id = ?", [tId], (userErr, userRes) => {
                              if (!userErr && userRes.length > 0) {
                                  const newStatus = userRes[0].is_online ? 'available' : 'offline';
                                  (req.db || db).query("UPDATE technician_profiles SET availability_status = ? WHERE user_id = ?", [newStatus, tId]);
                              }
                          });
                      }
                  });
              }
          }
      });

      res.json({ message: 'Appointment status updated.' });
    });
  };

  if (technicianId && !overrideConflict) {
    const detailsQuery = `
      SELECT a.appointment_date, s.duration_minutes 
      FROM appointments a
      JOIN services s ON a.service_id = s.service_id
      WHERE a.appointment_id = ?
    `;
    (req.db || db).query(detailsQuery, [id], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error fetching details.' });
      if (results.length === 0) return res.status(404).json({ message: 'Appointment not found.' });

      const { appointment_date, duration_minutes } = results[0];
      try {
        const conflict = await checkTechnicianConflict(technicianId, appointment_date, duration_minutes, id);
        if (conflict) {
          return res.status(409).json({
            message: 'Technician has a scheduling conflict.',
            conflict: conflict
          });
        }
        proceedWithUpdate();
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error checking conflicts.' });
      }
    });
  } else {
    proceedWithUpdate();
  }
};

exports.updateAppointment = (req, res) => {
  const { id } = req.params;
  const { serviceId, date, time, notes } = req.body;
  const userId = req.userId;

  // Only allow updating if status is Pending
  const checkQuery = 'SELECT status, customer_id FROM appointments WHERE appointment_id = ?';
  
  (req.db || db).query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error checking appointment.' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = results[0];
    
    if (appointment.customer_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this appointment.' });
    }

    if (appointment.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending appointments can be updated.' });
    }

    const appointmentDate = `${date} ${time}:00`;
    
    const updateQuery = `
      UPDATE appointments 
      SET service_id = ?, appointment_date = ?, customer_notes = ?
      WHERE appointment_id = ?
    `;

    (req.db || db).query(updateQuery, [serviceId, appointmentDate, notes, id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error updating appointment.' });
      }
      res.json({ message: 'Appointment updated successfully.' });
    });
  });
};

exports.rateAppointment = (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.userId;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating (1-5).' });
  }

  // Check appointment validity
  const checkQuery = 'SELECT * FROM appointments WHERE appointment_id = ?';
  (req.db || db).query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appointment = results[0];

    if (appointment.customer_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    if (appointment.status !== 'Completed') {
      return res.status(400).json({ message: 'You can only rate completed appointments.' });
    }

    // Check if already rated
    const checkRatingQuery = 'SELECT * FROM reviews WHERE appointment_id = ?';
    (req.db || db).query(checkRatingQuery, [id], (err, ratingResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }

      if (ratingResults.length > 0) {
        return res.status(400).json({ message: 'You have already rated this appointment.' });
      }

      // Insert review
      const insertQuery = `
        INSERT INTO reviews (appointment_id, customer_id, technician_id, rating, feedback_text)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      (req.db || db).query(insertQuery, [id, userId, appointment.technician_id, rating, feedback], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error saving review.' });
        }

        // Manually update technician rating to ensure it syncs (in case trigger is missing/broken)
        const updateRatingQuery = `
          UPDATE technician_profiles 
          SET average_rating = (SELECT AVG(rating) FROM reviews WHERE technician_id = ?)
          WHERE user_id = ?
        `;

        (req.db || db).query(updateRatingQuery, [appointment.technician_id, appointment.technician_id], (updateErr) => {
          if (updateErr) {
            console.error('Error updating technician rating:', updateErr);
          }

          // Notify Technician about the review
          const notifQuery = 'INSERT INTO notifications (user_id, title, message, related_appointment_id) VALUES (?, ?, ?, ?)';
          const message = `New ${rating}-star rating received from a customer.`;
          (req.db || db).query(notifQuery, [appointment.technician_id, 'New Rating Received', message, id], (notifErr) => {
              if (notifErr) console.error('Error creating review notification:', notifErr);
          });

          res.status(201).json({ message: 'Rating submitted successfully.' });
        });
      });
    });
  });
};

exports.createWalkInAppointment = async (req, res) => {
  const { 
    customerId, 
    newUser, 
    walkinDetails, 
    serviceId, 
    technicianId,
    date, 
    time, 
    address, 
    notes,
    overrideConflict
  } = req.body;

  if (!serviceId || !date || !time || !address) {
    return res.status(400).json({ message: 'Please provide service, date, time, and address.' });
  }

  const appointmentDate = `${date} ${time}:00`;
  const connection = req.db || db;

  // Check conflict before transaction
  if (technicianId && technicianId !== 'unassigned' && !overrideConflict) {
      try {
          const simpleQuery = (sql, args) => {
              return new Promise((resolve, reject) => {
                  (req.db || db).query(sql, args, (err, rows) => {
                      if (err) return reject(err);
                      resolve(rows);
                  });
              });
          };
          
          const serviceRows = await simpleQuery('SELECT duration_minutes FROM services WHERE service_id = ?', [serviceId]);
          if (serviceRows.length > 0) {
              const duration = serviceRows[0].duration_minutes;
              const conflict = await checkTechnicianConflict(technicianId, appointmentDate, duration);
              if (conflict) {
                  return res.status(409).json({
                      message: 'Technician has a scheduling conflict.',
                      conflict: conflict
                  });
              }
          }
      } catch (err) {
          console.error('Conflict check error:', err);
          return res.status(500).json({ message: 'Error checking conflicts.' });
      }
  }

  const runTransaction = async () => {
    const query = (sql, args) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, args, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    };

    try {
      await query('START TRANSACTION', []);

      let finalCustomerId = customerId;

      // 1. Handle New User Creation
      if (newUser) {
        const { firstName, lastName, email, phone } = newUser;
        // Generate username and password
        const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
        const password = Math.random().toString(36).slice(-8) + "1!"; // Simple random password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userResult = await query(
          `INSERT INTO users (username, first_name, last_name, email, phone_number, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Customer', 'Active')`,
          [username, firstName, lastName, email, phone, hashedPassword]
        );
        finalCustomerId = userResult.insertId;
      }

      // 2. Create Appointment
      let insertQuery = '';
      let params = [];

      // Handle "unassigned" string from frontend
      const finalTechnicianId = (technicianId && technicianId !== 'unassigned') ? technicianId : null;

      if (finalCustomerId) {
        insertQuery = `
          INSERT INTO appointments (customer_id, service_id, technician_id, appointment_date, customer_notes, service_address, status, is_walk_in)
          VALUES (?, ?, ?, ?, ?, ?, 'Pending', 1)
        `;
        params = [finalCustomerId, serviceId, finalTechnicianId, appointmentDate, notes, address];
      } else if (walkinDetails) {
        // Guest Walk-in
        insertQuery = `
          INSERT INTO appointments (customer_id, service_id, technician_id, appointment_date, customer_notes, service_address, status, is_walk_in, walkin_name, walkin_phone, walkin_email)
          VALUES (NULL, ?, ?, ?, ?, ?, 'Pending', 1, ?, ?, ?)
        `;
        params = [serviceId, finalTechnicianId, appointmentDate, notes, address, walkinDetails.name, walkinDetails.phone, walkinDetails.email];
      } else {
        throw new Error('No customer information provided.');
      }

      const apptResult = await query(insertQuery, params);

      await query('COMMIT', []);
      
      res.status(201).json({ 
        message: 'Walk-in appointment created successfully.', 
        appointmentId: apptResult.insertId,
        userId: finalCustomerId 
      });

    } catch (error) {
      await query('ROLLBACK', []);
      console.error('Walk-in creation error:', error);
      res.status(500).json({ message: error.message || 'Database error.' });
    }
  };

  runTransaction();
};