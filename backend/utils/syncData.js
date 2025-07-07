const Student = require('../models/Student');
const Course = require('../models/Course');

const syncData = async () => {
    console.log("Starting data synchronization...");

    // Fetch all courses with allocated students
    const courses = await Course.find({ "taAllocated.0": { $exists: true } });
    const studentIdsFromCourses = new Set();

    for (const course of courses) {
        const courseId = course._id;
        const taAllocated = course.taAllocated;

        // Fetch all students allocated to this course
        const studentsInCourse = await Student.find({ allocatedTA: courseId });

        // Step 1: Sync students missing from the course's `taAllocated`
        const studentIdsInCourse = new Set(studentsInCourse.map((student) => student._id.toString()));
        for (const studentId of taAllocated) {
            if (!studentIdsInCourse.has(studentId.toString())) {
                console.log(`Student ${studentId} in course ${course.name} is missing in the Student collection.`);
                // Remove invalid student from course.taAllocated
                course.taAllocated = course.taAllocated.filter(
                    (id) => id.toString() !== studentId.toString()
                );
                await course.save();
                console.log(`Removed student ${studentId} from course ${course.name}.`);
            }
        }

        // Step 2: Add students who have `allocatedTA` but are missing in `taAllocated`
        for (const student of studentsInCourse) {
            if (!taAllocated.map((id) => id.toString()).includes(student._id.toString())) {
                console.log(
                    `Student ${student.name} (${student._id}) allocated to course ${course.name} but missing in taAllocated.`
                );
                course.taAllocated.push(student._id);
            }
        }

        // Save the course after updates
        await course.save();

        // Add valid student IDs to the set for further validation
        studentsInCourse.forEach((student) => studentIdsFromCourses.add(student._id.toString()));
    }

    // Step 3: Identify students with `allocatedTA` but no matching course
    const studentsWithAllocatedTA = await Student.find({
        allocationStatus: 1,
        allocatedTA: { $exists: true },
    });

    for (const student of studentsWithAllocatedTA) {
        if (!studentIdsFromCourses.has(student._id.toString())) {
            console.log(`Student ${student.name} (${student._id}) has allocatedTA ${student.allocatedTA} but is not listed in any course.`);
            // Correct student record
            student.allocatedTA = null;
            student.allocationStatus = 0;
            await student.save();
            console.log(`Reset allocation for student ${student.name} (${student._id}).`);
        }
    }

    console.log("Data synchronization completed.");
};

module.exports = syncData;
