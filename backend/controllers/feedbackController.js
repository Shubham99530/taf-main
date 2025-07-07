// controllers/feedbackController.js

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const Feedback = require('../models/Feedback');
const FeedbackStatus = require('../models/FeedbackStatus');
const Course = require('../models/Course');
const ArchivedFeedback = require('../models/ArchivedFeedback');

// Helper: return the two most recent semesters to keep
const getSemestersToKeep = async () => {
  const semesters = await ArchivedFeedback.aggregate([
    { $group: { _id: '$semester', latestDate: { $max: '$archivedDate' } } },
    { $sort: { latestDate: -1 } },
    { $limit: 2 }
  ]);
  return semesters.map(s => s._id);
};

// Helper: generate an Excel file for archived-feedback docs
const generateExcelFile = async (data) => {
  const formatted = data.map(fb => ({
    Course: `${fb.courseCode} - ${fb.courseName}`,
    Student: `${fb.studentRollNo} - ${fb.studentName}`,
    Student_Email: fb.studentEmail,
    Professor: fb.professorName,
    Professor_Email: fb.professorEmail,
    Overall_Grade: fb.overallGrade,
    Regularity: fb.regularityInMeeting,
    Attendance: fb.attendanceInLectures,
    Preparedness: fb.preparednessForTutorials,
    Timeliness: fb.timelinessOfTasks,
    Quality_of_Work: fb.qualityOfWork,
    Commitment: fb.attitudeCommitment,
    Nominated_for_Best_TA: fb.nominatedForBestTA ? 'Yes' : 'No',
    Comments: fb.comments,
    Semester: fb.semester,
    Archived_Date: fb.archivedDate,
  }));

  const ws = XLSX.utils.json_to_sheet(formatted);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Archived Feedback');

  const outDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const filePath = path.join(outDir, `archived_feedback_${Date.now()}.xlsx`);
  XLSX.writeFile(wb, filePath);
  return filePath;
};

// Helper: send email with the archived-feedback Excel attached
const sendNotificationEmail = async (currentSemester, filePath) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: { user: process.env.USERMAIL, pass: process.env.PASS }
  });

  const mailOptions = {
    from: 'sambhav22435@iiitd.ac.in',
    to: ['sambhavgautam6@gmail.com', 'sambhav22435@iiitd.ac.in'],
    subject: `Feedback Archived for Semester ${currentSemester}`,
    text: `The feedback round for semester ${currentSemester} has closed. Archived data is attached.`,
    attachments: [{ filename: 'Archived_Feedback.xlsx', path: filePath }]
  };

  try {
    await transporter.sendMail(mailOptions);
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// @desc Start generating feedback placeholders
// @route POST /api/feedback/start
// @access Admin only
const startFeedback = asyncHandler(async (req, res) => {
  let status = await FeedbackStatus.findOne();
  if (!status) status = new FeedbackStatus({ active: true });
  else status.active = true;
  await status.save();

  await Feedback.deleteMany();

  const courses = await Course.find().populate('taAllocated professor');
  for (const course of courses) {
    if (!course.taAllocated?.length) continue;
    for (const prof of course.professor) {
      for (const ta of course.taAllocated) {
        const exists = await Feedback.exists({
          course: course._id,
          professor: prof._id,
          student: ta._id
        });
        if (exists) continue;
        await Feedback.create({
          course: course._id,
          professor: prof._id,
          student: ta._id,
          overallGrade: 'S',
          regularityInMeeting: 'Excellent',
          attendanceInLectures: 'Excellent',
          preparednessForTutorials: 'Excellent',
          timelinessOfTasks: 'Excellent',
          qualityOfWork: 'Excellent',
          attitudeCommitment: 'Excellent',
          nominatedForBestTA: false,
          comments: ''
        });
      }
    }
  }

  res.json({ message: 'Feedback initialized successfully.' });
});

// @desc Edit feedback by ID
// @route PUT /api/feedback/:id
// @access Professors only
const editFeedbackById = asyncHandler(async (req, res) => {
  const status = await FeedbackStatus.findOne();
  if (!status?.active) {
    return res.status(403).json({ message: 'Feedback form is closed.' });
  }

  const fb = await Feedback.findById(req.params.id);
  if (!fb) return res.status(404).json({ message: 'Feedback not found.' });

  const fields = [
    'overallGrade',
    'regularityInMeeting',
    'attendanceInLectures',
    'preparednessForTutorials',
    'timelinessOfTasks',
    'qualityOfWork',
    'attitudeCommitment',
    'comments'
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) fb[f] = req.body[f];
  }
  if (req.body.nominatedForBestTA !== undefined) {
    fb.nominatedForBestTA = req.body.nominatedForBestTA;
  }

  await fb.save();
  res.json({ message: 'Feedback updated.', feedback: fb });
});

// @desc Get feedbacks by professor ID
// @route GET /api/feedback/professor/:professorId
// @access Professors only
const getFeedbacksByProfessorId = asyncHandler(async (req, res) => {
  const profId = req.params.professorId;
  const courses = await Course.find({ professor: profId })
    .populate('taAllocated')
    .populate('professor', 'name');

  const all = [];
  for (const course of courses) {
    for (const ta of course.taAllocated) {
      let fb = await Feedback.findOne({
        professor: profId,
        course: course._id,
        student: ta._id
      })
        .populate('course', 'name code')
        .populate('student', 'name rollNo')
        .populate('professor', 'name');

      if (!fb) {
        fb = {
          _id: null,
          course: { name: course.name, code: course.code },
          student: { name: ta.name, rollNo: ta.rollNo },
          professor: { name: course.professor.map(p => p.name).join(', ') },
          overallGrade: 'S',
          regularityInMeeting: 'Excellent',
          attendanceInLectures: 'Excellent',
          preparednessForTutorials: 'Excellent',
          timelinessOfTasks: 'Excellent',
          qualityOfWork: 'Excellent',
          attitudeCommitment: 'Excellent',
          nominatedForBestTA: false,
          comments: ''
        };
      }

      all.push(fb);
    }
  }

  res.json({ feedbacks: all });
});

// @desc Download all submitted feedbacks as XLSX
// @route GET /api/feedback/download
// @access Admin only
const downloadFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find()
    .populate('course', 'name code')
    .populate('student', 'name rollNo')
    .populate('professor', 'name emailId');

  const sheetData = feedbacks.map(fb => ({
    'Professor Name': fb.professor.name || 'N/A',
    'Professor Email': fb.professor.emailId || 'N/A',
    'Student Roll No.': fb.student.rollNo || 'N/A',
    'Student Name': fb.student.name || 'N/A',
    'Course Name': fb.course.name || 'N/A',
    'Overall Grade': fb.overallGrade || 'N/A',
    'Regularity in Meeting': fb.regularityInMeeting || 'N/A',
    'Attendance in Lectures': fb.attendanceInLectures || 'N/A',
    'Preparedness for Tutorials': fb.preparednessForTutorials || 'N/A',
    'Timeliness of Tasks': fb.timelinessOfTasks || 'N/A',
    'Quality of Work': fb.qualityOfWork || 'N/A',
    'Attitude and Commitment': fb.attitudeCommitment || 'N/A',
    'Nominated for Best TA': fb.nominatedForBestTA ? 'Yes' : 'No',
    'Comments': fb.comments || 'N/A'
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Submitted Feedbacks');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  res
    .header('Content-Disposition', 'attachment; filename="SubmittedFeedbacks.xlsx"')
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .send(buf);
});

// @desc Get all feedbacks with pagination
// @route GET /api/feedback/all?page=&limit=
// @access Admin only
const getAllFeedbacks = asyncHandler(async (req, res) => {
  let { page = 1, limit = 20 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const feedbacks = await Feedback.find()
    .populate('course', 'name code')
    .populate('student', 'name rollNo')
    .populate('professor', 'name')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Feedback.countDocuments();
  res.json({ feedbacks, total, page, limit });
});

// Derive current semester (e.g. "Spring 2025") based on today's date
const deriveCurrentSemester = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (month >= 1 && month <= 6)  return `Winter-${year}`;
    if (month >= 7 && month <= 12)  return `Monsoon-${year}`;
    return `Fall ${year}`;
  };
  
  // @desc   Close feedback form: archive + prune + email + wipe live + flip flag
  // @route  POST /api/feedback/close
  // @access Admin only
  const closeFeedback = asyncHandler(async (req, res) => {
    // if you ever want to override, you can still pass { currentSemester } in the body
    const currentSemester = deriveCurrentSemester();
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // 1) Archive all live feedback
      const live = await Feedback.find()
        .populate('course', 'code name')
        .populate('student', 'name rollNo emailId')
        .populate('professor', 'name emailId')
        .session(session);
  
      if (live.length) {
        const toArchive = live.map(f => ({
          courseCode: f.course.code,
          courseName: f.course.name,
          studentName: f.student.name,
          studentRollNo: f.student.rollNo,
          studentEmail: f.student.emailId,
          professorName: f.professor.name,
          professorEmail: f.professor.emailId,
          overallGrade: f.overallGrade,
          regularityInMeeting: f.regularityInMeeting,
          attendanceInLectures: f.attendanceInLectures,
          preparednessForTutorials: f.preparednessForTutorials,
          timelinessOfTasks: f.timelinessOfTasks,
          qualityOfWork: f.qualityOfWork,
          attitudeCommitment: f.attitudeCommitment,
          nominatedForBestTA: f.nominatedForBestTA,
          comments: f.comments,
          semester: currentSemester,
          archivedDate: new Date()
        }));
        await ArchivedFeedback.insertMany(toArchive, { session });
      }
  
      // 2) Prune old archives
      const keep = await getSemestersToKeep();
      keep.push(currentSemester);
      const stale = await ArchivedFeedback.find({ semester: { $nin: keep } }).session(session);
      if (stale.length) {
        const excelPath = await generateExcelFile(stale);
        await ArchivedFeedback.deleteMany({ semester: { $nin: keep } }).session(session);
        await sendNotificationEmail(currentSemester, excelPath);
      }
  
      // // 3) Wipe live feedback
      // await Feedback.deleteMany().session(session);
  
      // 4) Flip feedbackStatus off
      let status = await FeedbackStatus.findOne().session(session);
      if (!status) {
        status = new FeedbackStatus({ active: false });
      } else {
        status.active = false;
      }
      await status.save({ session });
  
      await session.commitTransaction();
  
      return res.json({
        message: `Feedback form closed for ${currentSemester}.`,
        semester: currentSemester
      });
    } catch (err) {
      await session.abortTransaction();
      console.error('Error in closeFeedback:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    } finally {
      session.endSession();
    }
  });
  
// @desc Get feedback form status
// @route GET /api/feedback/status
// @access Admin only
const getFeedbackStatus = asyncHandler(async (req, res) => {
  const status = await FeedbackStatus.findOne();
  res.json({ active: !!status?.active });
});

/**
 * GET /api/feedback/nominations
 * Return all live-Feedback docs where nominatedForBestTA === true
 */
const getNominations = asyncHandler(async (req, res) => {
  try {
    const nominations = await Feedback.find({ nominatedForBestTA: true })
      // Student schema has `name` and `rollNo`
      .populate('student', 'name rollNo')
      // Course schema—adjust field names if yours differ
      .populate('course', 'code name'); 

    res.json(nominations);
  } catch (err) {
    console.error('Error in getNominations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @desc   Get archived TA nominations for a given semester
 * @route  GET /api/feedback/archived-nominations?semester=<semester>
 * @access Admin only
 */
const getArchivedNominations = asyncHandler(async (req, res) => {
  const { semester } = req.query;
  if (!semester) {
    return res.status(400).json({ message: 'Query param "semester" is required' });
  }

  const archivedNoms = await ArchivedFeedback.find({
    semester,
    nominatedForBestTA: true
  });

  // Normalize shape to match live nominations
  const formatted = archivedNoms.map(n => ({
    course: { code: n.courseCode, name: n.courseName },
    student: { name: n.studentName, rollNo: n.studentRollNo }
  }));

  res.json(formatted);
});


module.exports = {
  startFeedback,
  editFeedbackById,
  getFeedbacksByProfessorId,
  downloadFeedbacks,
  getAllFeedbacks,
  closeFeedback,
  getFeedbackStatus,
  getNominations,
  getArchivedNominations,
};
