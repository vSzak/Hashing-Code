"use strict";

// Import the bcryptjs library for password hashing
const bcryptjs = require("bcryptjs");

// Import database client and other necessary modules
const db = require("../Source/db-client");
const Member = require("../Source/member");
const Venue = require("../Source/venue");
const path = require("path");

// Define an asynchronous function for rendering the login page
async function loginPage(req, res) {
    // Check if the user is already authenticated (has an active session)
    if (req.session.user) {
        // Redirect to the dashboard if the user is already logged in
        res.redirect("/dashboard");
        return;
    }

    // Set Cache-Control header to prevent caching of the login page
    res.set("Cache-Control", "no-store");

    // Send the login page as a response
    res.sendFile(utils.get_views_path("login.js"));
}

// Define an asynchronous function for handling login form submissions
async function loginFormSubmit(req, res) {
    try {
        // Extract user-provided email and password from the request
        const req_email = req.body.email_address;
        const req_password = req.body.req_password;

        // Initialize variables for user and venue identification
        let isVenue = false;
        let user;

        // Query the database to find a user by email address
        user = await db.members_collection.findOne({ email: req_email });

        // Check if the user was found in the database
        if (user === null) {
            // Log a warning for a failed login attempt and redirect to the login page
            log.warning(`Failed login attempt [USER: ${req_email}]`);
            res.redirect("/login");
            return;
        }

        // Compare the provided password with the hashed password stored in the database
        const valid = await bcryptjs.compare(req_password, user.password);

        // Check if the password is valid
        if (valid) {
            if (isVenue) {
                // Log a successful login attempt for a venue user and redirect to the venue dashboard
                log.info(`Successful login attempt [VENUE: ${req_email}]`);
                req.session.regenerate(() => {
                    req.session.user = user;
                    req.session.isVenue = true;
                    res.redirect("/venue-dashboard");
                });
            } else {
                // Log a successful login attempt for a regular user and redirect to the user dashboard
                log.info(`Successful login attempt [USER: ${req_email}]`);
                req.session.regenerate(() => {
                    req.session.user = user;
                    req.session.isVenue = false;
                    res.redirect("/dashboard");
                });
            }
        } else {
            // Log a warning for a failed login attempt with an incorrect password and redirect to the login page
            log.warning(`Failed login attempt with incorrect password [USER: ${req_email}]`);
            res.redirect("/login");
        }
    } catch (err) {
        // Log an error for a failed login due to an internal error
        log.error(`Failed login due to internal error: ${err}`);

        // If the response is not yet sent, respond with a 500 Internal Server Error
        if (!res.writableEnded) {
            res.sendStatus(500);
        }
    }
}

// Define a function for handling user logout
function logout(req, res) {
    // Destroy the user's session
    req.session.destroy(() => {});

    // Redirect to the homepage after logout
    res.redirect("/");
}

// Export the functions for use in other parts of the application
module.exports = {
    loginPage,
    loginFormSubmit,
    logout,
}
