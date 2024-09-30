const express = require( 'express' );
const { allocate, deallocate, freezeAllocation, getLogs, getAllAllcation } = require( '../controllers/allocationController' );

const router = express.Router();

const { sendReminderEmails } = require('../controllers/emailController'); // Adjust the path as needed

// Make sure sendReminderEmails is correctly imported and is a function


router.route( "/allocation" ).post( allocate );
router.route( "/deallocation" ).post( deallocate );
router.route( "/freezeAllocation" ).post( freezeAllocation );
router.route("/logs").get(getLogs);
router.route("/getAllAllocation").get(getAllAllcation);


// router.route("/sendem").post(sendem)

module.exports = router;


