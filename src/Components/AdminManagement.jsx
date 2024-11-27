import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await axios.get(`${API}/api/admin`);
            setAdmins(response.data);
        } catch (error) {
            console.error('Error fetching admins:', error);
        }
    };

    const addAdmin = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Add Admin',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Email">' +
                '<input id="swal-input2" class="swal2-input" type="password" placeholder="Password">',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    emailId: document.getElementById('swal-input1').value,
                    password: document.getElementById('swal-input2').value,
                };
            },
        });

        if (formValues) {
            try {
                await axios.post(`${API}/api/admin`, formValues);
                Swal.fire('Success', 'Admin added successfully', 'success');
                fetchAdmins();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to add admin', 'error');
            }
        }
    };

    const updateAdmin = async (admin) => {
        const { value: formValues } = await Swal.fire({
            title: 'Update Admin',
            html:
                `<input id="swal-input1" class="swal2-input" value="${admin.emailId}" placeholder="New Email">` +
                '<input id="swal-input2" class="swal2-input" type="password" placeholder="Current Password">' +
                '<input id="swal-input3" class="swal2-input" type="password" placeholder="New Password (optional)">',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    emailId: document.getElementById('swal-input1').value,
                    currentPassword: document.getElementById('swal-input2').value,
                    newPassword: document.getElementById('swal-input3').value,
                };
            },
        });

        if (formValues) {
            try {
                await axios.put(`${API}/api/admin/${admin._id}`, formValues);
                Swal.fire('Success', 'Admin updated successfully', 'success');
                fetchAdmins();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to update admin', 'error');
            }
        }
    };

    const deleteAdmin = async (admin) => {
        const { value: password } = await Swal.fire({
            title: 'Delete Admin',
            input: 'password',
            inputLabel: 'Enter your password',
            showCancelButton: true,
        });

        if (password) {
            try {
                await axios.delete(`${API}/api/admin/${admin._id}`, {
                    data: { password },
                });
                Swal.fire('Deleted!', 'Admin has been deleted.', 'success');
                fetchAdmins();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete admin', 'error');
            }
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold">Admin Management</h2>
            <button onClick={addAdmin} className="bg-green-500 text-white px-4 py-2 rounded mt-2">
                Add Admin
            </button>
            <ul className="mt-4">
                {admins.map((admin) => (
                    <li key={admin._id} className="flex justify-between items-center mb-2">
                        <span>{admin.emailId}</span>
                        <div>
                            <button
                                onClick={() => updateAdmin(admin)}
                                className="bg-yellow-500 text-white px-4 py-1 rounded mr-2"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => deleteAdmin(admin)}
                                className="bg-red-500 text-white px-4 py-1 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminManagement;
