import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

// Simple Modal component using a portal that attaches to document.body
const Modal = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black opacity-70" 
        onClick={onClose}
      ></div>
      {/* Modal Content */}
      <div className="relative bg-white p-6 rounded-lg w-full max-w-md z-50 overflow-auto max-h-full">
        {children}
      </div>
    </div>,
    document.body
  );
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  // Fetch admins when modal is shown.
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/api/admin`);
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      Swal.fire('Error', 'Failed to fetch admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    if (showManagement) {
      fetchAdmins();
    }
  }, [showManagement, fetchAdmins]);

  // Add admin using SweetAlert2 input
  const addAdmin = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Add Admin',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Email" />
        <input id="swal-input2" class="swal2-input" type="password" placeholder="Password" />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const emailId = document.getElementById('swal-input1').value;
        const password = document.getElementById('swal-input2').value;
        if (!emailId || !password) {
          Swal.showValidationMessage('Please enter both email and password');
          return;
        }
        return { emailId, password };
      },
    });

    if (formValues) {
      try {
        const { data: newAdmin } = await axios.post(`${API}/api/admin`, formValues);
        Swal.fire('Success', 'Admin added successfully', 'success');
        setAdmins((prevAdmins) => [...prevAdmins, newAdmin]);
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to add admin', 'error');
      }
    }
  };

  // Update admin using SweetAlert2
  const updateAdmin = async (admin) => {
    const { value: formValues } = await Swal.fire({
      title: 'Update Admin',
      html: `
        <input id="swal-input1" class="swal2-input" value="${admin.emailId}" placeholder="New Email" />
        <input id="swal-input2" class="swal2-input" type="password" placeholder="Current Password" />
        <input id="swal-input3" class="swal2-input" type="password" placeholder="New Password (optional)" />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const emailId = document.getElementById('swal-input1').value;
        const currentPassword = document.getElementById('swal-input2').value;
        const newPassword = document.getElementById('swal-input3').value;
        if (!emailId || !currentPassword) {
          Swal.showValidationMessage('Email and current password are required');
          return;
        }
        return { emailId, currentPassword, newPassword };
      },
    });

    if (formValues) {
      try {
        const { data: updatedAdmin } = await axios.put(`${API}/api/admin/${admin._id}`, formValues);
        Swal.fire('Success', 'Admin updated successfully', 'success');
        setAdmins((prevAdmins) =>
          prevAdmins.map((adm) => (adm._id === admin._id ? updatedAdmin : adm))
        );
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to update admin', 'error');
      }
    }
  };

  // Delete admin with password confirmation
  const deleteAdmin = async (admin) => {
    const { value: password } = await Swal.fire({
      title: 'Delete Admin',
      input: 'password',
      inputLabel: 'Enter your password',
      showCancelButton: true,
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('Password is required');
        }
        return value;
      },
    });

    if (password) {
      try {
        await axios.delete(`${API}/api/admin/${admin._id}`, { data: { password } });
        Swal.fire('Deleted!', 'Admin has been deleted.', 'success');
        setAdmins((prevAdmins) => prevAdmins.filter((adm) => adm._id !== admin._id));
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to delete admin', 'error');
      }
    }
  };

  return (
    <div>
      {/* Button to open the admin management modal */}
      {!showManagement ? (
        <button
          onClick={() => setShowManagement(true)}
          className="bg-[#3dafaa] hover:bg-[#3dafaa] text-white px-4 py-2 rounded-full mt-2"
        >
          Admin Management
        </button>
      ) : (
        <Modal onClose={() => setShowManagement(false)}>
          <div className="flex justify-end">
            <button onClick={() => setShowManagement(false)} className="text-gray-500">
              Close
            </button>
          </div>
          <h2 className="text-xl font-bold mb-4">Admin Management</h2>
          <button
            onClick={addAdmin}
            className="bg-[#3dafaa] hover:bg-[#3dafaa] text-white px-4 py-2 rounded-full mt-2"
          >
            Add Admin
          </button>
          {loading ? (
            <p className="mt-4">Loading...</p>
          ) : (
            <ul className="mt-4">
              {admins.map((admin) => (
                <li key={admin._id} className="flex justify-between items-center mb-2">
                  <span>{admin.emailId}</span>
                  <div>
                    <button
                      onClick={() => updateAdmin(admin)}
                      className="bg-[#3dafaa] hover:bg-[#3dafaa] text-white px-4 py-1 rounded-full mr-2"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deleteAdmin(admin)}
                      className="bg-[#3dafaa] hover:bg-[#3dafaa] text-white px-4 py-1 rounded-full"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminManagement;
