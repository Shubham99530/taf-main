// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminPage from './Pages/AdminPage';
import Department from './Pages/DepartmentPage';
import Professor from './Pages/ProfessorPage';
import StudentForm from './Pages/TAForm';
import LoginPage from './Pages/LoginPageAdv';
import ForgotPassword from './Pages/ForgotPassword';
import CourseUpload from './Pages/CourseUpload';
import NominationsPage from './Pages/NominationsPage';

import StudentState from './context/StudentState';
import CourseState from './context/CourseState';
import DepartmentState from './context/DepartmentState';
import AuthState from './context/AuthState';
import ProfState from './context/ProfState';

import ProtectedRoute from './ProtectedRoutes';

const App = () => {
  return (
    <AuthState>
      <ProfState>
        <StudentState>
          <CourseState>
            <DepartmentState>
              <Routes>
                {/* Public routes */}
                <Route element={<LoginPage />} path="/" />
                <Route element={<ForgotPassword />} path="/forgotPassword" />

                {/* TA form */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<StudentForm />}
                      allowedRoles={['TA']}
                    />
                  }
                  path="/TAForm"
                />

                {/* Admin dashboard */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<AdminPage />}
                      allowedRoles={['admin']}
                    />
                  }
                  path="/admin/*"
                />

                {/* Course upload (admin only) */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<CourseUpload />}
                      allowedRoles={['admin']}
                    />
                  }
                  path="/admin/course-upload"
                />

                {/* Department management */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<Department />}
                      allowedRoles={['jm', 'admin']}
                    />
                  }
                  path="/department/*"
                />

                {/* Professor dashboard */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<Professor />}
                      allowedRoles={['professor', 'jm', 'admin']}
                    />
                  }
                  path="/professor/*"
                />

                {/* Best‑TA nominations page */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<NominationsPage />}
                      allowedRoles={['admin', 'professor']}
                    />
                  }
                  path="/nominations"
                />
              </Routes>
            </DepartmentState>
          </CourseState>
        </StudentState>
      </ProfState>
    </AuthState>
  );
};

export default App;
