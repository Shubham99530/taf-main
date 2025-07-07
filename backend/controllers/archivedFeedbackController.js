const asyncHandler = require('express-async-handler');
const ArchivedFeedback = require('../models/ArchivedFeedback');
const XLSX = require('xlsx');

// @desc    Get all archived feedbacks with pagination
// @route   GET /api/archived-feedback?page=&limit=&semester=
// @access  Admin only
const getArchivedFeedback = asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const filter = semester ? { semester } : {};

  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;
  const skip = (page - 1) * limit;

  const [archivedFeedback, total] = await Promise.all([
    ArchivedFeedback.find(filter)
      .sort({ archivedDate: -1 })
      .skip(skip)
      .limit(limit),
    ArchivedFeedback.countDocuments(filter)
  ]);

  res.json({ archivedFeedback, total, page, limit });
});

// @desc    Get archived feedback count/status
// @route   GET /api/archived-feedback/status
// @access  Admin only
const getArchivedFeedbackStatus = asyncHandler(async (req, res) => {
  const totalArchivedFeedback = await ArchivedFeedback.countDocuments();
  res.json({ totalArchivedFeedback });
});

// @desc    Download archived feedback as XLSX
// @route   GET /api/archived-feedback/download?semester=
// @access  Admin only
const downloadArchivedFeedback = asyncHandler(async (req, res) => {
  const { semester } = req.query;
  const filter = semester ? { semester } : {};

  const feedbackList = await ArchivedFeedback.find(filter).sort({ archivedDate: -1 });
  const data = feedbackList.map(fb => ({
    "Course Code": fb.courseCode,
    "Course Name": fb.courseName,
    "Student RollNo": fb.studentRollNo,
    "Student Name": fb.studentName,
    "Student Email": fb.studentEmail,
    "Professor Name": fb.professorName,
    "Professor Email": fb.professorEmail,
    "Overall Grade": fb.overallGrade || '',
    "Regularity": fb.regularityInMeeting || '',
    "Attendance": fb.attendanceInLectures || '',
    "Preparedness": fb.preparednessForTutorials || '',
    "Timeliness": fb.timelinessOfTasks || '',
    "Quality of Work": fb.qualityOfWork || '',
    "Commitment": fb.attitudeCommitment || '',
    "Nominated For Best TA": fb.nominatedForBestTA ? 'Yes' : 'No',
    "Comments": fb.comments || '',
    "Semester": fb.semester,
    "Archived Date": fb.archivedDate.toISOString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ArchivedFeedback');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const filename = `archivedFeedback${semester ? `_${semester}` : ''}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// @desc    Get all unique semesters from archived feedback
// @route   GET /api/archived-feedback/semesters
// @access  Admin only
const getUniqueSemesters = asyncHandler(async (req, res) => {
  const semesters = await ArchivedFeedback.distinct('semester');
  res.json({ semesters });
});

module.exports = {
  getArchivedFeedback,
  getArchivedFeedbackStatus,
  downloadArchivedFeedback,
  getUniqueSemesters
};
