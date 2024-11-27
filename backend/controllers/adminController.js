const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const argon2 = require('argon2');

// Get Admin by ID
const getAdmin = asyncHandler(async (req, res) => {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId, { password: 0 });
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }
    return res.status(200).json(admin);
});

// Get all Admins
const getAdmins = asyncHandler(async (req, res) => {
    const admins = await Admin.find({}, { password: 0 });
    return res.status(200).json(admins);
});

// Add Admin
const addAdmin = asyncHandler(async (req, res) => {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingAdmin = await Admin.findOne({ emailId });
    if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await argon2.hash(password);
    const newAdmin = new Admin({ emailId, password: hashedPassword });

    await newAdmin.save();
    return res.status(201).json({ message: 'Admin added successfully' });
});

// Update Admin
const updateAdmin = asyncHandler(async (req, res) => {
    const adminId = req.params.id;
    const { emailId, newPassword, currentPassword } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }

    const passwordMatch = await argon2.verify(admin.password, currentPassword);
    if (!passwordMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const updates = { emailId };
    if (newPassword) {
        updates.password = await argon2.hash(newPassword);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates, { new: true });
    return res.status(200).json({ message: 'Admin updated successfully', updatedAdmin });
});

// Delete Admin
const deleteAdmin = asyncHandler(async (req, res) => {
    const adminId = req.params.id;
    const { password } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }

    const passwordMatch = await argon2.verify(admin.password, password);
    if (!passwordMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
    }

    await Admin.findByIdAndDelete(adminId);
    return res.status(200).json({ message: 'Admin deleted successfully' });
});

module.exports = { getAdmin, getAdmins, addAdmin, updateAdmin, deleteAdmin };
