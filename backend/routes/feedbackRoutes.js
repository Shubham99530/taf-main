// feedbackRoutes.js
const express = require('express');
const router = express.Router();
const { startFeedback, editFeedbackById, getFeedbacksByProfessorId, getAllFeedbacks ,closeFeedback,getFeedbackStatus, downloadFeedbacks} = require('../controllers/feedbackController');
// const { downloadFeedback } = require('../controllers/feedbackController');
// router.get('/feedbacks/download', downloadFeedback);
router.get('/start', startFeedback);
router.put('/:id', editFeedbackById);
router.get('/professor/:professorId', getFeedbacksByProfessorId);
router.get('/all', getAllFeedbacks);
router.get('/status', getFeedbackStatus);
// Add route for downloading feedbacks
router.get('/download', downloadFeedbacks);
router.post('/end', closeFeedback);


module.exports = router;
