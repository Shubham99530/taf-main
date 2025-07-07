import React, { useContext } from "react";
import CourseContext from "../context/CourseContext";

const DashboardCardList = () => {
  const { courses } = useContext(CourseContext);

  // Check if courses is undefined or empty
  if (!courses || courses.length === 0) {
    return <div className="font-bold text-3xl my-2">No courses available</div>;
  }

  const initialDepartmentData = {
    CSE: { count: 0, taRequired: 0, taAllocated: 0 },
    CB: { count: 0, taRequired: 0, taAllocated: 0 },
    MATHS: { count: 0, taRequired: 0, taAllocated: 0 },
    HCD: { count: 0, taRequired: 0, taAllocated: 0 },
    ECE: { count: 0, taRequired: 0, taAllocated: 0 },
    SSH: { count: 0, taRequired: 0, taAllocated: 0 },
  };

  const departmentData = courses.reduce((acc, course) => {
    const department = course.department;
    if (initialDepartmentData.hasOwnProperty(department)) {
      acc[department].count += 1;
      acc[department].taRequired += course.taRequired || 0;
      acc[department].taAllocated += Array.isArray(course.taAllocated)
        ? course.taAllocated.length
        : 0;
    }
    return acc;
  }, { ...initialDepartmentData });

  const departmentList = Object.keys(initialDepartmentData);

  return (
    // Use a fixed 2x3 grid; remove any fixed max-height/overflow to let the grid expand naturally
    <div className="grid grid-cols-3 grid-rows-2 gap-6 justify-items-center">
      {departmentList.map((department, index) => (
        <div
          key={index}
          // Reduced card dimensions to help fit all cards on screen
          className="w-[220px] h-[220px] border border-gray-300 hover:shadow-lg transition-transform transform hover:scale-105 rounded-lg flex flex-col"
        >
<div className="h-[80px] w-full bg-[#3dafaa] text-white p-4 rounded-t-lg">
<h1 className="leading-tight font-semibold text-xl text-white hover:underline">
              {department} Department
            </h1>
            <h3 className="text-xs text-white font-normal hover:underline">
              Department Admin
            </h3>
          </div>
          <div className="p-3 flex-grow text-sm">
            <p className="mt-2 text-gray-700">
              Courses: {departmentData[department].count}
            </p>
            <p className="mt-2 text-gray-700">
              TAs Needed: {departmentData[department].taRequired}
            </p>
            <p className="mt-2 text-gray-700">
              TAs Allocated: {departmentData[department].taAllocated}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCardList;
