const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const Course = require('../models/Course');
const FeedbackStatus = require('../models/FeedbackStatus');
const XLSX = require('xlsx');

// @desc Start generating feedbacks for professors and TAs
// @route POST /api/feedback/start
// @access Admin only
const startFeedback = asyncHandler(async (req, res) => {
    try {
        let feedbackStatus = await FeedbackStatus.findOne();
        if (!feedbackStatus) {
            feedbackStatus = new FeedbackStatus({ active: true });
        } else {
            feedbackStatus.active = true;
        }
        await feedbackStatus.save();

        await Feedback.deleteMany();

        const courses = await Course.find().populate('taAllocated professor');

        for (const course of courses) {
            if (!course.taAllocated || course.taAllocated.length === 0) continue;

            for (const professor of course.professor) {
                for (const ta of course.taAllocated) {
                    const existingFeedback = await Feedback.exists({
                        course: course._id,
                        student: ta._id,
                        professor: professor._id,
                    });

                    if (!existingFeedback) {
                        const feedback = new Feedback({
                            course: course._id,
                            student: ta._id,
                            professor: professor._id,
                            overallGrade: 'S',
                            regularityInMeeting: 'Average',
                            attendanceInLectures: 'Average',
                            preparednessForTutorials: 'Average',
                            timelinessOfTasks: 'Average',
                            qualityOfWork: 'Average',
                            attitudeCommitment: 'Average',
                            nominatedForBestTA: false,
                            comments: '',
                        });

                        await feedback.save();
                    }
                }
            }
        }

        res.json({ message: 'Feedback initialized successfully for all professors and TAs.' });
    } catch (error) {
        console.error('Error generating feedback:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// @desc Edit feedback by ID
// @route PUT /api/feedback/:id
// @access Professors only
const editFeedbackById = asyncHandler(async (req, res) => {
    try {
        const feedbackStatus = await FeedbackStatus.findOne();
        if (!feedbackStatus || !feedbackStatus.active) {
            return res.status(403).json({ message: "Feedback form is closed. Cannot edit feedback." });
        }

        const { id } = req.params;
        const {
            overallGrade,
            regularityInMeeting,
            attendanceInLectures,
            preparednessForTutorials,
            timelinessOfTasks,
            qualityOfWork,
            attitudeCommitment,
            nominatedForBestTA,
            comments,
        } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        feedback.overallGrade = overallGrade || feedback.overallGrade;
        feedback.regularityInMeeting = regularityInMeeting || feedback.regularityInMeeting;
        feedback.attendanceInLectures = attendanceInLectures || feedback.attendanceInLectures;
        feedback.preparednessForTutorials = preparednessForTutorials || feedback.preparednessForTutorials;
        feedback.timelinessOfTasks = timelinessOfTasks || feedback.timelinessOfTasks;
        feedback.qualityOfWork = qualityOfWork || feedback.qualityOfWork;
        feedback.attitudeCommitment = attitudeCommitment || feedback.attitudeCommitment;
        feedback.nominatedForBestTA = nominatedForBestTA !== undefined ? nominatedForBestTA : feedback.nominatedForBestTA;
        feedback.comments = comments || feedback.comments;

        await feedback.save();

        res.json({ message: "Feedback updated successfully", feedback });
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// @desc Get feedbacks by professor ID
// @route GET /api/feedback/professor/:professorId
// @access Professors only
const getFeedbacksByProfessorId = asyncHandler(async (req, res) => {
    try {
        const { professorId } = req.params;

        // Fetch courses taught by this professor
        const courses = await Course.find({ professor: professorId })
            .populate('taAllocated')
            .populate('professor', 'name');

        let feedbacks = [];

        for (const course of courses) {
            for (const ta of course.taAllocated) {
                // Fetch existing feedback for this course, professor, and student
                let feedback = await Feedback.findOne({
                    professor: professorId,
                    course: course._id,
                    student: ta._id,
                })
                    .populate('course', 'name code')
                    .populate('student', 'name rollNo')
                    .populate('professor', 'name');

                // Create a placeholder if feedback doesn't exist
                if (!feedback) {
                    feedback = {
                        _id: null, // Indicates this is a placeholder
                        professor: { name: course.professor.map((prof) => prof.name).join(', ') },
                        course: { name: course.name },
                        student: { rollNo: ta.rollNo, name: ta.name },
                        overallGrade: "S",
                        regularityInMeeting: "Average",
                        attendanceInLectures: "Average",
                        preparednessForTutorials: "Average",
                        timelinessOfTasks: "Average",
                        qualityOfWork: "Average",
                        attitudeCommitment: "Average",
                        nominatedForBestTA: false,
                        comments: "",
                    };
                }

                feedbacks.push(feedback);
            }
        }

        res.status(200).json({ feedbacks });
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});



// @desc Download all submitted feedbacks as XLSX
// @route GET /api/feedback/download
// @access Admin only
const downloadFeedbacks = asyncHandler(async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('course', 'name code')
            .populate('student', 'name rollNo')
            .populate('professor', 'name emailId');

        const meaningfulFeedbacks = feedbacks.filter((feedback) => {
            return (
                feedback.overallGrade !== 'S' ||
                feedback.regularityInMeeting !== 'Average' ||
                feedback.attendanceInLectures !== 'Average' ||
                feedback.preparednessForTutorials !== 'Average' ||
                feedback.timelinessOfTasks !== 'Average' ||
                feedback.qualityOfWork !== 'Average' ||
                feedback.attitudeCommitment !== 'Average' ||
                feedback.nominatedForBestTA !== false ||
                (feedback.comments && feedback.comments.trim() !== '')
            );
        });

        if (meaningfulFeedbacks.length === 0) {
            return res.status(404).json({ message: "No submitted feedbacks available for download." });
        }

        const formattedData = meaningfulFeedbacks.map((feedback) => ({
            "Professor Name": feedback.professor?.name || "N/A",
            "Professor Email": feedback.professor?.emailId || "N/A",
            "Student Roll No.": feedback.student?.rollNo || "N/A",
            "Student Name": feedback.student?.name || "N/A",
            "Course Name": feedback.course?.name || "N/A",
            "Overall Grade": feedback.overallGrade || "N/A",
            "Regularity in Meeting": feedback.regularityInMeeting || "N/A",
            "Attendance in Lectures": feedback.attendanceInLectures || "N/A",
            "Preparedness for Tutorials": feedback.preparednessForTutorials || "N/A",
            "Timeliness of Tasks": feedback.timelinessOfTasks || "N/A",
            "Quality of Work": feedback.qualityOfWork || "N/A",
            "Attitude and Commitment": feedback.attitudeCommitment || "N/A",
            "Nominated for Best TA": feedback.nominatedForBestTA ? "Yes" : "No",
            "Comments": feedback.comments || "N/A",
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submitted Feedbacks");

        const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

        res.setHeader('Content-Disposition', 'attachment; filename="SubmittedFeedbacks.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    } catch (error) {
        console.error("Error generating feedback Excel file:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// @desc Get all feedbacks
// @route GET /api/feedback/all
// @access Admin only
const getAllFeedbacks = asyncHandler(async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('course', 'name code')
            .populate('student', 'name rollNo')
            .populate('professor', 'name');
        res.json({ feedbacks });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// @desc Close the feedback form
// @route POST /api/feedback/close
// @access Admin only
const closeFeedback = asyncHandler(async (req, res) => {
    try {
        let feedbackStatus = await FeedbackStatus.findOne();
        if (!feedbackStatus) {
            feedbackStatus = new FeedbackStatus({ active: false });
        } else {
            feedbackStatus.active = false;
        }
        await feedbackStatus.save();
        res.json({ message: 'Feedback form closed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// @desc Get feedback status
// @route GET /api/feedback/status
// @access Admin only
const getFeedbackStatus = asyncHandler(async (req, res) => {
    try {
        const feedbackStatus = await FeedbackStatus.findOne();

        if (!feedbackStatus) {
            return res.json({ active: false });
        }

        res.json({ active: feedbackStatus.active });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Export all functions
module.exports = {
    startFeedback,
    editFeedbackById,
    getFeedbacksByProfessorId,
    downloadFeedbacks,
    getAllFeedbacks,
    closeFeedback,
    getFeedbackStatus,
};
