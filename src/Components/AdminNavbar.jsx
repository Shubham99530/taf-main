import { useContext, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import CourseContext from "../context/CourseContext";
import ProfContext from "../context/ProfContext";
import StudentContext from "../context/StudentContext";

const AdminNav = () => {
  const { getStudentsFromFile } = useContext(StudentContext);
  const { getCourseFromFile } = useContext(CourseContext);
  const { getProfessorFromFile } = useContext(ProfContext);

  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const routeMap = useMemo(
    () => ({
      "/admin/course": { title: "Available Courses", buttonText: "Course", handler: getCourseFromFile },
      "/admin/student": { title: "Eligible Students for TAship", buttonText: "Student", handler: getStudentsFromFile },
      "/admin/professors": { title: "Faculties For Current Semester", buttonText: "Faculty", handler: getProfessorFromFile },
      "/admin/department": { title: "Available Courses", buttonText: null },
    }),
    [getCourseFromFile, getStudentsFromFile, getProfessorFromFile]
  );

  const { title, buttonText, handler } = routeMap[location.pathname] || {
    title: "TA Allocation Portal",
    buttonText: null,
    handler: null,
  };

  const handleFileChange = async (event) => {
    if (handler) {
      setLoading(true);
      await handler(event, setLoading);
    }
  };

  return (
    <div className="bg-white flex justify-between items-center p-4">
      {/* Left Side: Logo and Title */}
      <div className="flex items-center flex-grow">
        <img className="h-10 w-auto" src="/images/iiitd.png" alt="IIITD Logo" />
        <h3 className="font-bold text-2xl text-center flex-grow">{title}</h3>
      </div>

      {/* Right Side: Upload Button & Loader */}
      {buttonText && (
        <div className="mr-6">
          {loading ? (
            <ClipLoader color="#ADD8E6" loading={loading} size={30} />
          ) : (
            <label className="bg-[#6495ED] text-white px-4 py-2 rounded-full cursor-pointer font-bold">
              Upload {buttonText} XLSX
              <input type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNav;
