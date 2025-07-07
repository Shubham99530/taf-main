import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import AuthContext from '../context/AuthContext';

const FeedbackList = () => {
  const { user } = useContext(AuthContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editableFeedbackId, setEditableFeedbackId] = useState(null);
  const [editedFeedback, setEditedFeedback] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const containerRef = useRef();
  const API = import.meta.env.VITE_API_URL;
  const limit = 20;

  const columnWidths = [
    'w-[100px]', 'w-[120px]', 'w-[180px]', 'w-[120px]', 'w-[140px]',
    'w-[140px]', 'w-[160px]', 'w-[140px]', 'w-[160px]', 'w-[160px]',
    'w-[100px]', 'min-w-[240px]', 'w-[140px]'
  ];

  useEffect(() => {
    setPage(1);
    setFeedbacks([]);
    fetchFeedbacks(1);
  }, [user]);

  const fetchFeedbacks = async (pageNumber) => {
    try {
      let response;
      if (user?.role === 'professor') {
        response = await axios.get(`${API}/api/feedback/professor/${user.id}?page=${pageNumber}&limit=${limit}`);
      } else if (user?.role === 'admin') {
        response = await axios.get(`${API}/api/feedback/all?page=${pageNumber}&limit=${limit}`);
      }
      const fetchedFeedbacks = response?.data.feedbacks || [];
      setTotal(response?.data.total || 0);
      setFeedbacks((prev) => [...prev, ...fetchedFeedbacks]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      setLoading(false);
    }
  };

  const handleEditClick = (feedback) => {
    setEditedFeedback(feedback);
    setEditableFeedbackId(feedback._id);
  };

  const handleSave = async () => {
    if (editedFeedback.nominatedForBestTA && !editedFeedback.comments) {
      alert('Please provide a comment if you nominate a student for Best TA.');
      return;
    }
    try {
      await axios.put(`${API}/api/feedback/${editableFeedbackId}`, editedFeedback);
      setEditableFeedbackId(null);
      setPage(1);
      setFeedbacks([]);
      fetchFeedbacks(1);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleCancel = () => {
    setEditableFeedbackId(null);
    setEditedFeedback({});
  };

  const handleChange = (e, key) => {
    setEditedFeedback((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API}/api/feedback/download`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to download feedbacks');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'feedbacks.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading feedbacks:', error);
      alert('Error downloading feedbacks');
    }
  };

  const headers = [
    "Roll No.", "Name", "Course", "Overall Grade", "Regularity",
    "Attendance", "Tutorial Prep", "Timeliness", "Quality of Work",
    "Commitment", "Best TA", "Comments"
  ];

  const renderHeaderRow = () => (
    <tr className="bg-[#3dafaa] text-white">
      {headers.map((header, index) => (
        <th key={index} className={`sticky top-0 border-b py-3 px-2 text-center font-semibold ${columnWidths[index]}`}>
          {header}
        </th>
      ))}
      {user?.role === 'professor' && (
        <th className={`sticky top-0 border-b py-3 px-2 text-center font-semibold ${columnWidths[12]}`}>
          Actions
        </th>
      )}
    </tr>
  );

  const sortFeedbacksByTimestamp = (feedbacks) => 
    [...feedbacks].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const sortedFeedbacks = sortFeedbacksByTimestamp(feedbacks);

  const renderFeedbackRow = (feedback, index) => (
    <tr className="text-center" key={index}>
      <td className={`border-b py-2 px-2 ${columnWidths[0]}`}>{feedback.student?.rollNo || "N/A"}</td>
      <td className={`border-b py-2 px-2 ${columnWidths[1]}`}>{feedback.student?.name || "N/A"}</td>
      <td className={`border-b py-2 px-2 ${columnWidths[2]}`}>{feedback.course?.name || "N/A"}</td>
      <td className={`border-b py-2 px-2 ${columnWidths[3]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.overallGrade || ''}
            onChange={(e) => handleChange(e, 'overallGrade')}
            className="w-full text-sm"
          >
            <option value="S">S</option>
            <option value="X">X</option>
          </select>
        ) : feedback.overallGrade}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[4]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.regularityInMeeting || ''}
            onChange={(e) => handleChange(e, 'regularityInMeeting')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.regularityInMeeting}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[5]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.attendanceInLectures || ''}
            onChange={(e) => handleChange(e, 'attendanceInLectures')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.attendanceInLectures}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[6]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.preparednessForTutorials || ''}
            onChange={(e) => handleChange(e, 'preparednessForTutorials')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.preparednessForTutorials}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[7]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.timelinessOfTasks || ''}
            onChange={(e) => handleChange(e, 'timelinessOfTasks')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.timelinessOfTasks}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[8]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.qualityOfWork || ''}
            onChange={(e) => handleChange(e, 'qualityOfWork')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.qualityOfWork}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[9]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.attitudeCommitment || ''}
            onChange={(e) => handleChange(e, 'attitudeCommitment')}
            className="w-full text-sm"
          >
            <option value="NA">NA</option>
            <option value="Average">Average</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Below Average">Below Average</option>
          </select>
        ) : feedback.attitudeCommitment}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[10]}`}>
        {editableFeedbackId === feedback._id ? (
          <select
            value={editedFeedback.nominatedForBestTA ?? false}
            onChange={(e) => handleChange(e, 'nominatedForBestTA')}
            className="w-full text-sm"
          >
            <option value={false}>No</option>
            <option value={true}>Yes</option>
          </select>
        ) : feedback.nominatedForBestTA ? 'Yes' : 'No'}
      </td>
      <td className={`border-b py-2 px-2 ${columnWidths[11]}`}>
        {editableFeedbackId === feedback._id ? (
          <input
            type="text"
            value={editedFeedback.comments || ''}
            onChange={(e) => handleChange(e, 'comments')}
            className="border rounded px-2 py-1 w-full text-sm"
          />
        ) : feedback.comments || 'N/A'}
      </td>
      {user?.role === 'professor' && (
        <td className={`border-b py-2 px-2 ${columnWidths[12]}`}>
          {editableFeedbackId === feedback._id ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm whitespace-nowrap"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm whitespace-nowrap"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm w-full whitespace-nowrap"
              onClick={() => handleEditClick(feedback)}
            >
              Edit
            </button>
          )}
        </td>
      )}
    </tr>
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex w-full justify-end mb-4 px-4">
        {user?.role === 'admin' && (
          <button
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white font-bold px-4 py-2 rounded-full text-sm"
            onClick={handleDownload}
          >
            Download
          </button>
        )}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          ref={containerRef}
          className="w-full overflow-auto px-4"
          style={{ maxHeight: 'calc(100vh - 150px)' }}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollHeight - scrollTop <= clientHeight + 50 && feedbacks.length < total) {
              setPage(prev => prev + 1);
              fetchFeedbacks(page + 1);
            }
          }}
        >
          <div className="shadow-2xl rounded-xl overflow-hidden border">
            <table className="min-w-full table-fixed border-collapse">
              <thead className="sticky top-0 z-10">{renderHeaderRow()}</thead>
              <tbody>
                {sortedFeedbacks.map((feedback, index) => renderFeedbackRow(feedback, index))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;