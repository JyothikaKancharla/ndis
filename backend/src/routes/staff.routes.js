const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validateShift = require('../middleware/validateShift');
const validateActiveShift = require('../middleware/validateActiveShift');
const upload = require('../middleware/upload');

/**
 * Dashboard
 */
router.get('/dashboard', authenticate, authorize('staff', 'supervisor'), staffController.getDashboard);
router.get('/:staffId/shifts/overview', authenticate, authorize('staff', 'supervisor'), staffController.getShiftsOverview);

/**
 * Notes Management
 */
router.get('/notes', authenticate, authorize('staff', 'supervisor'), staffController.getStaffNotes);
router.post('/notes', authenticate, authorize('staff', 'supervisor'), validateShift, staffController.createNote);
router.put('/notes/:noteId', authenticate, authorize('staff', 'supervisor'), validateShift, staffController.updateNote);
router.put('/notes/:noteId/lock', authenticate, authorize('staff', 'supervisor'), staffController.lockNote);

/**
 * Clients - Notes per client
 */
router.get('/clients/:clientId/notes', authenticate, authorize('staff', 'supervisor'), staffController.getClientNotes);
router.post('/clients/:clientId/notes', authenticate, authorize('staff', 'supervisor'), validateActiveShift, staffController.createClientNote);
router.post('/clients/:clientId/notes/confirm-review', authenticate, authorize('staff', 'supervisor'), staffController.confirmReviewNotes);
router.post('/clients/:clientId/notes/lock-and-send', authenticate, authorize('staff', 'supervisor'), staffController.lockAndSendNotes);
router.put('/clients/:clientId/notes/:noteId', authenticate, authorize('staff', 'supervisor'), staffController.updateNote);
router.post('/clients/:clientId/notes/:noteId/mark-consolidated', authenticate, authorize('staff', 'supervisor'), staffController.markNoteAsConsolidated);
router.post('/clients/:clientId/notes/:noteId/unlock', authenticate, authorize('supervisor'), staffController.unlockNote);
router.delete('/notes/:noteId', authenticate, authorize('staff', 'supervisor'), staffController.deleteNote);

/**
 * File Uploads
 */
router.post('/clients/:clientId/files', authenticate, authorize('staff', 'supervisor'), validateActiveShift, upload.array('files', 5), staffController.uploadFiles);
router.get('/clients/:clientId/files', authenticate, authorize('staff', 'supervisor'), staffController.getClientFiles);
router.delete('/clients/:clientId/files/:fileId', authenticate, authorize('staff', 'supervisor'), staffController.deleteFile);

/**
 * Clients
 */
router.get('/clients', authenticate, authorize('staff', 'supervisor'), staffController.getAssignedClients);
router.get('/clients/:clientId/assignment', authenticate, authorize('staff', 'supervisor'), staffController.getClientAssignment);
router.put('/clients/:clientId/odometer', authenticate, authorize('staff', 'supervisor'), staffController.updateOdometer);

/**
 * Assignments
 */
router.get('/assignments', authenticate, authorize('staff', 'supervisor'), staffController.getAssignments);

/**
 * Travel/Trips
 */
router.get('/trips', authenticate, authorize('staff', 'supervisor'), staffController.getTrips);
router.post('/trips', authenticate, authorize('staff', 'supervisor'), staffController.createTrip);

/**
 * Appointments
 */
router.get('/appointments', authenticate, authorize('staff'), staffController.getMyAppointments);
router.put('/appointments/:id/complete', authenticate, authorize('staff'), staffController.completeAppointment);

module.exports = router;
