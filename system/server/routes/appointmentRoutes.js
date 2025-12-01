const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

// Protect all routes
router.use(verifyToken);
router.use(auditMiddleware);

// Create Appointment (Customer only)
router.post('/', checkRole(['Customer']), appointmentController.createAppointment);

// Create Walk-in Appointment (Admin, Receptionist)
router.post('/walkin', checkRole(['Admin', 'Receptionist']), appointmentController.createWalkInAppointment);

// Update Status (Admin, Technician, Receptionist)
// Note: Customers might need to cancel, but we'll handle that separately or allow 'Cancelled' status update for them later if needed.
router.put('/:id/status', checkRole(['Admin', 'Technician', 'Receptionist', 'Customer']), appointmentController.updateAppointmentStatus);

// Update Appointment Details (Customer only, for Pending appointments)
router.put('/:id', checkRole(['Customer']), appointmentController.updateAppointment);

// Rate Appointment (Customer only)
router.post('/:id/rate', checkRole(['Customer']), appointmentController.rateAppointment);

module.exports = router;