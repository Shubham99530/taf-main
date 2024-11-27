import React, { useContext, useEffect, useState } from "react";
import {
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import { ClipLoader } from "react-spinners";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import CourseContext from "../context/CourseContext";

const CourseTable = () => {
  const { courses, updateCourse, deleteCourse, addCourse } = useContext(CourseContext);
  const [editingRow, setEditingRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loader, setLoader] = useState(false);
  const columnName = {
    name: "Name",
    code: "Code",
    acronym: "Acronym",
    department: "Department",
    credits: "Credits",
    professor: "Faculty",
    totalStudents: "Total Students",
    taStudentRatio: "Ta Student Ratio",
    taRequired: "Ta Required",
  };
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [sortedCourse, setSortedCourse] = useState(courses);

  useEffect(() => {
    setSortedCourse(courses);
  }, [courses]);

  const handleAddCourse = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Add Course",
      html:
        '<input id="name" class="swal2-input" placeholder="Course Name">' +
        '<input id="code" class="swal2-input" placeholder="Course Code">' +
        '<input id="acronym" class="swal2-input" placeholder="Acronym">' +
        '<input id="department" class="swal2-input" placeholder="Department">' +
        '<input id="credits" class="swal2-input" placeholder="Credits" type="number">' +
        '<input id="professor" class="swal2-input" placeholder="Professor">' +
        '<input id="totalStudents" class="swal2-input" placeholder="Total Students" type="number">' +
        '<input id="taStudentRatio" class="swal2-input" placeholder="TA Student Ratio" type="number">',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById("name").value;
        const code = document.getElementById("code").value;
        const acronym = document.getElementById("acronym").value;
        const department = document.getElementById("department").value;
        const credits = document.getElementById("credits").value;
        const professor = document.getElementById("professor").value;
        const totalStudents = document.getElementById("totalStudents").value;
        const taStudentRatio = document.getElementById("taStudentRatio").value;

        if (!name || !code || !acronym || !department || !credits || !totalStudents || !taStudentRatio) {
          Swal.showValidationMessage("Please fill out all required fields");
          return null;
        }

        return { name, code, acronym, department, credits, professor, totalStudents, taStudentRatio };
      },
    });

    if (formValues) {
      try {
        console.log("hello");
        const res = await addCourse(formValues);
        if (res.status === "Success") {
          Swal.fire("Success", "Course added successfully!", "success");
        } else {
          Swal.fire("Error", res.message, "error");
        }
      } catch (error) {
        Swal.fire("Error", "Failed to add course", "error");
      }
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row);
  };

  const handleSave = async (row) => {
    setLoader(true);
    const res = await updateCourse(row._id, row);
    setLoader(false);
    if (res.status === "Success") {
      Swal.fire("Updated!", "Course has been updated", "success");
    } else {
      Swal.fire("Oops!", res.message, "error");
    }
    handleCancel();
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleDelete = async (courseId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await deleteCourse(courseId);
        if (res.status === "Success") {
          Swal.fire("Deleted!", "Course has been deleted", "success");
        } else {
          Swal.fire("Oops!", res.message, "error");
        }
      }
    });
  };

  const handleInputChange = (e, key) => {
    if (key === "search") {
      setSearchTerm(e.target.value);
    } else {
      const updatedData = { ...editingRow, [key]: e.target.value };
      setEditingRow(updatedData);
    }
  };

  const renderRow = (course, index) => {
    const editingRowClass = "bg-gray-300";
    const courseContent = Object.keys(course);
    return (
      <tr
        className={`text-center ${
          editingRow && editingRow._id === course._id ? editingRowClass : ""
        }`}
        key={index}
      >
        <td className="border p-2">{index + 1}</td>
        {courseContent.slice(1, 10).map((key, ind) => (
          <td className="border p-2" key={ind}>
            {editingRow && editingRow._id === course._id ? (
              <input
                type="text"
                value={editingRow[key] ?? course[key]}
                onChange={(e) => handleInputChange(e, key)}
              />
            ) : (
              course[key]
            )}
          </td>
        ))}
        <td className="border p-2">
          {editingRow && editingRow._id === course._id ? (
            loader ? (
              <div className="flex justify-center">
                <ClipLoader
                  color={"#3dafaa"}
                  loading={loader}
                  size={100}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
            ) : (
              <div className="flex">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded-md flex items-center mr-1"
                  onClick={() => handleSave(editingRow)}
                >
                  Save
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded-md flex items-center"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <div className="flex">
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded-md flex items-center mr-1"
                onClick={() => handleEdit(course)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded-md flex items-center"
                onClick={() => handleDelete(course._id)}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  const renderHeaderRow = () => {
    if (courses.length === 0) {
      return (
        <tr>
          <th className="bg-[#3dafaa] text-center font-bold p-2 text-white">
            No Courses
          </th>
        </tr>
      );
    } else {
      const courseKeys = Object.keys(courses[0]);

      return (
        <>
          <tr className="bg-[#3dafaa] text-white">
            <th className="border p-2 text-center">S.No</th>
            {courseKeys.slice(1, 10).map((key, index) => (
              <th className="border p-2 text-center" key={index}>
                <button
                  className="w-full flex justify-center"
                  onClick={() => handleSort(key)}
                >
                  {columnName[key]}
                  {sortConfig.key === key &&
                    (sortConfig.direction === "ascending" ? (
                      <AiOutlineSortAscending />
                    ) : (
                      <AiOutlineSortDescending />
                    ))}
                </button>
              </th>
            ))}
            <th className="border p-2 text-center">Action</th>
          </tr>
        </>
      );
    }
  };

  const handleDownload = () => {
    const modifiedCourses = filteredCourses.map(({ _id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(modifiedCourses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Courses");
    XLSX.writeFile(wb, "Courses_Downloaded.xlsx");
  };

  const filteredCourses = sortedCourse.filter((course) => {
    const values = Object.values(course).join(" ").toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  const handleSort = (key) => {
    const direction =
      key === sortConfig.key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";

    const sorted = [...courses].sort((a, b) => {
      const valueA = a[key].toString().toLowerCase();
      const valueB = b[key].toString().toLowerCase();
      if (valueA < valueB) {
        return direction === "ascending" ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
    setSortConfig({ key, direction });
    setSortedCourse(sorted);
  };

  return (
    <div>
      <div className="flex mt-4 justify-between">
        <form className="w-[350px]">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Course..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e, "search")}
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
        <button
          onClick={handleAddCourse}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold mr-2"
        >
          Add Course
        </button>
        <button
          className="bg-[#3dafaa] text-white px-4 py-2 rounded cursor-pointer font-bold mr-6"
          onClick={handleDownload}
        >
          Download
        </button>
      </div>
      <div className="overflow-auto max-w-[80vw] max-h-[82vh] mt-2">
        <table className="w-full border-collapse border">
          <thead className="sticky top-0">{renderHeaderRow()}</thead>
          <tbody>
            {filteredCourses.map((course, index) => renderRow(course, index))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseTable;
