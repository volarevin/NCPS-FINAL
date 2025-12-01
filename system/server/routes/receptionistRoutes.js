const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

// Protect all routes
router.use(verifyToken);
router.use(checkRole(['Receptionist', 'Admin']));
router.use(auditMiddleware);

router.get('/dashboard-stats', receptionistController.getDashboardStats);
router.get('/appointments', receptionistController.getAllAppointments);
router.post('/appointments/check-conflict', receptionistController.checkConflict);
router.post('/appointments', receptionistController.createAppointment);
router.put('/appointments/:id/status', receptionistController.updateAppointmentStatus);
router.put('/appointments/:id/details', receptionistController.updateAppointmentDetails);
router.delete('/appointments/:id/soft', receptionistController.softDeleteAppointment);
router.get('/appointments/marked-deletion', receptionistController.getDeletedAppointments);
router.post('/appointments/:id/restore', receptionistController.restoreAppointment);
router.delete('/appointments/:id/permanent', receptionistController.permanentDeleteAppointment);
router.delete('/appointments/recycle-bin', receptionistController.emptyRecycleBin);
router.get('/services', receptionistController.getServices);
router.get('/technicians', receptionistController.getTechnicians);
router.get('/categories', receptionistController.getAllCategories);

router.get('/users', receptionistController.searchUsers);

module.exports = router;
