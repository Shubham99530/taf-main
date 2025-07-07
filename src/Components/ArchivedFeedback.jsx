import React, { useState, useEffect } from "react";
import axios from "axios";

const ArchivedFeedback = () => {
  const [archivedFeedback, setArchivedFeedback] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [allSemesters, setAllSemesters] = useState([]);
  const API = import.meta.env.VITE_API_URL;
  const limit = 20;

  // Load semester list
  useEffect(() => {
    axios
      .get(`${API}/api/archived-feedback/semesters`)
      .then(res => setAllSemesters(res.data.semesters))
      .catch(err => console.error("Error fetching semesters:", err));
  }, [API]);

  // Fetch a page of archived feedback
  const fetchArchivedFeedback = async (pageNumber) => {
    setLoading(true);
    const query = selectedSemester
      ? `?semester=${selectedSemester}&page=${pageNumber}&limit=${limit}`
      : `?page=${pageNumber}&limit=${limit}`;
    try {
      const res = await axios.get(`${API}/api/archived-feedback${query}`);
      console.log("Fetched feedback page", pageNumber, res.data.archivedFeedback);
      setTotal(res.data.total || 0);

      setArchivedFeedback(prev =>
        pageNumber === 1
          ? (res.data.archivedFeedback || [])
          : [
              ...prev,
              ...(res.data.archivedFeedback || []).filter(
                newItem => !prev.some(existing => existing._id === newItem._id)
              )
            ]
      );
    } catch (e) {
      console.error("Error fetching archived feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load & reload on semester change
  useEffect(() => {
    setPage(1);
    fetchArchivedFeedback(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

  // Infinite scroll handler
  const handleScroll = ({ target }) => {
    if (
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50 &&
      archivedFeedback.length < total && !loading
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchArchivedFeedback(nextPage);
    }
  };

  // Download Excel
  const downloadFeedback = async () => {
    const query = selectedSemester ? `?semester=${selectedSemester}` : "";
    try {
      const res = await axios.get(`${API}/api/archived-feedback/download${query}`, {
        responseType: "arraybuffer",
      });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const filename = selectedSemester
        ? `archivedFeedback_${selectedSemester}.xlsx`
        : "archivedFeedback.xlsx";
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Error downloading feedback:", e);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4">Archived Feedback</h1>

      <div className="mb-4 flex gap-4">
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          className="border px-3 py-1 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-[#6495ED]"
        >
          <option value="">All Semesters</option>
          {allSemesters.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={downloadFeedback}
          className="bg-[#6495ED] text-white px-3 py-1 rounded-full shadow hover:bg-[#3b6ea5]"
        >
          Download
        </button>
      </div>

      {loading && archivedFeedback.length === 0 ? (
        <p>Loading archived feedback...</p>
      ) : (
        <div
          className="overflow-auto w-full mt-4 border rounded-lg shadow-lg"
          style={{ height: 'calc(100vh - 200px)' }}
          onScroll={handleScroll}
        >
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-[#3dafaa] text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">Course</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Student</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Professor</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Grade</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Best TA?</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Comments</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Semester</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Archived Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedFeedback.map(item => {
                const courseDisplay = item.courseCode && item.courseName
                  ? `${item.courseCode} – ${item.courseName}`
                  : '-';
                const studentDisplay = item.studentRollNo && item.studentName
                  ? `${item.studentRollNo} – ${item.studentName}`
                  : '-';
                const profDisplay = item.professorName || '-';
                return (
                  <tr key={item._id}>
                    <td className="px-4 py-2 break-words">{courseDisplay}</td>
                    <td className="px-4 py-2 break-words">{studentDisplay}</td>
                    <td className="px-4 py-2 break-all">{item.studentEmail || '-'}</td>
                    <td className="px-4 py-2 break-words">{profDisplay}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.overallGrade || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.nominatedForBestTA ? "Yes" : "No"}</td>
                    <td className="px-4 py-2 break-words">{item.comments || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.semester}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(item.archivedDate).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {archivedFeedback.length < total && (
            <div className="p-4 text-center text-gray-500">Loading more…</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchivedFeedback;
