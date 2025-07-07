import axios from "axios";
import { useContext, useEffect, useState } from "react";
import {
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import AuthContext from "../context/AuthContext";
import CourseContext from "../context/CourseContext";
import StudentContext from "../context/StudentContext";
import MultiSelect from './Multi';
import React from "react";
import PreviewModal from './modal';

const CoursePage = () => {
  const { selectedCourse } = useContext(CourseContext);
  const { students, getStudentsFromBackend } = useContext(StudentContext);
  const [button, setbutton] = useState(false);
  const { user } = useContext(AuthContext);
  const { courseName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [allocatedToThisCourse, setAllocatedToThisCourse] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [allocated, setAllocated] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRound, setCurrentRound] = useState(null);
  const [filters, setFilters] = useState({
    preference: [],
    department: "All",
    program: "All",
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [sorted, setSorted] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // New state and toggle function in your component:
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const toggleExpanded = (studentId) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  const fetchCurrentRound = async () => {
    try {
      const response = await fetch(`${API}/api/rd/currentround`);
      const data = await response.json();
      setCurrentRound(data.currentRound);
    } catch (error) {
      console.error("Error fetching round status:", error);
    }
  };

  useEffect(() => {
    if (!selectedCourse || selectedCourse.name !== courseName) {
      // Redirect to the professor page if conditions are met
      const currentPath = location.pathname;
      const lastIndexOfSlash = currentPath.lastIndexOf("/");

      if (lastIndexOfSlash !== -1) {
        // Extract the modified path
        const modifiedPath = currentPath.substring(0, lastIndexOfSlash);

        // Navigate to the modified path
        navigate(modifiedPath);
      }
    }

    // When the component mounts, sort students into allocated and available lists
    const studentsAllocatedToCourse = students.filter(
      (student) =>
        student.allocationStatus === 1 &&
        student.allocatedTA === selectedCourse.name
    );

    const studentsAvailableForAllocation = students.filter(
      (student) =>
        student.allocationStatus !== 1 ||
        student.allocatedTA !== selectedCourse.name
    );

    fetchCurrentRound();

    setAllocatedToThisCourse(studentsAllocatedToCourse);

    setAvailableStudents(studentsAvailableForAllocation);
  }, [selectedCourse, students, allocated]);

  const handleAllocate = async (studentId) => {
    if (currentRound == null) {
      Swal.fire("Can't Allocate", "No allocation round is going on", "error");
      return;
    }
  
    try {
      await axios.post(`${API}/api/al/allocation`, {
        studentId,
        courseId: selectedCourse._id,
        allocatedByID: user.id,
        allocatedBy: user.role,
      });
  
      // Move the student from available to allocated
      const studentToAllocate = availableStudents.find(
        (student) => student._id === studentId
      );
  
      setAllocatedToThisCourse((prevAllocated) => [
        ...prevAllocated,
        studentToAllocate,
      ]);
      setAvailableStudents((prevAvailable) =>
        prevAvailable.filter((student) => student._id !== studentId)
      );
  
      getStudentsFromBackend();
  
      // Toggle the button state to trigger recalculation
      setbutton((prevState) => !prevState);
    } catch (error) {
      if (error.message === "Request failed with status code 400") {
        Swal.fire("Can't Allocate", "TA limit exceeded.", "error");
      }
      console.error("Error allocating student:", error);
    }
  };
  

  const prefRank = (student) => {
    let count = 0;
    for (const pref of student.departmentPreferences) {
      count++;
      if (pref.course === selectedCourse.name) {
        return count;
      }
    }
    for (const pref of student.nonDepartmentPreferences) {
      count++;
      if (pref.course === selectedCourse.name) {
        return count;
      }
    }
    return 9;
  };
  
  const handleSort = (key) => {
    // Toggle the sorting direction if the same key is clicked again
    const direction =
      key === sortConfig.key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";
  
    const sourceData = allocated === 1 ? allocatedToThisCourse : availableStudents;
    const sortedStudents = [...sourceData].sort((a, b) => {
      if (key === "preference") {
        const rankA = prefRank(a);
        const rankB = prefRank(b);
        return direction === "ascending" ? rankA - rankB : rankB - rankA;
      }
      const valueA = a[key].toString().toLowerCase();
      const valueB = b[key].toString().toLowerCase();
      const compareResult = valueA.localeCompare(valueB);
      return direction === "ascending" ? compareResult : -compareResult;
    });
  
    // Update the sort configuration and sorted data in state
    setSortConfig({ key, direction });
    setSorted(sortedStudents);
  };
  
  const handleDeallocate = async (studentId) => {
    try {
      await axios.post(`${API}/api/al/deallocation`, {
        studentId,
        deallocatedByID: user.id,
        deallocatedBy: user.role,
        courseId: selectedCourse._id,
      });
  
      // Move the student from allocated to available
      const studentToDeallocate = allocatedToThisCourse.find(
        (student) => student._id === studentId
      );
  
      setAvailableStudents((prevAvailable) => [
        ...prevAvailable,
        studentToDeallocate,
      ]);
      setAllocatedToThisCourse((prevAllocated) =>
        prevAllocated.filter((student) => student._id !== studentId)
      );
  
      getStudentsFromBackend();
  
      // Toggle the button state to trigger recalculation
      setbutton((prevState) => !prevState);
    } catch (error) {
      console.error("Error deallocating student:", error);
    }
  };

  if (!selectedCourse) {
    // Render a message or UI indicating that the course data is not available
    return <div>Course data is not available.</div>;
  }

  const handleRenderAllocatedTable = async () => {
    setAllocated(1);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleRenderAvailableStudentTable = async () => {
    setAllocated(0);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleRenderAllocatedToOthersTable = async () => {
    setAllocated(2);
    setSortConfig({ key: null, direction: "ascending" });
    setFilters((prevFilters) => ({
      ...prevFilters,
      program: "All",
      department: "All",
      preference: "All",
    }));
  };
  

  const handleDownload = () => {
    const sourceData = allocated ? allocatedToThisCourse : availableStudents;
    const dataToDownload = sourceData.map(({ _id, allocationStatus, __v, ...rest }) => rest);
    console.log(dataToDownload);
    const ws = XLSX.utils.json_to_sheet(dataToDownload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(
      wb,
      `${selectedCourse.name}_${allocated ? "Allocated" : "Available"}_Students.xlsx`
    );
  };
  

  const downloadAvailableStudents = () => {
    // Filter students based on the same conditions as renderAvailableRow
    const availableStudents = filteredStudents.filter((student) => {
        let pref = "Not Any";
        let grade = "No Grade";
        const coursePreference = findCourseInPreferences(student, selectedCourse.name);
        if (coursePreference !== null) {
            pref = coursePreference.preferenceType;
            grade = coursePreference.grade;
        }

        // Only include students who meet the conditions to be rendered
        return (
            (pref !== "Not Any" || student.department === selectedCourse.department || currentRound !== 2) &&
            student.allocationStatus === 0
        );
    });

    // Prepare student data
    const studentData = availableStudents.map((student) => {
        let pref = "Not Any";
        let grade = "No Grade";
        const coursePreference = findCourseInPreferences(student, selectedCourse.name);
        if (coursePreference !== null) {
            pref = coursePreference.preferenceType;
            grade = coursePreference.grade;
        }

        return {
            Name: student.name,
            Email: student.emailId,
            Program: student.program,
            Department: student.department,
            CGPA: student.cgpa || "N/A",
            Grade: grade,
            Preference: pref,
        };
    });

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(studentData);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Available Students");

    // Generate and trigger download
    XLSX.writeFile(workbook, "available_students.xlsx");
};


const prepareData = () => {
  const data = allocated ? allocatedToThisCourse : availableStudents;
  return data.map(({ _id, allocationStatus, __v, ...rest }) => rest);
};

const handlePreview = () => {
  setPreviewData(prepareData());
  setIsPreviewModalOpen(true);
};


const filterStudents = (studentsList) => {
  const searchLower = searchQuery.toLowerCase();
  const courseName = selectedCourse.name;

  // Filter by search query
  let filteredStudents = studentsList.filter(
    (student) =>
      student.name.toLowerCase().includes(searchLower) ||
      student.emailId.toLowerCase().includes(searchLower)
  );

  // Filter by preference if applicable
  if (filters.preference.length > 0 && !filters.preference.includes("All")) {
    filteredStudents = filteredStudents.filter((student) => {
      let pref = "Not Any";
      let count = 1;
      for (const dp of student.departmentPreferences) {
        if (dp.course === courseName) {
          pref = `Dept Preference ${count}`;
          break;
        }
        count++;
      }
      count = 1;
      for (const ndp of student.nonDepartmentPreferences) {
        if (pref !== "Not Any") break;
        if (ndp.course === courseName) {
          pref = `Non-Department Preference ${count}`;
          break;
        }
        count++;
      }
      for (const np of student.nonPreferences) {
        if (pref !== "Not Any") break;
        if (np === courseName) {
          pref = `Not Preferred`;
          break;
        }
      }
      return filters.preference.includes(pref);
    });
  }

  // Filter by department if applicable
  if (filters.department !== "All") {
    filteredStudents = filteredStudents.filter(
      (student) => student.department === filters.department
    );
  }

  // Filter by program if applicable
  if (filters.program !== "All") {
    filteredStudents = filteredStudents.filter(
      (student) => student.program === filters.program
    );
  }

  return filteredStudents;
};

  

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredStudents = filterStudents(
    sortConfig.key === null
      ? allocated === 1
        ? allocatedToThisCourse
        : availableStudents
      : sorted
  );

  // Function to check if a course is in the student's preferences

  const findCourseInPreferences = (student, courseName) => {
    // Helper function to search through a list of preferences
    const searchPreference = (preferences, label) => {
      let count = 1;
      for (const preference of preferences) {
        if (preference.course === courseName) {
          return {
            preferenceType: `${label} Preference ${count}`,
            grade: preference.grade,
          };
        }
        count++;
      }
      return null;
    };
  
    // Search in department preferences
    const deptPref = searchPreference(student.departmentPreferences, "Department");
    if (deptPref) return deptPref;
  
    // Search in non-department preferences
    const nonDeptPref = searchPreference(student.nonDepartmentPreferences, "Non-Department");
    if (nonDeptPref) return nonDeptPref;
  
    // Search in non-preferences (using selectedCourse.name as in the original)
    for (const pref of student.nonPreferences) {
      if (pref === selectedCourse.name) {
        return {
          preferenceType: "Not Preferred",
          grade: "No Grade",
        };
      }
    }
  
    return null; // Course not found in preferences
  };
  

  // Updated renderAllocatedRow function
  const renderAllocatedRow = (student) => {
    let pref = "Not Any";
    let grade = "No Grade";
    const coursePreference = findCourseInPreferences(student, selectedCourse.name);
    if (coursePreference !== null) {
      pref = coursePreference.preferenceType;
      grade = coursePreference.grade;
    }
  
    // Determine whether to show additional columns based on currentRound
    const showExtraColumns = currentRound !== 1;
    // Determine whether to show the deallocate button
    const showDeallocateButton = !(user.role === "professor" && (currentRound === null || currentRound > 1));
  
    return (
      <tr className="text-center">
        <td className="border p-2">{student.name}</td>
        <td className="border p-2">{student.emailId}</td>
        <td className="border p-2">{student.program}</td>
        <td className="border p-2">{student.department}</td>
        {showExtraColumns && (
          <>
            <td className="border p-2">{student.cgpa}</td>
            <td className="border p-2">{grade}</td>
            <td className="border p-2">{pref}</td>
          </>
        )}
        {showDeallocateButton && (
          <td className="border p-2">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-full text-base font-medium hover:bg-red-800 transition duration-200"
              onClick={() => handleDeallocate(student._id)}
            >
              Deallocate
            </button>

          </td>
        )}
      </tr>
    );
  };

// Updated renderAvailableRow (unchanged logic except to add an onClick handler):
const renderAvailableRow = (student, onRowClick) => {
  let pref = "Not Any";
  let grade = "No Grade";
  const coursePreference = findCourseInPreferences(student, selectedCourse.name);
  if (coursePreference !== null) {
    pref = coursePreference.preferenceType;
    grade = coursePreference.grade;
  }

  // Only render the row if one of these conditions is true and allocationStatus is 0
  const shouldRenderRow =
    (pref !== "Not Any" ||
      student.department === selectedCourse.department ||
      currentRound !== 2) &&
    student.allocationStatus === 0;

  if (!shouldRenderRow) return null;

  // Determine if extra columns (cgpa, grade, pref) should be shown
  const showExtraColumns = currentRound !== 1;

  // Determine if the Allocate button should be shown
  const showAllocateButton =
    !(user.role === "professor" && (currentRound === null || currentRound > 1));

  // Determine button styling and disabled state
  const allocateButtonClass =
    student.allocationStatus === 1 && student.allocatedTA !== selectedCourse.name
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-[#6495ED] hover:bg-[#3b6ea5] cursor-pointer";
  const allocateButtonDisabled =
    student.allocationStatus === 1 &&
    student.allocatedTA !== selectedCourse.name &&
    currentRound === null;

  return (
    <tr onClick={onRowClick} className="text-center cursor-pointer">
      <td className="border p-2">{student.name}</td>
      <td className="border p-2">{student.emailId}</td>
      <td className="border p-2">{student.program}</td>
      <td className="border p-2">{student.department}</td>
      {showExtraColumns && (
        <>
          <td className="border p-2">{student.cgpa}</td>
          <td className="border p-2">{grade}</td>
          <td className="border p-2">{pref}</td>
        </>
      )}
      {showAllocateButton && (
        <td
          className="border p-2"
          // Prevents the row’s onClick from firing when clicking the Allocate button:
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`${allocateButtonClass} text-white px-2 py-1 rounded-full font-bold text-sm`}
            onClick={() => handleAllocate(student._id)}
            disabled={allocateButtonDisabled}
          >
            Allocate
          </button>
        </td>
      )}
    </tr>
  );
};

const StudentPreferenceCards = ({ student }) => {
  const customLabels = [
    "Name",
    "Email Id",
    "Roll No",
    "CGPA",
    "Program",
    "Department",
    "TA Type",
    "Dept Pref 1",
    "Grade Dept Pref 1",
    "Dept Pref 2",
    "Grade Dept Pref 2",
    "Other Pref 1",
    "Grade Other Pref 1",
    "Other Pref 2",
    "Grade Other Pref 2",
    "Other Pref 3",
    "Grade Other Pref 3",
    "Other Pref 4",
    "Grade Other Pref 4",
    "Other Pref 5",
    "Grade Other Pref 5",
    "Non-Prefs 1",
    "Non-Prefs 2",
    "Non-Prefs 3",
  ];

  // Extract the student data into an ordered array
  const extractedData = customLabels.map((label) => {
    if (label.startsWith("Dept Pref ")) {
      const index = parseInt(label.replace("Dept Pref ", ""), 10) - 1;
      return index < student.departmentPreferences.length
        ? student.departmentPreferences[index].course
        : "";
    } else if (label.startsWith("Grade Dept Pref ")) {
      const index = parseInt(label.replace("Grade Dept Pref ", ""), 10) - 1;
      return index < student.departmentPreferences.length
        ? student.departmentPreferences[index].grade
        : "";
    } else if (label.startsWith("Other Pref ")) {
      const index = parseInt(label.replace("Other Pref ", ""), 10) - 1;
      return index < student.nonDepartmentPreferences.length
        ? student.nonDepartmentPreferences[index].course
        : "";
    } else if (label.startsWith("Grade Other Pref ")) {
      const index = parseInt(label.replace("Grade Other Pref ", ""), 10) - 1;
      return index < student.nonDepartmentPreferences.length
        ? student.nonDepartmentPreferences[index].grade
        : "";
    } else if (label.startsWith("Non-Prefs")) {
      const index = parseInt(label.split(" ")[1], 10) - 1;
      return index < student.nonPreferences.length
        ? student.nonPreferences[index]
        : "";
    } else {
      return student[label.replace(" ", "").toLowerCase()] || "";
    }
  });

  // Define preference groups and indices according to customLabels order.
  const preferenceGroups = [
    {
      title: "Department Preferences",
      items: [
        { label: "Dept Pref 1", index: 7 },
        { label: "Grade Dept Pref 1", index: 8 },
        { label: "Dept Pref 2", index: 9 },
        { label: "Grade Dept Pref 2", index: 10 },
      ],
    },
    {
      title: "Other Preferences",
      items: [
        { label: "Other Pref 1", index: 11 },
        { label: "Grade Other Pref 1", index: 12 },
        { label: "Other Pref 2", index: 13 },
        { label: "Grade Other Pref 2", index: 14 },
        { label: "Other Pref 3", index: 15 },
        { label: "Grade Other Pref 3", index: 16 },
        { label: "Other Pref 4", index: 17 },
        { label: "Grade Other Pref 4", index: 18 },
        { label: "Other Pref 5", index: 19 },
        { label: "Grade Other Pref 5", index: 20 },
      ],
    },
    {
      title: "Non Preferences",
      items: [
        { label: "Non-Prefs 1", index: 21 },
        { label: "Non-Prefs 2", index: 22 },
        { label: "Non-Prefs 3", index: 23 },
      ],
    },
  ];

  return (
    <div className="p-4 bg-gray-100 mt-2 rounded">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {preferenceGroups.map((group, gIndex) => (
          <div
            key={gIndex}
            className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg shadow hover:shadow-lg transition-all duration-300 text-sm border border-gray-200 hover:bg-gray-50 hover:border-[#3dafaa]"
          >
            <h4 className="text-base font-semibold mb-3 border-b pb-2 text-[#3dafaa] border-[#3dafaa]/50">
              {group.title}
            </h4>
            {(group.title === "Department Preferences" ||
              group.title === "Other Preferences") && (
              <>
                <div className="flex font-bold border-b pb-1">
                  <div className="w-1/12 text-center px-2 break-words">
                    S.No
                  </div>
                  <div className="w-7/12 text-center px-2 break-words">
                    Course
                  </div>
                  <div className="w-4/12 text-center px-2 break-words">
                    Grade
                  </div>
                </div>
                {Array.from({ length: group.items.length / 2 }).map((_, i) => {
                  const courseItem = group.items[i * 2];
                  const gradeItem = group.items[i * 2 + 1];
                  const courseName = extractedData[courseItem.index] || "-";
                  let grade = extractedData[gradeItem.index] || "-";
                  if (grade === "Course Not Done") grade = "N/A";
                  return (
                    <div key={i} className="flex border-b py-1">
                      <div className="w-1/12 text-center px-2 break-words">
                        {i + 1}.
                      </div>
                      <div className="w-7/12 text-center px-2 break-words">
                        {courseName}
                      </div>
                      <div className="w-4/12 text-center px-2 break-words">
                        {grade}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {group.title === "Non Preferences" && (
              <>
                <div className="flex font-bold border-b pb-1">
                  <div className="w-1/12 text-center px-2 break-words">
                    S.No
                  </div>
                  <div className="w-7/12 text-center px-2 break-words">
                    Course
                  </div>
                  <div className="w-4/12 text-center px-2 break-words">
                    Grade
                  </div>
                </div>
                {group.items.map((item, i) => {
                  const courseName = extractedData[item.index] || "-";
                  return (
                    <div key={i} className="flex border-b py-1">
                      <div className="w-1/12 text-center px-2 break-words">
                        {i + 1}.
                      </div>
                      <div className="w-7/12 text-center px-2 break-words">
                        {courseName}
                      </div>
                      <div className="w-4/12 text-center px-2 break-words">
                        N/A
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


const renderAllocatedToOthers = (student) => {
  let pref = "Not Any";
  let grade = "No Grade";
  const coursePreference = findCourseInPreferences(student, selectedCourse.name);
  if (coursePreference !== null) {
    pref = coursePreference.preferenceType;
    grade = coursePreference.grade;
  }

  // Only render if student is allocated and the allocatedTA is not the selected course name
  if (!(student.allocationStatus === 1 && student.allocatedTA !== selectedCourse.name)) {
    return null;
  }

  return (
    <tr className="text-center">
      <td className="border p-2">{student.name}</td>
      <td className="border p-2">{student.emailId}</td>
      <td className="border p-2">{student.program}</td>
      <td className="border p-2">{student.department}</td>
      {currentRound === 1 ? null : (
        <>
          <td className="border p-2">{student.cgpa}</td>
          <td className="border p-2">{grade}</td>
          <td className="border p-2">{pref}</td>
        </>
      )}
      <td className="border p-2">{student.allocatedTA}</td>
    </tr>
  );
};

  const handlePrefFilter = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    setFilters((prevFilters) => ({
      ...prevFilters,
      preference: selectedOptions,
    }));
  };

  const handleProgramFilter = (event) => {
    setFilters((prevFilters) => ({
      ...prevFilters, // Keep the previous state
      program: event.target.value, // Update the program property
    }));
  };

  const handleDepartmentFilter = (event) => {
    setFilters((prevFilters) => ({
      ...prevFilters, // Keep the previous state
      department: event.target.value, // Update the department property
    }));
  };



  const handleHomeClick = () => {
    if(user.role ==="jm"){
      navigate('/department/');
    }
    if(user.role==="admin"){
      navigate('/admin/');
    }
    if(user.role==="professor"){
      navigate('/professor/');
    }
  };


  const renderCommonHeader = (title, currentRound, handlePrefFilter) => {
    return (
      <div className="flex flex-wrap items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-2xl font-extrabold text-gray-800 mr-4">{title}</h2>
        {currentRound !== 1 && (
          <div className="flex items-center mr-4 mb-2">
            <span className="mr-2 text-gray-700 font-medium">Preference:</span>
            <MultiSelect
              options={[
                "All",
                "Dept Preference 1",
                "Dept Preference 2",
                "Non-Department Preference 1",
                "Non-Department Preference 2",
                "Non-Department Preference 3",
                "Non-Department Preference 4",
                "Non-Department Preference 5",
                "Not Preferred",
                "Not Any"
              ]}
              onChange={handlePrefFilter}
              className="w-48"
            />
          </div>
        )}
        <div className="flex items-center mr-4 mb-2">
          <span className="mr-2 text-gray-700 font-medium">Program:</span>
          <select
            name=""
            id=""
            className="px-3 py-2 border border-[#3dafaa] rounded focus:outline-none focus:ring-2 focus:ring-[#3dafaa] transition duration-200"
            onChange={handleProgramFilter}
          >
            <option value="All">All</option>
            <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
            <option value="B.Tech 4th Year">B.Tech 4th Year</option>
            <option value="M.Tech 1st Year">M.Tech 1th Year</option>
            <option value="M.Tech 2nd Year">M.Tech 2nd Year</option>
            <option value="PhD">PhD</option>
          </select>
        </div>
        <div className="flex items-center mr-4 mb-2">
          <span className="mr-2 text-gray-700 font-medium">Department:</span>
          <select
            name=""
            id=""
            className="px-3 py-2 border border-[#3dafaa] rounded focus:outline-none focus:ring-2 focus:ring-[#3dafaa] transition duration-200"
            onChange={handleDepartmentFilter}
          >
            <option value="All">All</option>
            <option value="CSE">CSE</option>
            <option value="CB">CB</option>
            <option value="Maths">Maths</option>
            <option value="HCD">HCD</option>
            <option value="ECE">ECE</option>
            <option value="SSH">SSH</option>
          </select>
        </div>
        {title === "Available Students" && (
          <button
            onClick={downloadAvailableStudents}
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-4 py-2 rounded-full font-bold text-sm mb-2"
          >
            Download
          </button>
        )}
      </div>
    );
  };
  

  // New ModularTable component for reusability
const ModularTable = ({ children }) => (
  <div className="shadow-2xl rounded-3xl overflow-hidden border">
    <table className="w-full border-collapse border">
      {children}
    </table>
  </div>
);

const renderSortButton = (label, sortKey) => (
  <button onClick={() => handleSort(sortKey)} className="flex justify-center">
    {label}{" "}
    {sortConfig.key === sortKey &&
      (sortConfig.direction === "ascending" ? (
        <AiOutlineSortAscending />
      ) : (
        <AiOutlineSortDescending />
      ))}
  </button>
);

return (
  <div>
    <div className="flex flex-wrap items-center justify-between mb-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center flex-wrap">
      <h1 className="text-2xl font-extrabold text-gray-800 mr-4 mb-2">{selectedCourse.name},</h1>
      <div className="flex items-center space-x-2 text-gray-700 font-medium mb-2">
        <p className="text-base">Ongoing Round:</p>
        <p className="text-base">Round</p>
        <p className="text-base font-semibold">{currentRound}</p>
      </div>
    </div>
  </div>

  <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 -mb-4">
    <div className="flex flex-wrap items-center space-x-2">
      <button
        type="button"
        className="px-4 py-2 rounded-full border border-[#3dafaa] text-[#3dafaa] hover:bg-[#3dafaa] hover:text-white transition"
        onClick={handleHomeClick}
      >
        Home
      </button>

      <button
        type="button"
        className={`px-4 py-2 rounded-full border border-[#3dafaa] transition ${
          allocated === 0 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
        } hover:bg-[#3dafaa] hover:text-white`}
        onClick={handleRenderAvailableStudentTable}
      >
        Available Student
      </button>

      <button
        type="button"
        className={`px-4 py-2 rounded-full border border-[#3dafaa] transition ${
          allocated === 1 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
        } hover:bg-[#3dafaa] hover:text-white`}
        onClick={handleRenderAllocatedTable}
      >
        Student Allocated to {selectedCourse.acronym}
      </button>

      <button
        type="button"
        className={`px-4 py-2 rounded-full border border-[#3dafaa] transition ${
          allocated === 2 ? "bg-[#3dafaa] text-white" : "text-[#3dafaa]"
        } hover:bg-[#3dafaa] hover:text-white`}
        onClick={handleRenderAllocatedToOthersTable}
      >
        Student Allocated to others courses
      </button>
    </div>

    <form className="mt-4 sm:mt-0 w-full sm:w-[350px]">
      <div className="relative ">
        <input
          type="search"
          placeholder="Search Student..."
          className="w-full py-2 px-4 pr-10 rounded-full border border-[#3dafaa] outline-none focus:ring-2 focus:ring-[#3dafaa] transition"
          value={searchQuery}
          onChange={handleSearch}
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2 bg-[#3dafaa] text-white rounded-full hover:bg-[#349d95] transition"
        >
          <AiOutlineSearch />
        </button>
      </div>
    </form>


      {allocated === 1 && (
        <div>
          <button
            className="bg-[#4E9F3D] text-white px-4 py-2 rounded-full text-base font-medium cursor-pointer mr-4 hover:brightness-105 transition duration-200"

            onClick={handlePreview}
          >
            Preview Data
          </button>
          <button
            className="bg-[#F4A261] text-white px-4 py-2 rounded-full text-base font-medium cursor-pointer mr-4 hover:brightness-105 transition duration-200"

            onClick={handleDownload}
          >
            Download
          </button>
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            data={previewData}
            courseTitle={selectedCourse.name}
            allocated={allocated}
            currentRound={currentRound}
          />
        </div>
      )}
    </div>

    {allocated === 1 && (
      <div className="m-5">
        {renderCommonHeader(
          `Allocated Students to ${courseName}`,
          currentRound,
          handlePrefFilter
        )}

        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <ModularTable>
            <thead className="sticky top-0">
              <tr className="bg-[#3dafaa] text-white">
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Name", "name")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Email", "emailId")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Program", "program")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Department", "department")}
                  </div>
                </th>
                {currentRound !== 1 && (
                  <>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("CGPA", "cgpa")}
                      </div>
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      Grade
                    </th>
                    <th className="border p-2 text-center bg-[#3dafaa] text-white">
                      <div className="flex justify-center">
                        {renderSortButton("Preference", "preference")}
                      </div>
                    </th>
                  </>
                )}
                {user.role === "professor" &&
                (currentRound === null || currentRound > 1) ? null : (
                  <th className="border p-2 bg-[#3dafaa] text-white">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => renderAllocatedRow(student))}
            </tbody>
          </ModularTable>
        </div>
      </div>
    )}


{allocated === 0 && (
  <div className="m-5">
    {renderCommonHeader("Available Students", currentRound, handlePrefFilter)}
    <div
      className="overflow-auto"
      style={{ maxHeight: "calc(100vh - 260px)" }}
    >
      <ModularTable>
        <thead className="sticky top-0">
          <tr className="bg-[#3dafaa] text-white">
            <th className="border p-2 text-center bg-[#3dafaa] text-white">
              <div className="flex justify-center">
                {renderSortButton("Name", "name")}
              </div>
            </th>
            <th className="border p-2 text-center bg-[#3dafaa] text-white">
              <div className="flex justify-center">
                {renderSortButton("Email", "emailId")}
              </div>
            </th>
            <th className="border p-2 text-center bg-[#3dafaa] text-white">
              <div className="flex justify-center">
                {renderSortButton("Program", "program")}
              </div>
            </th>
            <th className="border p-2 text-center bg-[#3dafaa] text-white">
              <div className="flex justify-center">
                {renderSortButton("Department", "department")}
              </div>
            </th>
            {currentRound !== 1 && (
              <>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("CGPA", "cgpa")}
                  </div>
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  Grade
                </th>
                <th className="border p-2 text-center bg-[#3dafaa] text-white">
                  <div className="flex justify-center">
                    {renderSortButton("Preference", "preference")}
                  </div>
                </th>
              </>
            )}
            {user.role === "professor" &&
            (currentRound === null || currentRound > 1) ? null : (
              <th className="border p-2 bg-[#3dafaa] text-white">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <React.Fragment key={student._id}>
              {renderAvailableRow(student, () => toggleExpanded(student._id))}
              {expandedStudentId === student._id && (
                <tr>
                  <td colSpan={currentRound !== 1 ? 8 : 5}>
                    <StudentPreferenceCards student={student} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </ModularTable>
    </div>
  </div>
)}

    {allocated === 2 && (
      <div className="m-5">
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Allocated Students to other courses
          </h2>
          {currentRound !== 0 && (
            <div className="flex items-center space-x-2">
              <h2 className="text-gray-700 font-medium">Preference:</h2>
              <MultiSelect
                options={[
                  "All",
                  "Dept Preference 1",
                  "Dept Preference 2",
                  "Non-Department Preference 1",
                  "Non-Department Preference 2",
                  "Non-Department Preference 3",
                  "Non-Department Preference 4",
                  "Non-Department Preference 5",
                  "Not Preferred",
                  "Not Any",
                ]}
                onChange={handlePrefFilter}
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <h2 className="text-gray-700 font-medium">Program:</h2>
            <select
              className="px-3 py-2 border border-[#3dafaa] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3dafaa]"
              onChange={handleProgramFilter}
            >
              <option value="All">All</option>
              <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
              <option value="B.Tech 4th Year">B.Tech 4th Year</option>
              <option value="M.Tech 1th Year">M.Tech 1th Year</option>
              <option value="M.Tech 2nd Year">M.Tech 2nd Year</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <h2 className="text-gray-700 font-medium">Department:</h2>
            <select
              className="px-3 py-2 border border-[#3dafaa] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3dafaa]"
              onChange={handleDepartmentFilter}
            >
              <option value="All">All</option>
              <option value="CSE">CSE</option>
              <option value="CB">CB</option>
              <option value="Maths">Maths</option>
              <option value="HCD">HCD</option>
              <option value="ECE">ECE</option>
              <option value="SSH">SSH</option>
            </select>
          </div>
        </div>
        <div className="overflow-auto rounded-md shadow-sm border border-gray-200 bg-white" style={{ maxHeight: "calc(100vh - 260px)" }}>
          <ModularTable>
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#3dafaa] text-white text-sm">
                <th className="border p-2 text-center">
                  <div className="flex justify-center">
                    {renderSortButton("Name", "name")}
                  </div>
                </th>
                <th className="border p-2 text-center">
                  <div className="flex justify-center">
                    {renderSortButton("Email", "emailId")}
                  </div>
                </th>
                <th className="border p-2 text-center">
                  <div className="flex justify-center">
                    {renderSortButton("Program", "program")}
                  </div>
                </th>
                <th className="border p-2 text-center">
                  <div className="flex justify-center">
                    {renderSortButton("Department", "department")}
                  </div>
                </th>
                {currentRound !== 1 && (
                  <>
                    <th className="border p-2 text-center">
                      <div className="flex justify-center">
                        {renderSortButton("CGPA", "cgpa")}
                      </div>
                    </th>
                    <th className="border p-2 text-center">
                      Grade
                    </th>
                    <th className="border p-2 text-center">
                      <div className="flex justify-center">
                        {renderSortButton("Preference", "preference")}
                      </div>
                    </th>
                  </>
                )}
                <th className="border p-2 bg-[#3dafaa] text-white">
                  Allocated To
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) =>
                renderAllocatedToOthers(student)
              )}
            </tbody>
          </ModularTable>
        </div>
      </div>
    )}
  </div>
);
};

export default CoursePage;
