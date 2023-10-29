'use strict'; 

const bcryptjs = require('bcryptjs'); // Import the bcryptjs library for password hashing
const db = require('../Source/db-client'); // Import the db-client module
const Member = require('../Source/member'); // Import the Member module
const path = require('path'); // Import the path module for file path operations
const utils = require('./utils'); // Import the utils module

function registerPage(req, res) {
  if (req.session.user !== undefined) {
    res.redirect('/dashboard'); // Redirect to the dashboard if the user is already logged in
    return;
  }

  res.sendFile(utils.get_views_path('register.js')); // Serve the register.js file from the views path
}

async function registerFormSubmit(req, res) {
  try {
    if (req.session.user) {
      res.redirect('/dashboard'); // Redirect to the dashboard if the user is already logged in
    } else {
      const passwordRegex = /^(?=.*[A-Za-Z])(?=.*[#$@!%&*?])(?=.*\d)[A-Za-z#$@!%&*??=.*\d]{8,}$/i; // Define a password validation regular expression
      if (!passwordRegex.test(req.body.password)) {
        res.status(400).send('Password does not meet the criteria.'); // Respond with an error if the password doesn't meet the criteria
        return;
      }

      const isBroker = false; // Set the isBroker flag to false
      const hashedPassword = await hashPassword(req.body.password); // Hash the user's password

      const documentCount = await db.member_collection.countDocuments({ email: req.body.email }, { limit: 1 }); // Count documents with the given email

      if (documentCount === 0) {
        const member = new Member(req.body.id, req.body.first_name, req.body.last_name, req.body.email, hashedPassword, isBroker); // Create a new Member object
        const result = await db.member_collection.insertOne(member); // Insert the member into the database

        if (result) {
          console.log(`User Successfully added [USER: ${member.email_address}]`); // Log a success message
          res.redirect('/login'); // Redirect to the login page
        } else {
          console.error('Failed to create user'); // Log an error message
          res.redirect('/register'); // Redirect to the register page
        }
      }
    }
  } catch (error) {
    console.error('Error in registerFormSubmit:', error); // Log an error message if an exception is thrown
    res.status(500).send('Internal Server Error'); // Respond with a 500 Internal Server Error
  }
}

async function hashPassword(password) {
  try {
    const saltRounds = 10; 
    const hash = await bcryptjs.hash(password, saltRounds); // Hash the password using bcryptjs
    return hash; // Return the hashed password
  } catch (error) {
    throw error; // Throw an error if hashing fails
  }
}

module.exports = {
  registerFormSubmit,
  registerPage,
};
