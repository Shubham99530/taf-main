import React, { useContext, useRef, useState, useEffect } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import Swal from "sweetalert2";
import ProfContext from "../context/ProfContext";

const AdminProfessor = () => {
  const { professors, updateProfessor, deleteProfessor, addProfessor } = useContext(ProfContext);
  const [editingRow, setEditingRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  // New state for lazy loading
  const [visibleRowCount, setVisibleRowCount] = useState(20);
  const containerRef = useRef();

  const handleAddProfessor = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Add Professor",
      html:
        '<input id="name" class="swal2-input" placeholder="Name">' +
        '<input id="emailId" class="swal2-input" placeholder="Email ID">',
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById("name").value;
        const emailId = document.getElementById("emailId").value;
        if (!name || !emailId) {
          Swal.showValidationMessage(`Please fill out all fields`);
          return null;
        }
        return { name, emailId };
      },
    });

    if (formValues) {
      try {
        const res = await addProfessor(formValues);
        if (res.status === "Success") {
          Swal.fire("Success", "Professor added successfully!", "success");
        } else {
          Swal.fire("Error", res.message, "error");
        }
      } catch (error) {
        Swal.fire("Error", "Failed to add professor", "error");
      }
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row);
  };

  const handleSave = async (row) => {
    const res = await updateProfessor(row._id, row);
    if (res.status === "Success") {
      Swal.fire("Updated!", "Professor has been updated", "success");
    } else {
      Swal.fire("Oops!", res.message, "error");
    }
    handleCancel();
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleDelete = async (professorId) => {
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
        const res = await deleteProfessor(professorId);
        if (res.status === "Success") {
          Swal.fire("Deleted!", "Professor has been deleted", "success");
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

  // Updated row rendering with consistent cell styling
  const renderRow = (professor, index) => {
    const editingRowClass = "bg-gray-300";
    return (
      <tr
        className={`text-center ${editingRow && editingRow._id === professor._id ? editingRowClass : ""}`}
        key={index}
      >
        <td className="border-b py-2 px-3 text-sm">{index + 1}</td>
        <td className="border-b py-2 px-3 text-sm">
          {editingRow && editingRow._id === professor._id ? (
            <input
              type="text"
              value={editingRow.emailId ?? professor.emailId}
              onChange={(e) => handleInputChange(e, "emailId")}
              className="rounded px-2 py-1 border text-sm"
            />
          ) : (
            professor.emailId
          )}
        </td>
        <td className="border-b py-2 px-3 text-sm">
          {editingRow && editingRow._id === professor._id ? (
            <input
              type="text"
              value={editingRow.name ?? professor.name}
              onChange={(e) => handleInputChange(e, "name")}
              className="rounded px-2 py-1 border text-sm"
            />
          ) : (
            professor.name
          )}
        </td>
        <td className="border-b py-2 px-3 text-sm">
          {editingRow && editingRow._id === professor._id ? (
            <div className="flex justify-center gap-2">
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
          ) : (
            <div className="flex justify-center gap-2">
              <button
                className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={() => handleEdit(professor)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-full font-bold text-sm"
                onClick={() => handleDelete(professor._id)}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Updated header rendering with consistent styling
  const renderHeaderRow = () => {
    if (professors.length === 0) {
      return (
        <tr>
          <th className="bg-[#3dafaa] text-white border-b py-3 px-4 text-center font-bold">
            No Professors
          </th>
        </tr>
      );
    } else {
      return (
        <tr className="bg-[#3dafaa] text-white">
          <th className="border-b py-3 px-4 text-center font-semibold">S.No</th>
          <th className="border-b py-3 px-4 text-center font-semibold">Email ID</th>
          <th className="border-b py-3 px-4 text-center font-semibold">Name</th>
          <th className="border-b py-3 px-4 text-center font-semibold">Action</th>
        </tr>
      );
    }
  };

  // Filter professors based on search term
  const filteredProfessors = professors.filter((professor) => {
    const values = Object.values(professor).join(" ").toLowerCase();
    return values.includes(searchTerm.toLowerCase());
  });

  // Reset visible rows when professors or search term changes
  useEffect(() => {
    setVisibleRowCount(20);
  }, [professors, searchTerm]);

  // Handler to load more rows when scrolling near the bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setVisibleRowCount((prev) => Math.min(filteredProfessors.length, prev + 10));
    }
  };

  return (
    <div>
      <div className="flex mt-4 justify-between">
        <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <input
              type="search"
              placeholder="Search Faculty..."
              value={searchTerm}
              onChange={(e) => handleInputChange(e, "search")}
              className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full">
              <AiOutlineSearch />
            </button>
          </div>
        </form>
        <button
          onClick={handleAddProfessor}
          className="bg-[#6495ED] hover:bg-[#3b6ea5] text-white px-2 py-1 rounded-full font-bold text-sm"
        >
          Add Professor
        </button>
      </div>
      {/* Container with lazy loading */}
      <div
        ref={containerRef}
        className="overflow-auto w-full max-h-[82vh] mt-2 scrollbar-hide"
        onScroll={handleScroll}
      >
        <div className="shadow-2xl rounded-3xl overflow-hidden border">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0">{renderHeaderRow()}</thead>
            <tbody>
              {filteredProfessors.slice(0, visibleRowCount).map((professor, index) =>
                renderRow(professor, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProfessor;
