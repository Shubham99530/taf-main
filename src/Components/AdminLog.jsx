import React, { useContext, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import StudentContext from "../context/StudentContext";

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
          <th key={index} className="border-b py-3 px-4 text-center font-semibold">
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
    if (!searchTerm) return logs;
    return logs.filter((logEntry) => {
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

  const sortLogsByTimestamp = (logs) => {
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
      <td className="border-b py-2 px-3">
        {logEntry.student ? logEntry.student.rollNo : "N/A"}
      </td>
      <td className="border-b py-2 px-3">
        {logEntry.student ? logEntry.student.name : "N/A"}
      </td>
      <td className="border-b py-2 px-3">{logEntry.action}</td>
      <td className="border-b py-2 px-3">{logEntry.userEmailId}</td>
      <td className="border-b py-2 px-3">
        {new Date(logEntry.timestamp).toLocaleString()}
      </td>
      <td className="border-b py-2 px-3">
        {logEntry.course ? logEntry.course.name : "N/A"}
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex mt-4 justify-between">
        <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <input
              type="search"
              placeholder="Search Logs..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e, "search")}
              className="w-full p-4 rounded-full h-10 border border-[#6495ED] outline-none focus:border-[#3b6ea5]"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
      </div>
      <div className="overflow-auto w-full max-h-[82vh] mt-2">
        <div className="shadow-2xl rounded-3xl overflow-hidden border">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0">{renderHeaderRow()}</thead>
            <tbody>{sortedLogs.map((logEntry, index) => renderLogRow(logEntry, index))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLog;
