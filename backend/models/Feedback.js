const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    professor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Professor',
        required: true
    },
    overallGrade: {
        type: String,
        enum: ['S', 'X'],
        required: true,
        default: 'S'
    },
    regularityInMeeting: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    attendanceInLectures: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    preparednessForTutorials: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    timelinessOfTasks: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    qualityOfWork: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    attitudeCommitment: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average','NA'],
        default: 'NA'
    },
    nominatedForBestTA: {
        type: Boolean,
        default: false
    },
    comments: {
        type: String
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
