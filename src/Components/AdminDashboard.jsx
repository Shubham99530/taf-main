import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import DashboardCardList from "./DashboardCards"; // Import your DashboardCardList component
import AdminManagement from "./AdminManagement";

const Dashboard = () => {
  const [currentRound, setCurrentRound] = useState(null);
  const [formOpened, setFormOpened] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // Fetch all initial data in parallel
    const fetchInitialData = async () => {
      try {
        const [roundData, feedbackRes, formRes] = await Promise.all([
          fetch(`${API}/api/rd/currentround`).then((res) => res.json()),
          axios.get(`${API}/api/feedback/status`),
          axios.get(`${API}/api/form`)
        ]);
        setCurrentRound(roundData.currentRound);
        setFeedbackForm(feedbackRes.data.active);
        setFormOpened(formRes.data.state);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [API]);

  const getRound = () => {
    fetch(`${API}/api/rd/currentround`)
      .then((response) => response.json())
      .then((data) => {
        setCurrentRound(data.currentRound);
      })
      .catch((error) =>
        console.error("Error fetching round status: " + error)
      );
  };

  const toggleRound = () => {
    if (currentRound !== null) {
      endCurrentRound();
    } else {
      startNewRound();
    }
  };

  const startNewRound = () => {
    fetch(`${API}/api/rd/startround`, { method: "POST" })
      .then((response) => {
        if (response.status === 201) {
          return response.json();
        }
        if (response.status === 400) {
          alert("An ongoing round already exists.");
          return response.json();
        } else {
          alert("Internal server error");
          return response.json();
        }
      })
      .then((data) => {
        setCurrentRound(data.currentRound);
        getRound();
      })
      .catch((error) => {
        console.error("Error starting a new round: " + error);
      });
  };

  const endCurrentRound = () => {
    fetch(`${API}/api/rd/endround`, { method: "POST" })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        }
        if (response.status === 400) {
          alert("No ongoing round found");
          return response.json();
        } else {
          alert("Internal server error");
          return;
        }
      })
      .then(() => {
        setCurrentRound(null);
        getRound();
      })
      .catch((error) => {
        alert(error.message);
        console.error("Error ending the current round: " + error);
      });
  };

  const resetRounds = () => {
    fetch(`${API}/api/rd/resetrounds`, { method: "POST" })
      .then((response) => response.json())
      .then(() => {
        setCurrentRound(null);
        getRound();
      })
      .catch((error) => {
        console.error("Error resetting rounds: " + error);
      });
  };

  const startNewSemester = () => {
    try {
      Swal.fire({
        title: "Are you sure?",
        text: "This will start a new semester and archive old data!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const currentSemester = "Winter-2026";
          const res = await fetch(`${API}/api/new/semester`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentSemester }),
          });
          setCurrentRound(null);
          getRound();
          if (res.status === 200) {
            await Swal.fire("Success", "New Semester Started", "success");
            window.location.reload();
          } else {
            Swal.fire("Oops!", "Server Error", "error");
          }
        }
      });
    } catch (e) {
      console.error("Error starting new semester: ", e.message);
    }
  };

  const openForm = async () => {
    await fetch(`${API}/api/form/changeState`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: true }),
    });
    window.location.reload();
  };

  const closeForm = async () => {
    await fetch(`${API}/api/form/changeState`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: false }),
    });
    window.location.reload();
  };

  const startFeedback = () => {
    fetch(`${API}/api/feedback/start`, { method: "GET" })
      .then((response) => {
        if (response.status === 200) {
          getFeedbackFormStatus();
        } else {
          console.error("Failed to initiate feedback generation");
        }
      })
      .catch((error) => {
        console.error("Error initiating feedback generation:", error);
      });
  };

  const getFeedbackFormStatus = () => {
    axios
      .get(`${API}/api/feedback/status`)
      .then((response) => {
        setFeedbackForm(response.data.active);
      })
      .catch((error) => {
        console.error("Error fetching feedback form status:", error);
      });
  };

  const handleSynchronize = async () => {
    try {
      console.log("Triggering database synchronization...");
      const response = await axios.post(`${API}/api/admin/syncDatabase`);
      alert("Synchronization completed: " + response.data.message);
    } catch (error) {
      alert(
        "Synchronization failed: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // somewhere in your UI logic
const closeFeedbackForm = () => {
  axios
    .post(`${API}/api/feedback/close`)
    .then((response) => {
      console.log(response.data.message);   // e.g. "Feedback form closed for Spring 2025."
      getFeedbackFormStatus();              // refresh your status indicator
    })
    .catch((error) => {
      console.error("Error closing feedback form:", error.response?.data || error.message);
    });
};

  const buttonClass =
  "bg-[#3dafaa] text-white font-bold text-base py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200";

  return (
    <div className="p-6 bg-gray-100 min-h-screen -ml-4">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        {/* TA Form Section */}
        <div className="flex items-center space-x-4">
          {formOpened ? (
            <button onClick={closeForm} className={`${buttonClass} bg-red-500 hover:bg-red-600`}>
              Close TA Form
            </button>
          ) : (
            <button onClick={openForm} className={buttonClass}>
              Open TA Form
            </button>
          )}
          <div className="text-lg font-semibold">
            {formOpened ? "Form is opened" : "Form is closed"}
          </div>
        </div>

        {/* Ongoing Round Section */}
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Ongoing Round:</span>
          <span className="text-lg">
            {currentRound === null ? "No Round is going on" : currentRound}
          </span>
        </div>

        {/* Admin Management (visible on larger screens) */}
        <div className="hidden md:block">
          <AdminManagement />
        </div>
      </div>

      {/* Button Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={toggleRound}
          className={`${buttonClass} ${
            currentRound === null
              ? ""  
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {currentRound === null ? "Start Round" : "End Round"}
        </button>

        <button onClick={resetRounds} className={buttonClass}>
          Reset Rounds
        </button>

        <button onClick={startNewSemester} className={buttonClass}>
          New Semester
        </button>

        {feedbackForm ? (
          <button
            onClick={closeFeedbackForm}
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm py-1 px-3 rounded-full focus:outline-none focus:shadow-outline transition-colors duration-200"
            >
            End Feedback Form
          </button>
        ) : (
          <button onClick={startFeedback} className={buttonClass}>
            Start Feedback Form
          </button>
        )}

        <button onClick={handleSynchronize} className={buttonClass}>
          Synchronize Database
        </button>
      </div>

      {/* Dashboard Cards Section */}
      <DashboardCardList />

      {/* Admin Management for smaller screens */}
      <div className="mt-6 md:hidden">
        <AdminManagement />
      </div>
    </div>
  );
};

export default Dashboard;
