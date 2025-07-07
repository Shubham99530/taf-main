# TA Allocation Portal

![TA Allocation Portal](public/images/iiitd.png)

[![GitHub Issues](https://img.shields.io/github/issues/Sambhav-Gautam/Ta-Allocation-Portal)](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/issues)
[![GitHub Stars](https://img.shields.io/github/stars/Sambhav-Gautam/Ta-Allocation-Portal)](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Sambhav-Gautam/Ta-Allocation-Portal)](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/network)
[![GitHub Contributors](https://img.shields.io/github/contributors/Sambhav-Gautam/Ta-Allocation-Portal)](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/graphs/contributors)

## Overview

The **TA Allocation Portal** is a full-stack web application designed to streamline Teaching Assistant (TA) management, course assignments, feedback, and administrative tasks for academic institutions. Built with a **Node.js/Express.js** backend and a **React.js** frontend, it supports multiple user roles (Admin, Joint Manager (JM), Professor, Student) with a responsive, user-friendly interface. Key features include round-based TA allocation, feedback collection, real-time updates via Socket.IO, and email notifications using Nodemailer. Styled with Tailwind CSS, the portal is optimized for scalability, security, and ease of use.

## Features

### Core Functionality
- **User Management**: CRUD operations for Admins, Professors, JMs, and Students.
- **Course Management**: Add, edit, delete, and update courses, including student enrollment and TA requirements.
- **TA Allocation**: Allocate/deallocate students to courses with round-based rules (e.g., max 2 TAs for courses with ≥100 students in Round 1).
- **Feedback System**: Collect, edit, and archive TA feedback, with Best TA nominations and Excel exports.
- **Semester Management**: Start new semesters, archiving old data and resetting system flags.
- **Real-Time Updates**: Live notifications for student updates, allocations, and logs via Socket.IO.
- **Email Notifications**: Automated emails for OTP login, TA allocation/deallocation, and feedback reminders.

### Role-Specific Features
- **Admin**:
  - Synchronize database, manage rounds, and start new semesters.
  - Manage Admins, Professors, JMs, and Students.
  - Download course, student, and feedback data as Excel files.
  - Send email reminders for over/under-allocated courses.
- **Professor**:
  - Submit and edit feedback for TAs assigned to their courses.
  - Nominate TAs for Best TA awards with comments.
- **JM (Joint Manager)**:
  - Manage department-specific courses and allocations.
  - View allocation logs and course details.
- **Student**:
  - Submit TA preference forms with department and non-department course preferences.
  - View allocation status and feedback.

### Additional Features
- **Nominations Tracking**: Track TA nominations across semesters, identifying "Distinguished TAs" nominated consecutively.
- **Lazy Loading**: Efficiently load large datasets (e.g., students, courses, feedback) with infinite scrolling.
- **Search and Sort**: Filter and sort tables for courses, students, professors, and logs.
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS.
- **Authentication**: Role-based access with JWT for Admins and OTP-based login for others.

## Screenshots

![image](https://github.com/user-attachments/assets/0a78f9ac-2590-49be-abc0-c7b318637e22)
![image](https://github.com/user-attachments/assets/b5b190d5-0279-42e5-ab03-56fd1fd4d967)
![image](https://github.com/user-attachments/assets/f3cd27d0-6781-49f7-be61-7d9b2746ad8c)


## Tech Stack

### Backend
- **Node.js**: Server runtime.
- **Express.js**: RESTful API framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB schema management.
- **Socket.IO**: Real-time communication.
- **Nodemailer**: Email notifications.
- **Argon2**: Password hashing.
- **jsonwebtoken**: JWT authentication.
- **XLSX**: Excel file generation.
- **cors**: Cross-Origin Resource Sharing.
- **dotenv**: Environment variables.

### Frontend
- **React.js**: Dynamic UI library.
- **Vite**: Fast build tool.
- **Tailwind CSS**: Utility-first CSS.
- **React Context API**: State management.
- **Axios**: HTTP client.
- **SweetAlert2**: Interactive modals.
- **React Spinners**: Loading indicators.
- **React Router**: Client-side routing.
- **XLSX**: Client-side Excel generation.

## Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: Local or cloud instance (e.g., MongoDB Atlas)
- **Gmail Account**: For Nodemailer (with App Password)
- **NPM**: Package management

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Sambhav-Gautam/Ta-Allocation-Portal.git
   cd Ta-Allocation-Portal
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env.development` file in `backend`:
   ```env
   PORT=5000
   MONGODB_URI=<your-mongodb-connection-string>
   USERMAIL=<your-gmail-address>
   PASS=<your-gmail-app-password>
   NODE_ENV=development
   ```

3. **Frontend Setup**:
   ```bash
   cd ..
   npm install
   ```
   Create a `.env` file in the root:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Run the Application**:
   - **Backend**:
     ```bash
     cd backend
     npm start
     ```
   - **Frontend**:
     ```bash
     cd ..
     npm run dev
     ```

5. **Access the Application**:
   - Backend API: `http://localhost:5000`
   - Frontend: `http://localhost:5173`
   - Open `http://localhost:5173` in your browser.

## Project Structure

```
Ta-Allocation-Portal/
├── backend/
│   ├── config/
│   │   └── dbConnection.js       # MongoDB connection
│   ├── controllers/              # API logic
│   │   ├── adminController.js
│   │   ├── allocationController.js
│   │   ├── archivedFeedbackController.js
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── emailController.js
│   │   ├── feedbackController.js
│   │   ├── formController.js
│   │   ├── jmController.js
│   │   ├── professorController.js
│   │   ├── roundController.js
│   │   ├── semesterController.js
│   │   └── studentController.js
│   ├── middleware/
│   │   ├── AnyCouse.js           # Course validation
│   │   ├── StudentValidator.js    # Student validation
│   │   ├── errorHandler.js       # Error handling
│   ├── models/                   # Mongoose schemas
│   │   ├── Admin.js
│   │   ├── ArchivedFeedback.js
│   │   ├── Course.js
│   │   ├── Feedback.js
│   │   ├── FeedbackStatus.js
│   │   ├── JM.js
│   │   ├── LogEntry.js
│   │   ├── Professor.js
│   │   ├── Round.js
│   │   ├── Student.js
│   │   └── newlg.js
│   ├── routes/                   # API routes
│   │   ├── adminRoutes.js
│   │   ├── allocationRoutes.js
│   │   ├── archivedFeedbackRoutes.js
│   │   ├── authRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── emailRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── formRoutes.js
│   │   ├── jmRoutes.js
│   │   ├── professorRoutes.js
│   │   ├── roundRoutes.js
│   │   ├── semesterRoutes.js
│   │   └── studentRoutes.js
│   ├── utils/
│   │   └── syncData.js           # Database sync
│   ├── index.js                  # Server entry
│   ├── jmv.js                    # JM logic
│   ├── package.json
│   └── package-lock.json
├── src/
│   ├── Components/               # React components
│   │   ├── AdminAllocate.jsx     # Course allocation
│   │   ├── AdminCourse.jsx       # Course management
│   │   ├── AdminDashboard.jsx    # Admin dashboard
│   │   ├── AdminJms.jsx         # JM management
│   │   ├── AdminLog.jsx         # Allocation logs
│   │   ├── AdminManagement.jsx   # Admin user management
│   │   ├── AdminNavbar.jsx      # Admin navigation
│   │   ├── AdminProfessor.jsx    # Professor management
│   │   ├── AdminStudent.jsx      # Student management
│   │   ├── AllocateHeader.jsx    # Allocation header
│   │   ├── ArchivedFeedback.jsx  # Archived feedback
│   │   ├── CoursePage.jsx        # Course details
│   │   ├── DashboardCards.jsx    # Dashboard stats
│   │   ├── DepartmentSideBar.jsx # JM sidebar
│   │   ├── FeedbackList.jsx      # Feedback management
│   │   ├── Multi.jsx            # Multi-select
│   │   ├── NominationsList.jsx   # TA nominations
│   │   ├── Sidebar.jsx          # Main sidebar
│   │   ├── allshow.jsx          # Data display
│   │   ├── modal.jsx            # Generic modal
│   │   └── test.json            # Test data
│   ├── Pages/                    # Page components
│   │   ├── AdminPage.jsx
│   │   ├── CourseUpload.jsx
│   │   ├── DepartmentPage.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Form.jsx
│   │   ├── LoginForm.jsx
│   │   ├── LoginPage.jsx
│   │   ├── LoginPageAdv.jsx
│   │   ├── Newform.jsx
│   │   ├── NominationsPage.jsx
│   │   ├── ProfessorCourses.jsx
│   │   ├── ProfessorPage.jsx
│   │   ├── Student.jsx
│   │   ├── StudentForm.jsx
│   │   ├── TAForm.jsx
│   │   └── test.jsx
│   ├── context/                  # React Context
│   │   ├── AuthContext.jsx
│   │   ├── AuthState.jsx
│   │   ├── CourseContext.jsx
│   │   ├── CourseState.jsx
│   │   ├── DepartmentContext.jsx
│   │   ├── DepartmentState.jsx
│   │   ├── ProfContext.jsx
│   │   ├── ProfState.jsx
│   │   ├── StudentContext.jsx
│   │   └── StudentState.jsx
│   ├── assets/
│   │   └── react.svg
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/                       # Static assets
│   ├── images/
│   │   ├── favicon.ico
│   │   ├── iiitd.png
│   │   ├── iiitd_img.png
│   │   ├── iiitdrndblock.jpeg
│   │   ├── iiitdrndblock2.jpeg
│   └── vite.svg
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/login/sendOtp`: Send OTP for TA, Professor, or JM login.
- `POST /api/login/verifyOtp`: Verify OTP and authenticate user.
- `POST /api/login/admin`: Admin login with email and password.
- `POST /api/login/forgotPassword`: Reset admin password.

### Admin
- `POST /api/admin/syncDatabase`: Synchronize database.
- `GET /api/admin/:id`: Get admin by ID.
- `GET /api/admin`: Get all admins.
- `POST /api/admin`: Add new admin.
- `PUT /api/admin/:id`: Update admin details.
- `DELETE /api/admin/:id`: Delete an admin.

### Student
- `GET /api/student/:id`: Get student by ID.
- `GET /api/student`: Get filtered students.
- `POST /api/student`: Add new student(s).
- `PUT /api/student/:id`: Update student details.
- `DELETE /api/student/:id`: Delete a student.

### Course
- `GET /api/course/:id`: Get course by ID.
- `GET /api/course`: Get filtered courses.
- `POST /api/course`: Add new course(s).
- `PUT /api/course/:id`: Update course details.
- `DELETE /api/course/:id`: Delete a course.
- `POST /api/course/professor`: Get professor courses.
- `POST /api/course/updateTotalStudents`: Update student counts.

### Allocation
- `POST /api/al/allocation`: Allocate student to course.
- `POST /api/al/deallocation`: Deallocate student.
- `POST /api/al/freezeAllocation`: Freeze allocation.
- `GET /api/al/getLogs`: Get allocation logs.
- `GET /api/al/getAllAllocation`: Get all allocations.

### Feedback
- `POST /api/feedback/start`: Initialize feedback placeholders.
- `PUT /api/feedback/:id`: Edit feedback (Professors).
- `GET /api/feedback/professor/:professorId`: Get professor feedbacks.
- `GET /api/feedback/download`: Download feedbacks as Excel.
- `GET /api/feedback/all`: Get all feedbacks (paginated).
- `POST /api/feedback/close`: Close and archive feedback.
- `GET /api/feedback/status`: Get feedback form status.
- `GET /api/feedback/nominations`: Get current nominations.
- `GET /api/feedback/archived-nominations`: Get archived nominations.

### Archived Feedback
- `GET /api/archived-feedback`: Get archived feedbacks (paginated).
- `GET /api/archived-feedback/status`: Get archived feedback count.
- `GET /api/archived-feedback/download`: Download archived feedback.
- `GET /api/archived-feedback/semesters`: Get unique semesters.

### Department (JM)
- `GET /api/department/:id`: Get department by ID.
- `GET /api/department`: Get filtered departments.
- `POST /api/department`: Add new department(s).
- `PUT /api/department/:id`: Update department details.
- `DELETE /api/department/:id`: Delete a department.

### Professor
- `GET /api/professor/:id`: Get professor by ID.
- `GET /api/professor`: Get filtered professors.
- `POST /api/professor`: Add new professor(s).
- `PUT /api/professor/:id`: Update professor details.
- `DELETE /api/professor/:id`: Delete a professor.

### Round
- `GET /api/rd/getRoundStatus`: Get current round.
- `GET /api/rd/getLastRound`: Get last completed round.
- `POST /api/rd/startround`: Start new round.
- `POST /api/rd/endround`: End current round.
- `POST /api/rd/resetRounds`: Reset all rounds.

### Semester
- `POST /api/new`: Start new semester.
- `DELETE /api/new/semester`: Archive data and start new semester.

### Form
- `POST /api/form/changeState`: Set TA form status.
- `GET /api/form`: Get TA form status.

### Email
- `POST /api/snd/sendem`: Send allocation reminders.

## Usage Notes

- **Authentication**:
  - Admins use JWT-based email/password login.
  - Professors, JMs, and Students use OTP-based login via email.
  - Admin password reset available via forgot password endpoint.

- **TA Allocation**:
  - Follows round-based rules (e.g., max 2 TAs for large courses in Round 1).
  - Admins can freeze allocations.
  - Over/under-allocated courses highlighted (red/yellow).

- **Feedback System**:
  - Feedback initialized per TA-professor-course.
  - Professors nominate Best TAs with comments.
  - Exportable as Excel.

- **Nominations**:
  - Tracks nominations across semesters.
  - Identifies "Distinguished TAs" for consecutive nominations.
  - Downloadable as Excel.

- **Frontend**:
  - Lazy loading and infinite scrolling for performance.
  - Search/sort functionality for tables.
  - SweetAlert2 modals for confirmations.
  - Role-specific dashboards.

- **Email Notifications**:
  - Requires Gmail with App Password.
  - Sends OTPs, allocation updates, and reminders.

- **Real-Time Updates**:
  - Socket.IO for live student, allocation, and log updates.

## Contributing

We welcome contributions! To contribute:

1. **Fork the Repository**:
   ```bash
   git clone https://github.com/Sambhav-Gautam/Ta-Allocation-Portal.git
   ```

2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Changes**:
   ```bash
   git commit -m "Add your feature description"
   ```

4. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**:
   - Submit a pull request on GitHub with a detailed description.

Follow the [Code of Conduct](CODE_OF_CONDUCT.md) and adhere to coding standards.

## Development Guidelines

- **Backend**:
  - Use `errorHandler.js` for consistent error handling.
  - Validate inputs with middleware (e.g., `StudentValidator.js`).
  - Keep APIs RESTful and document new endpoints.

- **Frontend**:
  - Use functional components with hooks.
  - Leverage Context API for state.
  - Follow Tailwind CSS conventions.
  - Optimize with `useMemo`, `useCallback`, and `React.memo`.

- **Testing**:
  - Write unit tests for backend logic (e.g., allocation rules).
  - Test frontend with Jest/React Testing Library.
  - Test APIs with Postman.

## Known Issues

- **Feedback Validation**: Edge cases in feedback form (e.g., missing Best TA comments) need checks.
- **Scalability**: Large datasets may require MongoDB indexing.
- **Mobile Responsiveness**: Some tables (e.g., FeedbackList) need styling tweaks.

Report issues via [GitHub Issues](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/issues).

## License

*The license for this project is not specified. Please contact the maintainer for licensing details.*

## Contact

- **Maintainer**: Sambhav Gautam
- **GitHub**: [Sambhav-Gautam](https://github.com/Sambhav-Gautam)
- **Issues**: [GitHub Issues](https://github.com/Sambhav-Gautam/Ta-Allocation-Portal/issues)

---

*Built with ❤️ for academic excellence at IIITD*
