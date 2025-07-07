import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import { ClipLoader } from "react-spinners";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import CourseContext from "../context/CourseContext";

const columnName = {
  name: "Name",
  code: "Code",
  acronym: "Acronym",
  department: "Department",
  credits: "Credits",
  professor: "Faculty",
  totalStudents: "Total Students",
  taStudentRatio: "TA Student Ratio",
  taRequired: "TA Required",
};

const numericKeys = ["credits", "totalStudents", "taStudentRatio"];

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CourseRow = React.memo(
  ({
    course,
    index,
    editingRow,
    loader,
    handleEdit,
    handleDelete,
    handleInputChange,
    handleSave,
    handleCancel,
  }) => {
    const editingRowClass = "bg-gray-300";
    const courseContent = Object.keys(course);
    return (
      <tr
        className={`text-center ${
          editingRow && editingRow._id === course._id ? editingRowClass : ""
        }`}
        key={index}
      >
        <td className="border-b py-2 px-3 text-sm">{index + 1}</td>
        {courseContent.slice(1, 10).map((key, ind) => (
          <td className="border-b py-2 px-3 text-sm" key={ind}>
            {editingRow && editingRow._id === course._id ? (
              <input
                type={numericKeys.includes(key) ? "number" : "text"}
                value={
                  editingRow[key] !== undefined ? editingRow[key] : course[key]
                }
                onChange={(e) => handleInputChange(e, key)}
                className="rounded px-2 py-1 border text-sm"
              />
            ) : (
              course[key]
            )}
          </td>
        ))}
        <td className="border-b py-2 px-3 text-sm">
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
              <div className="flex gap-2">
                <button
                  className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                  onClick={() => handleSave(editingRow)}
                >
                  Save
                </button>
                <button
                  className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-2">
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={() => handleEdit(course)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={() => handleDelete(course._id)}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }
);

const CourseTable = () => {
  const { courses, updateCourse, deleteCourse, addCourse } =
    useContext(CourseContext);
  const [editingRow, setEditingRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loader, setLoader] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [visibleCount, setVisibleCount] = useState(20);
  const containerRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const sortedCourses = useMemo(() => {
    let sorted = [...courses];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        if (!isNaN(valueA) && !isNaN(valueB)) {
          return sortConfig.direction === "ascending"
            ? valueA - valueB
            : valueB - valueA;
        }
        return sortConfig.direction === "ascending"
          ? valueA.toString().toLowerCase().localeCompare(valueB.toString().toLowerCase())
          : valueB.toString().toLowerCase().localeCompare(valueA.toString().toLowerCase());
      });
    }
    return sorted;
  }, [courses, sortConfig]);

  const filteredCourses = useMemo(() => {
    return sortedCourses.filter((course) =>
      Object.values(course)
        .join(" ")
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [sortedCourses, debouncedSearchTerm]);

  useEffect(() => {
    setVisibleCount(20);
  }, [filteredCourses]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount((prev) =>
        Math.min(prev + 20, filteredCourses.length)
      );
    }
  }, [filteredCourses.length]);

  const handleAddCourse = useCallback(async () => {
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

        if (
          !name ||
          !code ||
          !acronym ||
          !department ||
          !credits ||
          !totalStudents ||
          !taStudentRatio
        ) {
          Swal.showValidationMessage("Please fill out all required fields");
          return null;
        }
        return {
          name,
          code,
          acronym,
          department,
          credits: Number(credits),
          professor,
          totalStudents: Number(totalStudents),
          taStudentRatio: Number(taStudentRatio),
        };
      },
    });

    if (formValues) {
      try {
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
  }, [addCourse]);

  const handleEdit = useCallback((course) => {
    setEditingRow(course);
  }, []);

  const handleSave = useCallback(
    async (row) => {
      setLoader(true);
      const res = await updateCourse(row._id, row);
      setLoader(false);
      if (res.status === "Success") {
        Swal.fire("Updated!", "Course has been updated", "success");
      } else {
        Swal.fire("Oops!", res.message, "error");
      }
      setEditingRow(null);
    },
    [updateCourse]
  );

  const handleCancel = useCallback(() => {
    setEditingRow(null);
  }, []);

  const handleDelete = useCallback(
    async (courseId) => {
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
    },
    [deleteCourse]
  );

  const handleInputChange = useCallback((e, key) => {
    if (key === "search") {
      setSearchTerm(e.target.value);
    } else {
      const value = e.target.value;
      const newValue = numericKeys.includes(key) ? Number(value) : value;
      setEditingRow((prev) => ({ ...prev, [key]: newValue }));
    }
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      const direction =
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending";
      return { key, direction };
    });
  }, []);

  const renderHeaderRow = useCallback(() => {
    if (courses.length === 0) {
      return (
        <tr>
          <th className="bg-gradient-to-b from-teal-500 to-cyan-500 w-36 h-screen shadow-lg rounded-lg p-3 text-center font-bold text-white">
            No Courses
          </th>
        </tr>
      );
    } else {
      const courseKeys = Object.keys(courses[0]);
      return (
        <tr className="bg-[#3dafaa] text-white">
          <th className="border-b py-3 px-4 text-center font-semibold">
            S.No
          </th>
          {courseKeys.slice(1, 10).map((key, index) => (
            <th key={index} className="border-b py-3 px-4 text-center font-semibold">
              <button
                className="w-full flex justify-center text-white text-sm"
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
          <th className="border-b py-3 px-4 text-center font-semibold">
            Action
          </th>
        </tr>
      );
    }
  }, [courses, handleSort, sortConfig]);

  const handleDownload = useCallback(() => {
    const modifiedCourses = filteredCourses.map(({ _id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(modifiedCourses);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Courses");
    XLSX.writeFile(wb, "Courses_Downloaded.xlsx");
  }, [filteredCourses]);

  return (
    <div>
      <div className="flex mt-4 justify-between items-center">
        <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <input
              type="search"
              placeholder="Search Course..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e, "search")}
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
            />
            <button
              type="submit"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full"
            >
              <AiOutlineSearch />
            </button>
          </div>
        </form>
        <div className="flex gap-4">
          <button
            onClick={handleAddCourse}
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
          >
            Add Course
          </button>
          <button
            onClick={handleDownload}
            className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full cursor-pointer font-bold text-sm"
          >
            Download
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto w-full max-h-[82vh] mt-2"
      >
        <div className="shadow-2xl rounded-3xl overflow-hidden border">
          <table className="w-full border-collapse border">
            <thead className="sticky top-0">{renderHeaderRow()}</thead>
            <tbody>
              {filteredCourses.slice(0, visibleCount).map((course, index) => (
                <CourseRow
                  key={course._id || index}
                  course={course}
                  index={index}
                  editingRow={editingRow}
                  loader={loader}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleInputChange={handleInputChange}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CourseTable;
