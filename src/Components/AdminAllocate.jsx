import React, { useContext, useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "../App.css";
import AuthContext from "../context/AuthContext";
import CourseContext from "../context/CourseContext";
import DepartmentContext from "../context/DepartmentContext";
import AllocateHeader from "./AllocateHeader";

const Department = () => {
  const { departmentCourses } = useContext(DepartmentContext);
  const { setSelectedCourse } = useContext(CourseContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRound, setCurrentRound] = useState(null);
  const [allocationStatus, setAllocationStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const header = [
    "Name",
    "Code",
    "Acronym",
    "Department",
    "Credits",
    "Faculty",
    "Total Students",
    "TA Required",
    "TA Allocated",
    "Action",
  ];

  const API = import.meta.env.VITE_API_URL;

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
    fetchCurrentRound();
  }, []);

  const allocateCourse = (course) => {
    setSelectedCourse(course);
    navigate(`${course.name}`);
  };

  const renderHeaderRow = () => {
    if (departmentCourses.length === 0) {
      return (
        <tr>
          <th className="bg-[#3dafaa] shadow-lg rounded-lg p-3 text-center font-bold text-white">
            Course Data
          </th>
        </tr>
      );
    } else {
      return (
        <tr className="bg-[#3dafaa] shadow-lg rounded-lg p-3 text-white">
          {header.map((key) => (
            <th key={key} className="border-b py-3 px-4 text-center font-semibold">
              {key}
            </th>
          ))}
        </tr>
      );
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredCourseByAllocationStatus = (coursesList) => {
    if (allocationStatus === "All") {
      return coursesList;
    }
    const courseList = [];
    for (const course of coursesList) {
      if (
        allocationStatus === "Over Allocation" &&
        course.taAllocated.length > course.taRequired
      ) {
        courseList.push(course);
      } else if (
        allocationStatus === "Under Allocation" &&
        course.taAllocated.length < course.taRequired
      ) {
        courseList.push(course);
      } else if (
        allocationStatus === "Complete Allocation" &&
        course.taAllocated.length === course.taRequired
      ) {
        courseList.push(course);
      }
    }
    return courseList;
  };

  const filteredCourses = filteredCourseByAllocationStatus(departmentCourses).filter(
    (course) =>
      (user.department === "all" || course.department === user.department) &&
      (course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAllocationStatus = (event) => {
    setAllocationStatus(event.target.value);
  };

  const lastCompletedRound = async () => {
    try {
      const response = await fetch(`${API}/api/rd/getLastRound`);
      if (response.status === 200) {
        const res = await response.json();
        return res.Round;
      } else {
        const res = await response.json();
        alert(res.message);
      }
    } catch (error) {
      console.error("Error fetching last completed round:", error);
    }
  };

  const handleDownloadAllocations = async () => {
    try {
      let lastRoundValue;
      if (currentRound == null) {
        lastRoundValue = await lastCompletedRound();
      }
      const response = await fetch(`${API}/api/al/getAllAllocation`);
      if (response.status === 200) {
        const res = await response.json();
        const ws = XLSX.utils.json_to_sheet(res.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(
          wb,
          `Round_${currentRound == null ? lastRoundValue : currentRound}_Allocation.xlsx`
        );
      } else {
        const res = await response.json();
        alert(res.message);
      }
    } catch (error) {
      console.error("Error downloading complete allocation:", error);
    }
  };

  const handleEmailReminders = async (status) => {
    try {
      const endpoint = `${API}/api/snd/sendem`;
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationStatus: status }),
      };
      const response = await fetch(endpoint, requestOptions);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }
      await response.json();
      alert("Email reminders sent successfully!");
    } catch (error) {
      alert(`Error sending email reminders: ${error.message}`);
    }
  };

  return (
    <div>
      <AllocateHeader />
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
          <form className="w-[500px] relative mr-3" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <input
                type="search"
                placeholder="Search Course by Name/Code/Acronym..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full"
              >
                <AiOutlineSearch />
              </button>
            </div>
          </form>
          <div className="flex items-center">
            <p className="font-bold mr-1">Allocation Status:</p>
            <select
              className="px-2 py-2 border border-[#3dafaa] rounded inline-block"
              onChange={handleAllocationStatus}
            >
              <option value="All">All</option>
              <option value="Over Allocation" className="text-red-500">
                Over Allocation
              </option>
              <option value="Under Allocation" className="text-yellow-500">
                Under Allocation
              </option>
              <option value="Complete Allocation">Complete Allocation</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          {(allocationStatus === "Over Allocation" && user.role === "admin" ||
            allocationStatus === "Under Allocation" && user.role === "admin") && (
            <button
              className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold mr-4 text-sm"
              onClick={() => handleEmailReminders(allocationStatus)}
            >
              Email Reminder
            </button>
          )}
          <button
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
            onClick={handleDownloadAllocations}
          >
            Download Allocation
          </button>
        </div>
      </div>
      <div className="max-w-full max-h-[75vh] overflow-auto">
        <div className="shadow-2xl rounded-3xl overflow-hidden border">
          <table className="border-collapse border w-full table-fixed">
            <thead className="sticky top-0">{renderHeaderRow()}</thead>
            <tbody>
              {filteredCourses.map((row, index) => (
                <tr className="text-center" key={index}>
                  {Object.values(row).map((data, ind) =>
                    ind !== 0 && ind !== 10 && ind !== 8 ? (
                      <td
                        className={`border p-2 ${
                          row.taAllocated.length > row.taRequired
                            ? "text-red-500"
                            : row.taAllocated.length < row.taRequired && currentRound >= 2
                            ? "text-yellow-500"
                            : "text-black"
                        }`}
                        key={ind}
                      >
                        {ind === 11 ? row.taAllocated.length : data}
                      </td>
                    ) : null
                  )}
                  <td className="border p-2">
                    <button
                      onClick={() => allocateCourse(row)}
                      className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                    >
                      Allocate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Department;
