import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import * as XLSX from "xlsx";

const CourseUpload = () => {
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  const updateCourseFromFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (sheetData.length === 0) {
        Swal.fire({
          title: "Invalid File",
          text: "No data found in the file. Please check and try again.",
          icon: "warning",
        });
        setLoading(false);
        return;
      }

      const coursesToUpdate = sheetData.map((course) => ({
        code: course.code,
        name: course.name,
        totalStudents: course.totalStudents,
      }));

      axios
        .post(`${API}/api/course/updateTotalStudents`, coursesToUpdate)
        .then(() => {
          setLoading(false);
          Swal.fire({
            title: "Success!",
            text: "Courses updated successfully.",
            icon: "success",
          });
        })
        .catch((error) => {
          setLoading(false);
          Swal.fire({
            title: "Upload Failed",
            text: `Error: ${error.message}`,
            icon: "error",
          });
        });
    };

    reader.onerror = () => {
      Swal.fire({
        title: "File Read Error",
        text: "There was an error reading the file. Please try again.",
        icon: "error",
      });
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // Full viewport height
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          padding: "20px",
          textAlign: "center",
          border: "1px solid #ddd",
          borderRadius: "10px",
          backgroundColor: "#fff",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Upload Course Data</h2>
        <p>
          Upload an <strong>.xlsx</strong> or <strong>.xls</strong> file containing
          course details. The file should have the following columns:
        </p>
        <ul style={{ textAlign: "left", fontSize: "14px" }}>
          <li>📌 <strong>code</strong>: Course Code (e.g., CS101)</li>
          <li>📌 <strong>name</strong>: Course Name (e.g., Data Structures)</li>
          <li>📌 <strong>totalStudents</strong>: Total Students Enrolled</li>
        </ul>

        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={updateCourseFromFile}
          style={{
            margin: "10px 0",
            padding: "5px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        {loading && (
          <p style={{ color: "blue", fontWeight: "bold" }}>
            ⏳ Updating courses, please wait...
          </p>
        )}
      </div>
    </div>
  );
};

export default CourseUpload;
