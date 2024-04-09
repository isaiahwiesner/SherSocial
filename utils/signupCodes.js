// Imports
const { con } = require("./sql");


// Get by signup code
const getSignupCode = (signupCode) => {
    return new Promise((resolve) => { // Return a new promise
        con.query(`SELECT * FROM signup_codes
        WHERE (signupCode = '${signupCode}')`, (err, rows) => { // Execute SQL query
            if (err || rows.length === 0) resolve(null); // Error or no rows, resolve null
            resolve(rows[0]); // Resolve the first row
        })
    });
};

// Create a signup code
const createSignupCode = (signupCodeData = { signupCode: null, expiresAt: null }) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        signupCodeData = { signupCode: null, expiresAt: null, ...signupCodeData }; // Set default values for signupCodeData if not defined in function call
        if (!signupCodeData.signupCode) reject("Missing sign up code.") // Reject if anything is undefined
        if (await getSignupCode(signupCodeData.signupCode)) reject("Sign up code already in use."); // Reject if username is in use
        con.query(`INSERT INTO signup_codes VALUES (
            '${signupCodeData.signupCode}',
            ${signupCodeData.expiresAt ? signupCodeData.expiresAt : "NULL"},
            ${Date.now()}
        )`, (err) => { // SQL insert statement
            if (err) return reject(err);
            con.commit();
            return resolve(signupCodeData); // Return the added data (without the password)
        });
    });
};

// Delete a sign up code
const deleteSignupCode = (signupCode) =>{
    return new Promise(async (resolve, reject) => {
        const code = await getSignupCode(signupCode);
        if (!code) return reject("Sign up code not found.");
        con.query(`DELETE FROM signup_codes
        WHERE (signupCode = '${signupCode}')`, (err) => {
            if (err) return reject(err);
            con.commit();
            resolve(code);
        });
    });
};

module.exports = {
    getSignupCode,
    createSignupCode,
    deleteSignupCode
}