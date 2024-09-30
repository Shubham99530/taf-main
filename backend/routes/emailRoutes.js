const express = require( 'express' );

const router = express.Router();

const { sendReminderEmails,sendReminderEmail } = require('../controllers/emailController'); // Adjust the path as needed


router.route( "/sendem").post(sendReminderEmails)

module.exports = router;