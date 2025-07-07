import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function NominationsPage() {
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/feedback/nominations`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(data => setNominees(data))
      .catch(err => {
        console.error(err);
        setError('Could not load nominations.');
      })
      .finally(() => setLoading(false));
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <p className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full animate-pulse">
            Loading nominations…
          </p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-10">
          <p className="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-full">
            {error}
          </p>
        </div>
      );
    }
    if (nominees.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 italic">No TA nominations this semester.</p>
        </div>
      );
    }

    return (
      <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        {nominees.map(n => (
          <li
            key={n._id}
            className="p-5 bg-blue-100/80 hover:bg-blue-200/90 backdrop-blur-sm border border-blue-300 rounded-2xl shadow-sm transition-all duration-300"
          >
            <p className="text-xl font-semibold text-gray-800">
              {n.student.name}
              <span className="ml-2 text-sm text-gray-600">({n.student.rollNo})</span>
            </p>
            <p className="text-blue-800 font-medium mt-1">
              {n.course.code} — <span className="italic">{n.course.name}</span>
            </p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md shadow-lg rounded-3xl p-10 border border-blue-200">
        <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8">
          🏆 Best-TA Nominations
        </h1>
        {renderContent()}
      </div>
    </div>
  );
}
