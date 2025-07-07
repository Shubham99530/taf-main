import React, { useContext, useEffect, useState, useCallback } from "react";
import { GoDotFill } from "react-icons/go";
import "../App.css";
import AuthContext from "../context/AuthContext";
import DepartmentContext from "../context/DepartmentContext";

const AllocateHeader = () => {
  const { user } = useContext(AuthContext);
  const { departments, selectedDepartment, setSelectedDepartment } = useContext(DepartmentContext);
  const [currentRound, setCurrentRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  // Memoized handler to change department selection
  const handleDepartmentChange = useCallback((event) => {
    setSelectedDepartment(event.target.value);
  }, [setSelectedDepartment]);

  // Memoized logout handler (consider using your router's navigation if available)
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    window.location.replace(API);
  }, [API]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchCurrentRound = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/api/rd/currentround`, { signal });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setCurrentRound(data.currentRound);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching round status:", err);
          setError("Failed to load current round.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentRound();

    return () => {
      controller.abort();
    };
  }, [API]);

  return (
    <header className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-center mb-2 sm:mb-0 mr-4">
          <h1 className="text-[#3dafaa] text-2xl font-bold mr-4">
            {selectedDepartment} Department
          </h1>
          <div className="mt-2 sm:mt-0">
            <label htmlFor="department-select" className="sr-only">
              Select Department
            </label>
            <select
              id="department-select"
              className="px-4 py-2 border border-[#3dafaa] rounded focus:outline-none focus:ring-2 focus:ring-[#3dafaa]"
              value={user.role === "admin" ? selectedDepartment : user.department}
              onChange={handleDepartmentChange}
              disabled={user.role !== "admin"}
              aria-label="Select Department"
            >
              <option value="All">All</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center mb-2 sm:mb-0">
          <p className="text-[#3dafaa] text-xl font-bold mr-2">Ongoing Round:</p>
          {loading ? (
            <p className="text-xl">Loading...</p>
          ) : error ? (
            <p className="text-xl text-red-500" role="alert">{error}</p>
          ) : (
            <p className="text-xl flex mr-1">Round {currentRound}</p>
          )}
        </div>

        <div className="flex items-center ml-2">
          <div className="flex items-center mr-2" title="Red courses are overallocated">
            <GoDotFill className="text-red-500" />
            <span className="ml-1 text-sm">Overallocated</span>
          </div>
          {currentRound >= 2 && (
            <div className="flex items-center" title="Yellow courses are underallocated">
              <GoDotFill className="text-yellow-500" />
              <span className="ml-1 text-sm">Underallocated</span>
            </div>
          )}
        </div>
      </div>

      {user.role !== "admin" && (
        <div className="flex items-center mt-2 sm:mt-0">
          <button
            className="rounded-full bg-[#3dafaa] text-white py-2 px-6 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm"
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default React.memo(AllocateHeader);
