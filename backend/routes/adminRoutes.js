const express = require('express');
const {
    getAdmin,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    getAdmins,
} = require('../controllers/adminController'); // Existing admin functions
const syncData = require('../utils/syncData'); // Import the syncData function

const router = express.Router();

// Existing routes
router.route(':filter?').get(getAdmins).post(addAdmin);
router.route('/:id').get(getAdmin).put(updateAdmin).delete(deleteAdmin);

// New route for synchronization
router.post('/syncDatabase', async (req, res) => {
    try {
        console.log('Starting database synchronization...');
        await syncData();
        res.status(200).json({ message: 'Database synchronization completed successfully.' });
    } catch (error) {
        console.error('Error during synchronization:', error);
        res.status(500).json({ message: 'Database synchronization failed.', error: error.message });
    }
});

module.exports = router;
