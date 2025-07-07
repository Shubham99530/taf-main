// controllers/semesterController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const Student = require('../models/Student');
const Course = require('../models/Course');
const Round = require('../models/Round');
const Admin = require('../models/Admin');
const LogEntry = require('../models/LogEntry');
const Feedback = require('../models/Feedback');
const FeedbackStatus = require('../models/FeedbackStatus');

// API to start a new semester (no archiving, no mailing)
const newSemester = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { currentSemester } = req.body;
    if (!currentSemester) {
      return res.status(400).json({ message: 'Current semester is required' });
    }

    // 1) Wipe all live collections
    await Student.deleteMany().session(session);
    await Course.deleteMany().session(session);
    await Round.deleteMany().session(session);
    await LogEntry.deleteMany().session(session);
    await Feedback.deleteMany().session(session);

    // 2) Reset admin and feedback status
    await Admin.findOneAndUpdate(
      {},
      { jmAccess: false, studentFormAccess: false, professorAccess: false },
      { session }
    );
    await FeedbackStatus.findOneAndUpdate(
      {},
      { active: false },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({
      message:
        'New semester started: live data cleared and admin/feedback flags reset.',
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error in new semester API:', error);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = { newSemester };
