// models/ArchivedFeedback.js
const mongoose = require('mongoose');

const archivedFeedbackSchema = new mongoose.Schema({
  // snapshot of course
  courseCode:       { type: String, required: true },
  courseName:       { type: String, required: true },

  // snapshot of student
  studentName:      { type: String, required: true },
  studentRollNo:    { type: String, required: true },
  studentEmail:     { type: String, required: true }, 

  // snapshot of professor
  professorName:    { type: String, required: true },

  // all your rating fields
  overallGrade:         String,
  regularityInMeeting:  String,
  attendanceInLectures: String,
  preparednessForTutorials: String,
  timelinessOfTasks:    String,
  qualityOfWork:        String,
  attitudeCommitment:   String,
  nominatedForBestTA:   Boolean,
  comments:             String,

  // metadata
  semester:       { type: String, required: true },
  archivedDate:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('ArchivedFeedback', archivedFeedbackSchema);
