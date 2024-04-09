// Imports
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const env = require("./env");
const { con } = require("./sql");
const fs = require("fs");


// Get a user by ID
const getUserById = (userId) => {
    return new Promise((resolve) => { // Return a new promise
        con.query(`SELECT * FROM users
        WHERE (userId = '${userId}')`, (err, rows) => { // Execute SQL query
            if (err || rows.length === 0) resolve(null); // Error or no rows, resolve null
            resolve(rows[0]); // Resolve the first row
        })
    });
};

// Get a user by username
const getUserByUsername = (username) => {
    return new Promise((resolve) => { // Return a new promise
        con.query(`SELECT * FROM users
        WHERE (username = '${username.toLowerCase()}')`, (err, rows) => { // Execute SQL query
            if (err || rows.length === 0) resolve(null); // Error or no rows, resolve null
            resolve(rows[0]); // Resolve the first row
        })
    });
};

// Search users by username or name
const searchUsers = (search) => {
    return new Promise((resolve) => { // Return a new promise
        con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) as fullName
        FROM users
        WHERE (LOWER(username) LIKE '%${search.toLowerCase()}%'
        OR LOWER(fullName) LIKE '%${search.toLowerCase()}%')
        ORDER BY username, lastName, firstName`, (err, rows) => { // Execute SQL query
            if (err) resolve([]); // Error, resolve empty array
            resolve(rows); // Resolve the row array
        });
    });
};

// Encrypt a password
const encryptPass = (password) => {
    return new Promise((resolve, reject) => { // Return a promise
        bcrypt.genSalt(10, (err, salt) => { // Generate a salt (10 rounds - higher the rounds, stronger the encryption)
            if (err) reject(err); // Error, reject (must catch later)
            bcrypt.hash(password, salt, (err, hash) => { // Generate the hashed password
                if (err) reject(err); // Error, reject (must catch later)
                resolve(hash); // Resolve the hashed password
            })
        })
    });
};

// Compare a password
const comparePass = (username, password) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        const user = await getUserByUsername(username);
        if (!user) return resolve(false); // No user found = cannot match
        con.query(`SELECT password FROM users
        WHERE (userId = '${user.userId}')`, (err, rows) => {
            if (err || rows.length === 0) return resolve(false); // Error or no rows = cannot match (should never happen)
            bcrypt.compare(password, rows[0].password, (err, same) => {
                if (err || !same) return resolve(false) // Error or not the same = no match
                resolve(true); // Anything else
            });
        });
    });
};

// Creata a user
const createUser = (userData = { username: null, firstName: null, lastName: null, password: null }) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        userData = { username: null, firstName: null, lastName: null, password: null, ...userData }; // Set default values for userData if not defined in function call
        if (!userData.username || !userData.firstName || !userData.lastName || !userData.password) reject("Missing username, firstName, lastName, or password.") // Reject if anything is undefined
        if (await getUserByUsername(userData.username)) reject("Username already in use."); // Reject if username is in use
        const userId = uuid(); // Generate a unique UUID
        const hashedPass = await encryptPass(userData.password); // Generate a hashed password
        con.query(`INSERT INTO users VALUES (
            '${userId}',
            '${userData.username.toLowerCase()}',
            '${userData.firstName}',
            '${userData.lastName}',
            '${hashedPass}',
            NULL,
            ${Date.now()},
            ${Date.now()},
            1, 0
        )`, (err) => { // SQL insert statement
            if (err) return reject(err);
            con.commit();
            delete userData.password; // Remove password from the userData
            return resolve({ userId, ...userData }); // Return the added data (without the password)
        });
    });
};

// Delete a user
const deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        const user = await getUserById(userId);
        if (!user) return reject("User not found.");
        // Delete images associated with user posts
        con.query(`DELETE FROM post_images
        WHERE (post_images.postId IN
        (SELECT postId FROM posts WHERE createdBy = '${userId}'))`, (err) => {
            if (err) return reject(err);
            // Delete likes associated with user/user posts
            con.query(`DELETE FROM post_likes
            WHERE (post_likes.postId IN (SELECT postId FROM posts WHERE createdBy = '${userId}')
            OR userId = '${userId}')`, (err) => {
                if (err) return reject(err);
                // Delete posts associated with user
                con.query(`DELETE FROM posts
                WHERE (createdBy = '${userId}')`, (err) => {
                    if (err) return reject(err);
                    // Delete followers associated with user
                    con.query(`DELETE FROM user_followers
                    WHERE (userId = '${userId}'
                    OR followerId = '${userId}')`, (err) => {
                        if (err) return reject(err);
                        // Delete user
                        con.query(`DELETE FROM users
                        WHERE (userId = '${userId}')`, (err) => {
                            if (err) return reject(err);
                            con.commit();
                            resolve(user);
                        });
                    });
                });
            });
        });
    });
};

// Delete User Image(s)
const deleteUserImages = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await getUserById(userId);
            if (!user) reject("User not found.");
            if (!fs.existsSync("usercontent/user-images")) {
                fs.mkdirSync("usercontent/user-images");
            }
            fs.readdirSync("usercontent/user-images").filter(f => f.startsWith(userId)).forEach(f => {
                fs.rmSync(`usercontent/user-images/${f}`);
            });
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
};
// Upload User Image
const uploadUserImage = (userId, dataUri, fileType) => {
    return new Promise(async (resolve, reject) => {
        const user = await getUserById(userId);
        if (!user) reject("User not found.");
        await deleteUserImages(userId);
        if (!fs.existsSync("usercontent/user-images")) {
            fs.mkdirSync("usercontent/user-images");
        }
        const dataUriParts = dataUri.match(/^data:(.+);base64,(.*)$/);
        const base64Data = dataUriParts[2];
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(`usercontent/user-images/${userId}.${fileType}`, buffer);
        resolve(`/shersocial/usercontent/user-images/${userId}.${fileType}`);
    });
};

// Generate a JWT refresh token
const generateJWTRefresh = (username) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        const user = await getUserByUsername(username); // Get user
        if (!username) reject("User not found."); // No user
        const token = jwt.sign({ user: { userId: user.userId } }, env.jwt.REFRESH, { expiresIn: env.jwt.REFRESH_EXP }); // Get token
        resolve(token); // Resolve token
    });
};

// Generate a JWT access token
const generateJWTAccess = (token) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        const decoded = jwt.verify(token, env.jwt.REFRESH); // Decode refresh token
        if (!decoded) reject("Invalid JWT refresh token."); // Not able to decode
        const user = await getUserById(decoded.user.userId); // Get user
        if (!user) reject("User not found."); // No user
        delete user.password;
        const access = jwt.sign({ user }, env.jwt.ACCESS, { expiresIn: env.jwt.ACCESS_EXP }); // Get token
        resolve(access); // Resolve token
    });
};

module.exports = {
    getUserById,
    getUserByUsername,
    searchUsers,
    encryptPass,
    comparePass,
    createUser,
    deleteUser,
    deleteUserImages,
    uploadUserImage,
    generateJWTRefresh,
    generateJWTAccess
}