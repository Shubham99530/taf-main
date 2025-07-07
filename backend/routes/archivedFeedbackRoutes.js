// In your routes file (e.g., archivedFeedbackRoutes.js)
const express = require('express');
const { 
  getArchivedFeedback, 
  getArchivedFeedbackStatus,
  downloadArchivedFeedback,
  getUniqueSemesters  // new function
} = require('../controllers/archivedFeedbackController');

const router = express.Router();

router.get('/archived-feedback', getArchivedFeedback);
router.get('/archived-feedback/status', getArchivedFeedbackStatus); 
router.get('/archived-feedback/download', downloadArchivedFeedback);
// New endpoint for semesters
router.get('/archived-feedback/semesters', getUniqueSemesters);

module.exports = router;
