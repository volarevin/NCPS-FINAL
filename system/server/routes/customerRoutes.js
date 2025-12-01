const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

// Protect all routes
router.use(verifyToken);
router.use(checkRole(['Customer']));
router.use(auditMiddleware);

router.get('/stats', customerController.getDashboardStats);
router.get('/notifications', customerController.getNotifications);
router.delete('/notifications/:id', customerController.deleteNotification);
router.delete('/notifications', customerController.clearAllNotifications);
router.get('/appointments', customerController.getAppointments);
router.get('/addresses', customerController.getAddresses);
router.post('/addresses', customerController.addAddress);
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/change-password', customerController.changePassword);
router.delete('/account', customerController.deleteAccount);
router.get('/featured-services', customerController.getFeaturedServices);
router.get('/services', customerController.getAllServices);

module.exports = router;