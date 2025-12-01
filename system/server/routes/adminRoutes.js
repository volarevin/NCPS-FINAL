const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');

// Protect all routes
router.use(verifyToken);
router.use(checkRole(['Admin']));
router.use(auditMiddleware);

router.get('/stats', adminController.getDashboardStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/export', adminController.exportAuditLogs);
router.get('/users', adminController.getAllUsers);
router.get('/appointments', adminController.getAllAppointments);
router.get('/monthly-stats', adminController.getMonthlyStats);
router.get('/service-distribution', adminController.getServiceDistribution);
router.get('/recent-activity', adminController.getRecentActivity);
router.get('/technicians', adminController.getAllTechnicians);
router.get('/users/:userId/logs', adminController.getUserActivityLogs);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/users/:id/notifications', adminController.clearUserNotifications);
router.delete('/notifications', adminController.clearAllSystemNotifications);

router.get('/reports', adminController.getReportsData);

router.get('/services', adminController.getAllServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

router.get('/categories', adminController.getAllCategories);
router.put('/categories/:id', adminController.updateCategory);

router.get('/technicians/:techId', adminController.getTechnicianDetails);
router.put('/technicians/:techId/profile', adminController.updateTechnicianProfile);
router.put('/technicians/:techId/status', adminController.updateTechnicianStatus);

router.get('/appointments/recycle-bin/count', adminController.getRecycleBinCount);
router.delete('/appointments/recycle-bin', adminController.emptyRecycleBin);
router.get('/appointments/marked-deletion', adminController.getMarkedForDeletion);
router.post('/appointments/bulk-delete', adminController.bulkDeleteAppointments); // Add this line

router.post('/appointments/check-conflict', adminController.checkConflict);
router.get('/appointments/:id', adminController.getAppointmentDetails); // Add this line
router.put('/appointments/:id/status', adminController.updateAppointmentStatus);
router.put('/appointments/:id/details', adminController.updateAppointmentDetails);
router.post('/appointments', adminController.createAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment); // Soft delete
router.post('/appointments/:id/restore', adminController.restoreAppointment);
router.delete('/appointments/:id/permanent', adminController.permanentDeleteAppointment);
router.post('/technicians/promote', adminController.promoteToTechnician);

module.exports = router;