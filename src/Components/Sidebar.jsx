import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome, FaUserGraduate, FaBook, FaUpload, FaUniversity,
  FaChalkboardTeacher, FaClipboardList, FaComments, FaArchive, FaSignOutAlt, FaAward
} from "react-icons/fa";

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL;

  const items = [
    { to: "/admin/", label: "Dashboard", icon: <FaHome /> },
    { to: "/admin/student", label: "Students", icon: <FaUserGraduate /> },
    { to: "/admin/course", label: "Courses", icon: <FaBook /> },
    { to: "/admin/course-upload", label: "Update", icon: <FaUpload /> },
    { to: "/admin/department", label: "Allocate", icon: <FaUniversity /> },
    { to: "/admin/professors", label: "Faculty", icon: <FaChalkboardTeacher /> },
    { to: "/admin/logs", label: "Logs", icon: <FaClipboardList /> },
    { to: "/admin/nominations", label: "TA Awards", icon: <FaAward /> },
    { to: "/admin/feedback", label: "Feedback", icon: <FaComments /> },
    { to: "/admin/archived-feedback", label: "Archives", icon: <FaArchive /> },
  ];

  const common = "flex items-center px-3 py-2 text-white font-medium transition-transform duration-200 hover:bg-[rgb(50,140,135)] hover:scale-105";

  return (
    <aside className="bg-gradient-to-b from-teal-500 to-cyan-500 w-36 h-screen shadow-lg rounded-lg p-3">
      <nav className="flex flex-col space-y-2" aria-label="Sidebar Navigation">
        {items.map((item, i) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={i}
              to={item.to}
              className={`${common} ${isActive ? "bg-[rgb(50,140,135)]" : ""} rounded`}
            >
              <span className="mr-2">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        <button
          className={`${common} rounded`}
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = API;
          }}
        >
          <FaSignOutAlt className="mr-2" />
          <span className="text-xs">Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default SideBar;
