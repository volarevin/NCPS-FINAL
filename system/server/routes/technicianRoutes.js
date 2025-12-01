const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

// Protect all routes
router.use(verifyToken);
router.use(checkRole(['Technician']));
router.use(auditMiddleware);

router.get('/jobs', technicianController.getAssignedJobs);
router.get('/profile', technicianController.getProfile);
router.put('/profile', technicianController.updateProfile);
router.get('/availability', technicianController.getAvailability);
router.put('/availability', technicianController.updateAvailability);
router.get('/notifications', technicianController.getNotifications);
router.delete('/notifications/:id', technicianController.deleteNotification);
router.delete('/notifications', technicianController.clearAllNotifications);

module.exports = router;