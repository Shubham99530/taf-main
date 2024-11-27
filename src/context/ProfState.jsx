import axios from "axios";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import ProfContext from "./ProfContext";

const ProfState = (props) => {
  const initProfessors = [];
  const [professors, setProfessors] = useState(initProfessors);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    getProfessorsFromBackend();
  }, []);

  const getProfessorsFromBackend = () => {
    axios
      .get(`${API}/api/professor`)
      .then((response) => {
        let professorsFromBackend = response.data;
        setProfessors(professorsFromBackend);
      })
      .catch((error) => {
        console.error("Error fetching professors from the backend:", error);
      });
  };

  const addProfessor = async (professorData) => {
    try {
      const response = await axios.post(`${API}/api/professor`, professorData);
      if (response.status === 201) {
        getProfessorsFromBackend(); // Refresh the professor list
        return { status: "Success" };
      } else {
        console.error("Failed to add professor data to the backend");
        return { status: "Failed", message: "Failed to add professor" };
      }
    } catch (error) {
      console.error("Error adding professor:", error);
      return { status: "Failed", message: "Error adding professor data" };
    }
  };

  const deleteProfessor = async (professorId) => {
    try {
      await axios.delete(`${API}/api/professor/${professorId}`);
      getProfessorsFromBackend(); // Fetch updated professor data after deletion
      return { status: "Success" };
    } catch (error) {
      console.error("Error deleting professor:", error);
      return { status: "Failed", message: "Error deleting professor" };
    }
  };

  const updateProfessor = async (professorId, updatedData) => {
    try {
      const response = await axios.put(
        `${API}/api/professor/${professorId}`,
        updatedData
      );
      if (response.status === 200) {
        getProfessorsFromBackend(); // Fetch updated data from the backend
        return { status: "Success" };
      } else {
        console.error("Failed to update professor data on the backend");
        return {
          status: "Failed",
          message: "Failed to update professor data on the backend",
        };
      }
    } catch (error) {
      console.error("Error updating professor data:", error);
      return { status: "Failed", message: "Error updating professor data" };
    }
  };

  const getProfessorFromFile = (event, setLoading) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (sheetData.length === 0) {
          console.error("No data found in the XLSX file.");
          return;
        }

        axios
          .post(`${API}/api/professor`, sheetData)
          .then(async (response) => {
            setLoading(false);

            let tableHtml = `
              <table class="min-w-max w-full table-auto">
                <thead>
                  <tr class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th class="py-3 px-6 text-left">Message</th>
                    <th class="py-3 px-6 text-left">Name</th>
                    <th class="py-3 px-6 text-left">Email ID</th>
                  </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
            `;
            response.data.invalidProfessors.forEach((prof) => {
              tableHtml += `
                <tr class="border-b border-gray-200 hover:bg-gray-100">
                  <td class="py-3 px-6 text-left whitespace-nowrap">${prof.message}</td>
                  <td class="py-3 px-6 text-left whitespace-nowrap">${prof.professor.name}</td>
                  <td class="py-3 px-6 text-left whitespace-nowrap">${prof.professor.emailId}</td>
                </tr>
              `;
            });
            tableHtml += `
                </tbody>
              </table>
            `;

            if (response.data.invalidProfessors.length > 0) {
              await Swal.fire({
                title: "Failed to import some professors",
                allowOutsideClick: false,
                html: tableHtml,
                width: "80%",
              });
            }

            getProfessorsFromBackend(); // Refresh data
          })
          .catch(async (error) => {
            console.error("Error sending data to the backend:", error);
            setLoading(false);
            await Swal.fire({
              title: "Internal Server Error",
              text: error,
              icon: "error",
            });
            window.location.reload();
          });
      };

      reader.onerror = (error) => {
        console.error("Error reading XLSX:", error);
      };

      reader.readAsBinaryString(file);
    }
  };

  const filterProfessorsByDepartment = async (department) => {
    try {
      const response = await axios.get(
        `${API}/api/professor?department=${department}`
      );
      if (response.status === 200) {
        setProfessors(response.data);
      } else {
        console.error("Failed to fetch filtered professors");
      }
    } catch (error) {
      console.error("Error fetching filtered professors:", error);
    }
  };

  return (
    <ProfContext.Provider
      value={{
        professors,
        addProfessor,
        updateProfessor,
        deleteProfessor,
        getProfessorFromFile,
        filterProfessorsByDepartment,
      }}
    >
      {props.children}
    </ProfContext.Provider>
  );
};

export default ProfState;
