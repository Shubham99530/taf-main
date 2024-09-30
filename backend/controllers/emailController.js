// const asyncHandler = require( 'express-async-handler' );
// const Admin = require( "../models/Admin" );
// const JM = require( "../models/JM" );
// const Professor = require( "../models/Professor" );
// const Student = require( "../models/Student" );
// const Course = require( "../models/Course" );
// const argon2 = require( 'argon2' );
// const jwt = require( "jsonwebtoken" );
// const nodemailer = require( 'nodemailer' );
// const otpGenerator = require( 'otp-generator' );
// const JWT_SECRET = "jwt"



// const transporter = nodemailer.createTransport( {
//     service: 'Gmail',
//     auth: {
//       user: process.env.USERMAIL,
//       pass: process.env.PASS, // use env file for this data , also kuch settings account ki change krni padti vo krliyo
//     },
//   } );



  
//   const sendReminderEmail = (jmEmail, courseName, allocationStatus) => {
//     return new Promise((resolve, reject) => {
//       const htmlContent = `
//         <html>
//           <head>
//             <style>
//               /* Add your styles here */
//             </style>
//           </head>
//           <body>
//             <h1>TA Allocation Reminder for ${courseName}. This is just a Trial</h1>
//             <p style="color:red;">Dear JM,
  
//             The course ${courseName} is currently in ${allocationStatus} status. Please take the necessary actions.
            
//             Best regards,
//             Admin<br/>
//             <strong>This is an Auto Generated Mail. Please do not reply.</strong></p>
//           </body>
//         </html>
//       `;
  
//       const mailOptions = {
//         from: 'btp3517@gmail.com',
//         to: jmEmail,
//         subject: 'TA allocation reminder',
//         html: htmlContent,
//       };
  
//       transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//           console.log('Error sending email:', error);
//           reject(error);
//         } else {
//           console.log('Email sent:', info.response,jmEmail);
//           resolve(info);
//         }
//       });
//     });
//   };
  
//   const sendReminderEmails = asyncHandler(async (req, res) => {
//     const { allocationStatus } = req.body;
  
//     try {
//       const courses = await Course.find();
//       const coursesToRemind = courses.filter(course => {
//         if (allocationStatus === "Over Allocation") {
//           return course.taAllocated.length > course.taRequired;
//         }
//         if (allocationStatus === "Under Allocation") {
//           return course.taAllocated.length < course.taRequired;
//         }
//         return false;
//       });
  
//     //   const emailPromises = [];

//       const ab=[];
  
//       for (const course of coursesToRemind) {
//         const jms = await JM.findById(course.department );
       
//           sendReminderEmail(jms.emailId, course.name, allocationStatus);
//           ab.push(jms.EmailId);
        
//       }
  
      
  
//       console.log(`Successfully sent ${ab} emails, failed`);
//       res.status(200).json({ message: `Successfully sent ${ab} email reminders, failed` });
//     } catch (error) {
//       console.error('Error in sendReminderEmails:', error);
      
//     }
//   });
  



// module.exports = {sendReminderEmails, sendReminderEmail }






const asyncHandler = require('express-async-handler');
const Admin = require("../models/Admin");
const JM = require("../models/JM");
const Professor = require("../models/Professor");
const Student = require("../models/Student");
const Course = require("../models/Course");
const argon2 = require('argon2');
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const JWT_SECRET = "jwt";

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.USERMAIL,
    pass: process.env.PASS, // use env file for this data
  },
});

const sendReminderEmail = (jmEmail, allocationStatus) => {
  return new Promise((resolve, reject) => {
    const htmlContent = `
      <html>
        <head>
          <style>
            /* Add your styles here */
          </style>
        </head>
        <body>
          <h1>TA Allocation Reminder</h1>
          <p style="color:red;">Dear JM,

          The courses under your department are currently in ${allocationStatus} status. Please take the necessary actions.
          
          Best regards,
          Admin<br/>
          <strong>This is an Auto Generated Mail. Please do not reply.</strong></p>
        </body>
      </html>
    `;

    const mailOptions = {
      from: 'btp3517@gmail.com',
      to: jmEmail,
      subject: 'TA Allocation Reminder',
      html: htmlContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        reject(error);
      } else {
        console.log('Email sent:', info.response, jmEmail);
        resolve(info);
      }
    });
  });
};

const sendReminderEmails = asyncHandler(async (req, res) => {
  const { allocationStatus } = req.body;

  try {
    const courses = await Course.find();
    const coursesToRemind = courses.filter(course => {
      if (allocationStatus === "Over Allocation") {
        return course.taAllocated.length > course.taRequired;
      }
      if (allocationStatus === "Under Allocation") {
        return course.taAllocated.length < course.taRequired;
      }
      return false;
    });

    const jmsToNotify = new Set();

    for (const course of coursesToRemind) {
      const jm = await JM.findById(course.department);
      if (jm) {
        jmsToNotify.add(jm.emailId);
      }
    }

    const emailPromises = Array.from(jmsToNotify).map(jmEmail =>
      sendReminderEmail(jmEmail, allocationStatus)
    );

    await Promise.all(emailPromises);

    console.log(`Successfully sent ${emailPromises.length} email reminders`);
    res.status(200).json({ message: `Successfully sent ${emailPromises.length} email reminders` });
  } catch (error) {
    console.error('Error in sendReminderEmails:', error);
    res.status(500).json({ message: 'Failed to send reminder emails', error });
  }
});

module.exports = { sendReminderEmails, sendReminderEmail };
