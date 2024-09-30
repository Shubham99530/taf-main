import React, { useContext, useState } from "react";
import StudentContext from "../context/StudentContext";
import { AiOutlineSearch } from "react-icons/ai";

const AdminLog = () => {
  const { logs } = useContext(StudentContext);
  const [searchTerm, setSearchTerm] = useState("");

  const headers = [
    "Student ID",
    "Student Name",
    "Action",
    "User",
    "Timestamp",
    "Course",
  ];

  const renderHeaderRow = () => {
    return (
      <tr className="bg-[#3dafaa] text-white">
        {headers.map((header, index) => (
          <th className="border p-2 text-center" key={index}>
            {header}
          </th>
        ))}
      </tr>
    );
  };

  const handleInputChange = (e, key) => {
    if (key === "search") {
      setSearchTerm(e.target.value);
    }
  };

  const filterLogs = (logs, searchTerm) => {
    if (!searchTerm) {
      return logs;
    }
    return logs.filter(logEntry => {
      const studentName = logEntry.student?.name.toLowerCase() || "";
      const courseName = logEntry.course?.name.toLowerCase() || "";
      const action = logEntry.action.toLowerCase();
      const userEmailId = logEntry.userEmailId.toLowerCase();
      const term = searchTerm.toLowerCase();
      return (
        studentName.includes(term) ||
        courseName.includes(term) ||
        action.includes(term) ||
        userEmailId.includes(term)
      );
    });
  };

  const sortLogsByTimestamp = logs => {
    return logs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });
  };

  const filteredLogs = filterLogs(logs, searchTerm);
  const sortedLogs = sortLogsByTimestamp(filteredLogs);

  const renderLogRow = (logEntry, index) => (
    <tr className="text-center" key={index}>
      <td className="border p-2">
        {logEntry.student ? logEntry.student.rollNo : "N/A"}
      </td>
      <td className="border p-2">
        {logEntry.student ? logEntry.student.name : "N/A"}
      </td>
      <td className="border p-2">{logEntry.action}</td>
      <td className="border p-2">{logEntry.userEmailId}</td>
      <td className="border p-2">
        {new Date(logEntry.timestamp).toLocaleString()}
      </td>
      <td className="border p-2">
        {logEntry.course ? logEntry.course.name : "N/A"}
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex mt-4 justify-between">
        <form className="w-[350px]">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Logs..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e, "search")}
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
      </div>
      <div className="overflow-auto max-w-[83vw] max-h-[82vh] mt-2">
        <table className="w-full border-collapse border">
          <thead className="sticky top-0">{renderHeaderRow()}</thead>
          <tbody>
            {sortedLogs.map((logEntry, index) => renderLogRow(logEntry, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLog;
