import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;

const getCurrentSemester = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return m <= 6 ? `Winter-${y}` : `Monsoon-${y}`;
};

const getPreviousSemester = (sem) => {
  const [term, yearStr] = sem.split('-');
  const year = parseInt(yearStr, 10);
  return term === 'Winter' ? `Monsoon-${year - 1}` : `Winter-${year}`;
};

const NominationsList = () => {
  const [currentNoms, setCurrentNoms] = useState([]);
  const [prevNoms, setPrevNoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentSem = getCurrentSemester();
  const previousSem = getPreviousSemester(currentSem);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [{ data: curr }, { data: prev }] = await Promise.all([
          axios.get('/api/feedback/nominations'),
          axios.get(`/api/feedback/archived-nominations?semester=${previousSem}`)
        ]);
        setCurrentNoms(curr);
        setPrevNoms(prev);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [previousSem]);

  if (loading) return <p>Loading nominations...</p>;
  if (error)   return <p className="text-red-500">Error: {error}</p>;

  const normalizeRollNo = (rollNo) => rollNo.toUpperCase();
  const currentRollMap = new Map();
  currentNoms.forEach(n => currentRollMap.set(normalizeRollNo(n.student.rollNo), n));

  const distinguished = prevNoms
    .filter(n => currentRollMap.has(normalizeRollNo(n.student.rollNo)))
    .map(n => {
      const roll = normalizeRollNo(n.student.rollNo);
      return {
        student: { name: n.student.name, rollNo: roll },
        course: { name: `${currentRollMap.get(roll).course.name} & ${n.course.name}` }
      };
    });

  const handleDownload = (noms, sheetName, fileName) => {
    const flat = noms.map(n => ({
      'Student Name': n.student.name,
      'Roll Number': n.student.rollNo,
      'Course Name': n.course.name
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
  };

  const renderTable = (nominations) => (
    <div className="overflow-auto max-h-80 border border-gray-200 rounded-md shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-[#3dafaa] text-white sticky top-0 z-10">
          <tr>
            <th className="border px-4 py-2">Student Name</th>
            <th className="border px-4 py-2">Roll Number</th>
            <th className="border px-4 py-2">Course Name</th>
          </tr>
        </thead>
        <tbody>
          {nominations.map((n, idx) => (
            <tr key={`${n.student.rollNo}-${idx}`} className="hover:bg-gray-50">
              <td className="border px-4 py-2">{n.student.name}</td>
              <td className="border px-4 py-2">{n.student.rollNo}</td>
              <td className="border px-4 py-2">{n.course.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 space-y-8 min-h-screen">
      <section>
        <h3 className="text-lg font-medium mb-2">
          🏷️ Nominations for <span className="font-semibold">{currentSem}</span>
        </h3>
        {currentNoms.length ? (
          <>
            <button
              onClick={() => handleDownload(currentNoms, currentSem, `Nominations_${currentSem}.xlsx`)}
              className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >Download Excel</button>
            {renderTable(currentNoms)}
          </>
        ) : <p>No nominations this semester.</p>}
      </section>

      {/* Commented out the previous semester section */}
      {/* 
      <section>
        <h3 className="text-lg font-medium mb-2">
          🏷️ Nominations for <span className="font-semibold">{previousSem}</span>
        </h3>
        {prevNoms.length ? (
          <>
            <button
              onClick={() => handleDownload(prevNoms, previousSem, `Nominations_${previousSem}.xlsx`)}
              className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >Download Excel</button>
            {renderTable(prevNoms)}
          </>
        ) : <p>No nominations in {previousSem}.</p>}
      </section>
      */}

      <section>
        <h3 className="text-lg font-medium mb-2">
          🏅 Distinguished TA Awards (Nominated in both {previousSem} and {currentSem})
        </h3>
        {distinguished.length ? (
          <>
            <button
              onClick={() => handleDownload(distinguished, 'Distinguished', `Distinguished_TA_${previousSem}_${currentSem}.xlsx`)}
              className="mb-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >Download Excel</button>
            {renderTable(distinguished)}
          </>
        ) : <p>No Distinguished TAs.</p>}
      </section>
    </div>
  );
};

export default NominationsList;
