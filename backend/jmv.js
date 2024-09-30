// const mongoose = require('mongoose');
// require('dotenv').config(); // Ensure dotenv is required to load the .env file
// const JM = require('models/JM'); // Adjust the path based on your project structure

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => console.error('MongoDB connection error:', err));

// const showJMEmails = async () => {
//   try {
//     const jms = await JM.find(); // Fetch all JMs
//     jms.forEach(jm => {
//       console.log(`JM Email: ${jm.emailId}`); // Log the JM email to the terminal
//     });
//   } catch (error) {
//     console.error('Error fetching JMs:', error);
//   } finally {
//     mongoose.connection.close(); // Close the connection after fetching
//   }
// };

// showJMEmails();
