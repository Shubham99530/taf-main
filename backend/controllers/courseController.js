const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const JM = require('../models/JM');
const Professor = require('../models/Professor');
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');

// @desc Get course by ID
// @route GET /api/course/:id
// @access public
const getCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate({
            path: 'department',
            select: 'department -_id'
        })
        .populate({
            path: 'professor',
            select: 'name -_id'
        });

    if (!course) {
        res.status(404);
        throw new Error("No Course Found");
    }

    const flattenedCourse = {
        _id: course._id,
        name: course.name,
        code: course.code,
        acronym: course.acronym,
        department: course.department ? course.department.department : null,
        credits: course.credits,
        professor: course.professor && course.professor.length > 0
            ? course.professor.map((prof) => prof.name).join(', ')
            : 'N/A',
        totalStudents: course.totalStudents,
        taStudentRatio: course.taStudentRatio,
        taRequired: course.taRequired,
        taAllocated: course.taAllocated,
        antiPref: course.antiPref
    };

    res.status(200).json(flattenedCourse);
});

// @desc Get filtered courses
// @route GET /api/course?filters
// @access public
const getCourses = asyncHandler(async (req, res) => {
    const { name, code, acronym, department, professor, credits } = req.query;

    const filter = {};
    if (name) filter.name = name;
    if (code) filter.code = code;
    if (acronym) filter.acronym = acronym;
    if (credits) filter.credits = parseInt(credits);

    try {
        if (department) {
            const departmentId = await JM.exists({ department });
            if (departmentId) {
                filter.department = departmentId._id;
            }
        }

        if (professor) {
            const professorIds = await Professor.find({ name: new RegExp(professor, 'i') }).select('_id');
            if (professorIds.length > 0) {
                filter.professor = { $in: professorIds.map((prof) => prof._id) };
            }
        }

        const filteredCourses = await Course.find(filter)
            .populate({
                path: 'department',
                select: 'department -_id'
            })
            .populate({
                path: 'professor',
                select: 'name -_id'
            });

        const flattenedCourses = filteredCourses.map((course) => ({
            _id: course._id,
            name: course.name,
            code: course.code,
            acronym: course.acronym,
            department: course.department ? course.department.department : null,
            credits: course.credits,
            professor: course.professor && course.professor.length > 0
                ? course.professor.map((prof) => prof.name).join(', ')
                : 'N/A',
            totalStudents: course.totalStudents,
            taStudentRatio: course.taStudentRatio,
            taRequired: course.taRequired,
            taAllocated: course.taAllocated,
            antiPref: course.antiPref
        }));

        res.status(200).json(flattenedCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc Add new course
// @route POST /api/course
// @access public
const addCourse = asyncHandler(async (req, res) => {
    let newCourses = req.body;

    if (!Array.isArray(newCourses)) {
        newCourses = [newCourses];
    }

    try {
        const validCourses = [];
        const invalidCourses = [];
        const jmDepartments = await JM.find({}, { department: 1 });
        const jmDepartmentMap = jmDepartments.reduce((acc, department) => {
            acc[department.department] = department._id;
            return acc;
        }, {});

        await Promise.all(newCourses.map(async (newCourse) => {
            try {
                // Validate required fields
                if (!newCourse.name || !newCourse.code || !newCourse.acronym || !newCourse.department || !newCourse.totalStudents || !newCourse.taStudentRatio) {
                    throw new Error('All required fields must be provided');
                }

                // Process professors
                if (newCourse.professor) {
                    const professorNames = newCourse.professor.split(',').map((name) => name.trim());
                    const professorIds = await Promise.all(
                        professorNames.map(async (profName) => {
                            const professor = await Professor.findOne({ name: profName });
                            if (!professor) {
                                throw new Error(`Professor ${profName} not found`);
                            }
                            return professor._id;
                        })
                    );
                    newCourse.professor = professorIds;
                }

                // Validate department
                const jmDepartmentId = jmDepartmentMap[newCourse.department];
                if (!jmDepartmentId) {
                    throw new Error(`Invalid department: ${newCourse.department}`);
                }
                newCourse.department = jmDepartmentId;

                // Calculate TA requirement
                newCourse.taRequired = Math.ceil(newCourse.totalStudents / newCourse.taStudentRatio);

                validCourses.push(newCourse);
            } catch (error) {
                invalidCourses.push({
                    course: newCourse,
                    message: error.message
                });
            }
        }));

        // Bulk write valid courses
        const bulkOps = validCourses.map((course) => ({
            updateOne: {
                filter: { acronym: course.acronym, name: course.name },
                update: { $set: course },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await Course.collection.bulkWrite(bulkOps, { ordered: false });
        }

        res.status(201).json({
            message: 'Courses added successfully',
            invalidCourses
        });
    } catch (error) {
        console.error('Error adding courses:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// @desc Update course data
// @route PUT /api/course/:id
// @access public
const updateCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;
    const updates = req.body;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (updates.department) {
            const jmDepartment = await JM.exists({ department: updates.department });
            if (!jmDepartment) {
                return res.status(400).json({ message: 'Invalid Department value' });
            }
            updates.department = jmDepartment._id;
        }

        if (updates.professor) {
            const professorNames = updates.professor.split(',').map((name) => name.trim());
            const professorIds = await Promise.all(
                professorNames.map(async (profName) => {
                    const professor = await Professor.findOne({ name: profName });
                    if (!professor) {
                        throw new Error(`Invalid Professor value: ${profName}`);
                    }
                    return professor._id;
                })
            );
            updates.professor = professorIds;
        }

        if (updates.taStudentRatio || updates.totalStudents) {
            updates.taRequired = Math.ceil(
                (updates.totalStudents || course.totalStudents) / (updates.taStudentRatio || course.taStudentRatio)
            );
        }

        const updatedCourse = await Course.findByIdAndUpdate(courseId, updates, { new: true });

        res.status(200).json({ message: 'Course updated successfully', course: updatedCourse });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// @desc Delete a course by ID
// @route DELETE /api/course/:id
// @access public
const deleteCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await Feedback.deleteMany({ course: courseId });

        await Course.findByIdAndRemove(courseId);

        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @desc Get courses for a professor
// @route POST /api/course/professor
// @access public
const ProfessorCourses = asyncHandler(async (req, res) => {
    try {
        const professorId = req.body.professor;
        const coursesTaught = await Course.find({ professor: professorId })
            .populate('department', 'department -_id')
            .populate('professor', 'name -_id');

            res.json({
                success: true,
                courses: coursesTaught.map((course) => ({
                    _id: course._id,
                    name: course.name,
                    code: course.code,
                    acronym: course.acronym,
                    department: course.department ? course.department.department : null,
                    credits: course.credits,
                    professor: course.professor.map((prof) => prof.name).join(', '),
                    totalStudents: course.totalStudents,
                    taStudentRatio: course.taStudentRatio,
                    taRequired: course.taRequired,
                    taAllocated: course.taAllocated,
                    antiPref: course.antiPref
                }))
            });
        } catch (error) {
            console.error('Error fetching professor courses:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    module.exports = {
        getCourse,
        addCourse,
        updateCourse,
        deleteCourse,
        getCourses,
        ProfessorCourses
    };
    