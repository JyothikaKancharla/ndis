const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisor.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * Dashboard & Stats
 */
router.get('/dashboard/overview', authenticate, authorize('supervisor'), supervisorController.getDashboardOverview);
router.get('/dashboard', authenticate, authorize('supervisor'), supervisorController.getDashboardStats);

/**
 * Notes Management
 */
router.get('/notes', authenticate, authorize('supervisor'), supervisorController.getNotes);
router.get('/notes/:noteId', authenticate, authorize('supervisor'), supervisorController.getNoteById);
router.put('/notes/:noteId/verify', authenticate, authorize('supervisor'), supervisorController.verifyNote);
router.put('/notes/:noteId/reject', authenticate, authorize('supervisor'), supervisorController.rejectNote);
router.put('/notes/:noteId/unlock', authenticate, authorize('supervisor'), supervisorController.unlockNote);
router.delete('/notes/:noteId', authenticate, authorize('supervisor'), supervisorController.deleteNote);

/**
 * Assignments
 */
router.get('/assignments', authenticate, authorize('supervisor'), supervisorController.getAssignments);
router.post('/assignments', authenticate, authorize('supervisor'), supervisorController.createAssignment);
router.put('/assignments/:assignmentId', authenticate, authorize('supervisor'), supervisorController.updateAssignment);
router.delete('/assignments/:assignmentId', authenticate, authorize('supervisor'), supervisorController.deleteAssignment);

/**
 * Clients
 */
router.get('/clients', authenticate, authorize('supervisor'), supervisorController.getClients);

/**
 * Travel/Trips
 */
router.get('/trips', authenticate, authorize('supervisor'), supervisorController.getTrips);
router.put('/trips/:tripId/verify', authenticate, authorize('supervisor'), supervisorController.verifyTrip);
router.put('/trips/:tripId/reject', authenticate, authorize('supervisor'), supervisorController.rejectTrip);
router.get('/travel/stats', authenticate, authorize('supervisor'), supervisorController.getTravelStats);

/**
 * Staff
 */
router.get('/staff', authenticate, authorize('supervisor'), supervisorController.getStaff);

/**
 * Appointments
 */
router.post('/appointments', authenticate, authorize('supervisor'), supervisorController.createAppointment);
router.get('/appointments', authenticate, authorize('supervisor'), supervisorController.getAppointments);
router.put('/appointments/:id', authenticate, authorize('supervisor'), supervisorController.updateAppointment);
router.put('/appointments/:id/cancel', authenticate, authorize('supervisor'), supervisorController.cancelAppointment);

module.exports = router;
