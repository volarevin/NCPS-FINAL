const db = require('../config/db');

/**
 * Checks for scheduling conflicts for a technician.
 * @param {number} technicianId - The ID of the technician.
 * @param {string} appointmentDate - The start date/time of the new appointment (ISO string or MySQL format).
 * @param {number} durationMinutes - The duration of the new appointment in minutes.
 * @param {number|null} excludeAppointmentId - ID of the appointment to exclude (for updates).
 * @returns {Promise<Object>} - Returns an object with conflict details or null if no conflict.
 */
const checkTechnicianConflict = (technicianId, appointmentDate, durationMinutes, excludeAppointmentId = null) => {
  return new Promise((resolve, reject) => {
    if (!technicianId) return resolve(null);

    const newStart = new Date(appointmentDate);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);
    
    // Format for MySQL
    const format = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
    const newStartStr = format(newStart);
    const newEndStr = format(newEnd);

    const query = `
      SELECT a.appointment_id, a.appointment_date, s.duration_minutes, s.name as service_name, 
             u.first_name, u.last_name
      FROM appointments a
      JOIN services s ON a.service_id = s.service_id
      LEFT JOIN users u ON a.customer_id = u.user_id
      WHERE a.technician_id = ?
        AND a.status IN ('Pending', 'Confirmed', 'In Progress')
        ${excludeAppointmentId ? 'AND a.appointment_id != ?' : ''}
        AND (
          a.appointment_date < ? AND 
          DATE_ADD(a.appointment_date, INTERVAL s.duration_minutes MINUTE) > ?
        )
    `;

    const params = [technicianId];
    if (excludeAppointmentId) params.push(excludeAppointmentId);
    params.push(newEndStr, newStartStr);

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      
      if (results.length > 0) {
        const conflict = results[0];
        const conflictStart = new Date(conflict.appointment_date);
        const conflictEnd = new Date(conflictStart.getTime() + conflict.duration_minutes * 60000);
        
        resolve({
          conflict: true,
          details: {
            appointmentId: conflict.appointment_id,
            serviceName: conflict.service_name,
            customerName: conflict.first_name ? `${conflict.first_name} ${conflict.last_name}` : 'Walk-in/Guest',
            startTime: conflictStart,
            endTime: conflictEnd
          }
        });
      } else {
        resolve(null);
      }
    });
  });
};

module.exports = checkTechnicianConflict;
