// Isaiah Wiesner
// Date: 4/3/2024
// Updated: 4/3/2024
// Purpose: API Router for Web Programming Assignment 8



// Imports
const { Router } = require('express');
const { body, validationResult } = require("express-validator");
const { getUserByUsername, comparePass, generateJWTRefresh, generateJWTAccess, createUser, encryptPass, getUserById, deleteUser, uploadUserImage, deleteUserImages } = require('../utils/users');
const disallowAuth = require('../middleware/disallowAuth');
const requireAdmin = require('../middleware/requireAdmin');
const requireAuth = require('../middleware/requireAuth');
const { con } = require("../utils/sql");
const { createSignupCode, getSignupCode, deleteSignupCode } = require('../utils/signupCodes');
const { urlIsImage } = require('../utils/misc');
const { createPost, getPostById, deletePost, uploadPostImage } = require('../utils/posts');
const { getTimeSince } = require('../utils/time');


// Router Initialization
const apiRouter = Router();


// Authentication Routes

// Sign Up
// /shersocial/api/signup
apiRouter.post(
    "/signup", // apiRouter uses "/shersocial/api" root - /shersocial/api/signup
    disallowAuth({ type: "json", message: "You are already logged in!" }), // Don't allow logged in users
    body("signupCode").exists().notEmpty().withMessage("Sign up code is required."), // Require non-empty first name field
    body("signupCode").custom(async (val) => !(await getSignupCode(val)) && Promise.reject()).withMessage("Invalid sign up code."),
    body("signupCode").custom(async (val) => (await getSignupCode(val)) && (await getSignupCode(val)).expiresAt < Date.now() && Promise.reject()).withMessage("Sign up code expired."),
    body("username").toLowerCase().exists().notEmpty().withMessage("Username is required."), // Require non-empty username field
    body("username").toLowerCase().custom(async (val,) => (await getUserByUsername(val)) && Promise.reject()).withMessage("Username already in use."), // Check to see if username is in use
    body("firstName").exists().notEmpty().withMessage("First name is required."), // Require non-empty first name field
    body("lastName").exists().notEmpty().withMessage("Last name is required."), // Require non-empty last name field
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                const user = await createUser({
                    username: req.body.username,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    password: req.body.signupCode
                });
                const refreshToken = await generateJWTRefresh(req.body.username.toLowerCase());
                const accessToken = await generateJWTAccess(refreshToken);
                res.cookie("refreshToken", refreshToken);
                res.cookie("accessToken", accessToken);
                return res.status(200).json({ status: 200, ok: true, detail: `Signed up and logged in as ${user.username}`, userId: user.userId });
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to sign up.", stack: e.stack });
            }
        }
    }
);
// Login
// /shersocial/api/login
apiRouter.post(
    "/login", // apiRouter uses "/shersocial/api" root - /shersocial/api/login
    disallowAuth({ type: "json", message: "You are already logged in!" }), // Don't allow logged in users
    body("username").toLowerCase().exists().notEmpty().withMessage("Username is required."), // Require non-empty username field
    body("username").toLowerCase().custom(async (val, { req }) => (val && req.body.password && !(await comparePass(val, req.body.password))) && Promise.reject()).withMessage("Invalid username or password."), // Compare username and password and see if it is valid
    body("password").exists().notEmpty().withMessage("Password is required."), // Require non-empty password field
    body("password").custom(async (val, { req }) => (val && req.body.username && !(await comparePass(req.body.username, val))) && Promise.reject()).withMessage("Invalid username or password."), // Compare username and password and see if it is valid
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                const user = await getUserByUsername(req.body.username);
                const refreshToken = await generateJWTRefresh(req.body.username.toLowerCase());
                const accessToken = await generateJWTAccess(refreshToken);
                res.cookie("refreshToken", refreshToken);
                res.cookie("accessToken", accessToken);
                return res.status(200).json({ status: 200, ok: true, detail: `Logged in as ${user.username}`, userId: user.userId });
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to log in.", stack: e.stack });
            }
        }
    }
);
// Logout
// /shersocial/api/logout
apiRouter.post(
    "/logout", // apiRouter uses "/shersocial/api" root - /shersocial/api/logout
    requireAuth({ type: "json", message: "You are already logged out!" }), // Require logged-in user
    (req, res) => {
        res.clearCookie("accessToken"); // Clear JWT access token from cookies
        res.clearCookie("refreshToken"); // Clear JWT refresh token from cookies
        return res.status(200).json({ status: 200, ok: true, detail: "Successfully logged out." }); // Return JSON for 200 OK request
    }
);



// Profile Routes

// Edit Profile
// /shersocial/api/edit-profile
apiRouter.put(
    "/edit-profile",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("username").toLowerCase().custom(async (val, { req }) => val && req.user.username !== val && (await getUserByUsername(val)) && Promise.reject()).withMessage("Username already in use."),
    body("username").toLowerCase().custom(val => /^\w{3,24}$/.test(val)).withMessage("Invalid username."),
    body("firstName").notEmpty().withMessage("First name cannot be empty."),
    body("lastName").notEmpty().withMessage("Last name cannot be empty."),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            const validKeys = ["username", "firstName", "lastName"];
            const updates = { ...req.body };
            Object.keys(updates).forEach(k => {
                if (!validKeys.includes(k)) delete updates[k];
                if (updates[k] === null) delete updates[k];
                if (updates[k] === req.user[k]) delete updates[k];
            });
            if (Object.keys(updates).length == 0) return res.status(400).json({ status: 400, ok: false, detail: "No changes detected." });
            try {
                con.query(`UPDATE users
            SET ${Object.keys(updates).map(k => `${k} = '${updates[k]}'`).join(", ")},
            updatedAt = ${Date.now()}
            WHERE userId = '${req.user.userId}'`, (err) => {
                    if (err) throw err;
                    con.commit();
                    res.clearCookie("accessToken");
                    return res.status(200).json({ status: 200, ok: true, detail: "Profile updated!", updates });
                });
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to update profile.", stack: e.stack });
            }
        }
    }
);
// Upload Profile Image
// /shersocial/api/profile-image
apiRouter.post(
    "/profile-image",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("image").exists().notEmpty().withMessage("No image chosen."),
    body("image").custom(val => /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/.test(val) || /https?:\/\/[^\.]\..+/.test(val)).withMessage("Invalid image."),
    body("fileType").custom((val, { req }) => !req.body.image || !/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/.test(req.body.image) || val).withMessage("File type is required."),
    async (req, res) => {
        try {
            if (/https?:\/\/[^\.]*\..+/.test(req.body.image)) {
                const isImage = await urlIsImage(req.body.image);
                if (!isImage) {
                    return res.status(400).json({ status: 200, ok: false, detail: "Invalid image URL." })
                }
                else {
                    con.query(`UPDATE users
                    SET image = '${req.body.image}',
                    updatedAt = ${Date.now()}
                    WHERE (userId = '${req.user.userId}')`, async (err) => {
                        if (err) throw err;
                        con.commit();
                        await deleteUserImages(req.user.userId);
                        res.clearCookie("accessToken");
                        return res.status(200).json({ status: 200, ok: true, detail: "Profile image updated!" });
                    });
                }
            }
            else {
                const imagePath = await uploadUserImage(req.user.userId, req.body.image, req.body.fileType);
                con.query(`UPDATE users
                    SET image = '${imagePath}',
                    updatedAt = ${Date.now()}
                    WHERE (userId = '${req.user.userId}')`,
                    (err) => {
                        if (err) throw err;
                        con.commit();
                        res.clearCookie("accessToken");
                        return res.status(200).json({ status: 200, ok: true, detail: "Profile image updated!" });
                    });
            }
        } catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to update profile image.", stack: e.stack });
        }
    }
);
// Delete Profile Image
// /shersocial/api/delete-profile-image
apiRouter.delete(
    "/delete-profile-image",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        try {
            await deleteUserImages(req.user.userId);
            con.query(`UPDATE users
                    SET image = NULL,
                    updatedAt = ${Date.now()}
                    WHERE (userId = '${req.user.userId}')`,
                (err) => {
                    if (err) throw err;
                    con.commit();
                    res.clearCookie("accessToken");
                    return res.status(200).json({ status: 200, ok: true, detail: "Profile image deleted!" });
                });
        } catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to delete profile image.", stack: e.stack });
        }
    }
);
// Update Password
// /shersocial/api/update-password
apiRouter.put(
    "/update-password",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("currentPassword").custom((val, { req }) => req.user.passResetRequired === 1 || val).withMessage("Current password is required."), // Value required if password reset is not
    body("currentPassword").custom(async (val, { req }) => req.user.passResetRequired === 0 && !(await comparePass(req.user.username, val)) && Promise.reject()), // Value required to be current password if password reset is not required
    body("password").custom((val, { req }) => !val || !req.body.confirmPassword || val === req.body.confirmPassword).withMessage("Passwords do not match."),
    body("password").isStrongPassword().withMessage("Password is too weak."),
    body("password").exists().notEmpty().withMessage("Password is requried."),
    body("confirmPassword").custom((val, { req }) => !val || !req.body.password || val === req.body.password).withMessage("Passwords do not match."),
    body("confirmPassword").exists().notEmpty().withMessage("Password confirmation is requried."),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                const hashedPass = await encryptPass(req.body.password);
                con.query(`UPDATE users
                SET password = '${hashedPass}',
                passResetRequired = 0,
                updatedAt = ${Date.now()}
                WHERE userId = '${req.user.userId}'`, (err) => {
                    if (err) throw err;
                    res.clearCookie("accessToken"); // Clear to refresh user data
                    return res.status(200)
                        .json({ status: 200, ok: true, detail: "Password updated!" });
                });
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to update password.", stack: e.stack });
            }
        }
    }
);



// User Routes

// Get User Posts
// /shersocial/api/users/posts
apiRouter.get(
    "/users/posts",
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        else if (!(await getUserById(userId))) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else {
            const perPage = req.query.resultsPerPage || 10;
            const page = (req.query.page || 1) < 1 ? 1 : (req.query.page || 1);
            try {
                // User is requested user - any privacy
                if (req.user && req.user.userId === userId) {
                    con.query(`SELECT COUNT(*) AS count FROM posts
                    WHERE (createdBy = '${userId}' AND posted = 1)`, (err, postCount) => {
                        if (err) throw err;
                        con.query(`SELECT posts.postId, posts.title, posts.content, MIN(post_images.image) AS image, posts.privacy, posts.createdBy, posts.createdAt, posts.updatedAt
                        FROM posts
                        LEFT JOIN post_images on posts.postId = post_images.postId
                        WHERE (createdBy = '${userId}' AND posted = 1)
                        GROUP BY posts.postId
                        ORDER BY createdAt DESC
                        LIMIT ${perPage}
                        ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                            if (err) throw err;
                            return res.status(200).json({
                                status: 200, ok: true, detail: "Posts fetched!",
                                posts: rows.map(r => {
                                    return { ...r, timeSince: getTimeSince(r.createdAt) }
                                }),
                                page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                                resultsPerPage: parseInt(perPage),
                                pages: Math.ceil(postCount[0].count / perPage)
                            });
                        });
                    });
                }
                // User is logged in - members and public privacy
                else if (req.user) {
                    con.query(`SELECT COUNT(*) AS count FROM posts
                    WHERE (createdBy = '${userId}' AND (privacy = 'public' OR privacy = 'members') AND posted = 1)`, (err, postCount) => {
                        if (err) throw err;
                        con.query(`SELECT posts.postId, posts.title, posts.content, MIN(post_images.image) AS image, posts.privacy, posts.createdBy, posts.createdAt, posts.updatedAt
                        FROM posts
                        LEFT JOIN post_images on posts.postId = post_images.postId
                        WHERE (createdBy = '${userId}' AND (privacy = 'public' OR privacy = 'members') AND posted = 1)
                        GROUP BY posts.postId
                        ORDER BY createdAt DESC
                        LIMIT ${perPage}
                        ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                            if (err) throw err;
                            return res.status(200).json({
                                status: 200, ok: true, detail: "Posts fetched!",
                                posts: rows.map(r => {
                                    return { ...r, timeSince: getTimeSince(r.createdAt) }
                                }),
                                page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                                resultsPerPage: parseInt(perPage),
                                pages: Math.ceil(postCount[0].count / perPage)
                            });
                        });
                    });
                }
                // User is not logged in - public privacy only
                else {
                    con.query(`SELECT COUNT(*) AS count FROM posts
                    WHERE (createdBy = '${userId}' AND privacy = 'public' AND posted = 1)`, (err, postCount) => {
                        if (err) throw err;
                        con.query(`SELECT posts.postId, posts.title, posts.content, MIN(post_images.image) AS image, posts.privacy, posts.createdBy, posts.createdAt, posts.updatedAt
                        FROM posts
                        LEFT JOIN post_images on posts.postId = post_images.postId
                        WHERE (createdBy = '${userId}' AND privacy = 'public' AND posted = 1)
                        GROUP BY posts.postId
                        ORDER BY createdAt DESC
                        LIMIT ${perPage}
                        ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                            if (err) throw err;
                            return res.status(200).json({
                                status: 200, ok: true, detail: "Posts fetched!",
                                posts: rows.map(r => {
                                    return { ...r, timeSince: getTimeSince(r.createdAt) }
                                }),
                                page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                                resultsPerPage: parseInt(perPage),
                                pages: Math.ceil(postCount[0].count / perPage)
                            });
                        });
                    });
                }
            }
            catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to get user posts.", stack: e.stack });
            }
        }
    }
);
// Follow User
// /shersocial/api/users/follow
apiRouter.post(
    "/users/follow",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        else if (!(await getUserById(userId))) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else {
            try {
                con.query(`SELECT * FROM user_followers
                WHERE (userId = '${userId}' AND followerId = '${req.user.userId}')`, (err, rows) => {
                    if (err) throw err;
                    if (rows.length > 0) throw new Error("Already following user.");
                    con.query(`INSERT INTO user_followers VALUES (
                        '${userId}',
                        '${req.user.userId}'
                    )`, (err) => {
                        if (err) throw err;
                        return res.status(200).json({ status: 200, ok: true, detail: "User followed!", userId });
                    });
                })
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to follow user.", stack: e.stack });
            }
        }
    }
);
// Unfollow User
// /shersocial/api/users/unfollow
apiRouter.post(
    "/users/unfollow",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        else if (!(await getUserById(userId))) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else {
            try {
                con.query(`SELECT * FROM user_followers
                WHERE (userId = '${userId}' AND followerId = '${req.user.userId}')`, (err, rows) => {
                    if (err) throw err;
                    if (rows.length === 0) throw new Error("Not following user.");
                    con.query(`DELETE FROM user_followers 
                    WHERE (userId = '${userId}' AND followerId = '${req.user.userId}')`, (err) => {
                        if (err) throw err;
                        return res.status(200).json({ status: 200, ok: true, detail: "User unfollowed!", userId });
                    });
                })
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to unfollow user.", stack: e.stack });
            }
        }
    }
);



// Post Routes

// Get Posts
// /shersocial/api/posts
apiRouter.get(
    "/posts",
    async (req, res) => {
        const perPage = req.query.resultsPerPage || 10;
        const page = (req.query.page || 1) < 1 ? 1 : (req.query.page || 1);
        try {
            if (req.user) {
                con.query(`SELECT COUNT(*) AS count FROM posts
                WHERE ((privacy = 'public' OR privacy = 'members') AND posted = 1)`, (err, postCount) => {
                    if (err) throw err;
                    con.query(`SELECT posts.postId, posts.title, posts.content, MIN(post_images.image) AS image, posts.privacy, posts.createdBy, posts.createdAt, posts.updatedAt, CONCAT(users.firstName, ' ', users.lastName) creatorFullName, users.username as creatorUsername, users.image as creatorImage
                    FROM posts
                    LEFT JOIN post_images on posts.postId = post_images.postId
                    LEFT JOIN users on posts.createdBy = users.userId
                    WHERE ((privacy = 'public' OR privacy = 'members') AND posted = 1)
                    GROUP BY posts.postId
                    ORDER BY createdAt DESC
                    LIMIT ${perPage}
                    ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                        if (err) throw err;
                        return res.status(200).json({
                            status: 200, ok: true, detail: "Posts fetched!",
                            posts: rows.map(r => {
                                return { ...r, timeSince: getTimeSince(r.createdAt) }
                            }),
                            page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                            resultsPerPage: parseInt(perPage),
                            pages: Math.ceil(postCount[0].count / perPage)
                        });
                    });
                });
            }
            // User is not logged in - public privacy only
            else {
                con.query(`SELECT COUNT(*) AS count FROM posts
                WHERE (privacy = 'public' AND posted = 1)`, (err, postCount) => {
                    if (err) throw err;
                    con.query(`SELECT posts.postId, posts.title, posts.content, MIN(post_images.image) AS image, posts.privacy, posts.createdBy, posts.createdAt, posts.updatedAt, CONCAT(users.firstName, ' ', users.lastName) creatorFullName, users.username as creatorUsername, users.image as creatorImage
                    FROM posts
                    LEFT JOIN post_images on posts.postId = post_images.postId
                    LEFT JOIN users on posts.createdBy = users.userId
                    WHERE (privacy = 'public' AND posted = 1)
                    GROUP BY posts.postId
                    ORDER BY createdAt DESC
                    LIMIT ${perPage}
                    ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                        if (err) throw err;
                        return res.status(200).json({
                            status: 200, ok: true, detail: "Posts fetched!",
                            posts: rows.map(r => {
                                return { ...r, timeSince: getTimeSince(r.createdAt) }
                            }),
                            page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                            resultsPerPage: parseInt(perPage),
                            pages: Math.ceil(postCount[0].count / perPage)
                        });
                    });
                });
            }
        }
        catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to fetch posts.", stack: e.stack });
        }
    }
);

// Create Post
// /shersocial/api/posts/add
apiRouter.post(
    "/posts/add",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("title").exists().notEmpty().withMessage("Title is required."),
    body("content").exists().notEmpty().withMessage("Content is required."),
    body("privacy").exists().notEmpty().withMessage("Privacy is required."),
    body("privacy").custom(val => !val || ["public", "members", "private"].includes(val)).withMessage("Invalid privacy type."),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                const post = await createPost({ title: req.body.title, content: req.body.content, privacy: req.body.privacy }, req.user.userId);
                return res.json({ status: 201, ok: true, detail: "Post created but not posted, ready for images and files.", post });
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to create post.", stack: e.stack });
            }
        }
    }
);
// Publish Post
// /shersocial/api/posts/publish
apiRouter.post(
    "/posts/publish",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else if (req.user.admin === 0 && post.createdBy !== req.user.userId) {
            return res.status(401).json({ status: 401, ok: false, detail: "You do not have access to update this post." });
        }
        else {
            try {
                con.query(`UPDATE posts
                SET posted = 1,
                createdAt = ${Date.now()},
                updatedAt = ${Date.now()}
                WHERE (postId = '${postId}')`, (err) => {
                    if (err) throw err;
                    con.commit();
                    return res.status(200).json({ status: 200, ok: true, detail: "Post published!" });
                });
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to publish post.", stack: e.stack });
            }
        }
    }
);
// Edit Post
// /shersocial/api/posts/update
apiRouter.put(
    "/posts/update",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("title").notEmpty().withMessage("Title is required."),
    body("content").notEmpty().withMessage("Content is required."),
    body("privacy").notEmpty().withMessage("Privacy is required."),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else if (req.user.admin === 0 && post.createdBy !== req.user.userId) {
            return res.status(401).json({ status: 401, ok: false, detail: "You do not have access to update this post." });
        }
        else {
            try {
                const validKeys = ["title", "content", "privacy"];
                const updates = { ...req.body };
                Object.keys(updates).forEach(k => {
                    if (!validKeys.includes(k)) delete updates[k];
                    if (updates[k] === null || updates[k] === post[k]) delete updates[k];
                });
                if (Object.keys(updates).length == 0) {
                    if (!req.query.ignoreNoChanges || req.query.ignoreNoChanges === "0") return res.status(400).json({ status: 400, ok: false, detail: "No changes detected." });
                    return res.status(200).json({ status: 200, ok: true, detail: "Ignoring no changes." });
                }
                else {
                    con.query(`UPDATE posts SET ${Object.keys(updates).map(k => `${k} = '${updates[k]}'`).join(", ")},
                    updatedAt = ${Date.now()}
                    WHERE postId = '${postId}'`, (err) => {
                        if (err) throw err;
                        con.commit();
                        return res.status(200).json({ status: 200, ok: true, detail: "Post updated!", updates });
                    });
                }
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to update post.", stack: e.stack });
            }
        }
    }
);
// Delete Post
// /shersocial/api/posts/delete
apiRouter.delete(
    "/posts/delete",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else if (req.user.admin === 0 && post.createdBy !== req.user.userId) {
            return res.status(401).json({ status: 401, ok: false, detail: "You do not have access to delete this post." });
        }
        else {
            try {
                const deletedPost = await deletePost(postId);
                return res.json({ status: 201, ok: true, detail: "Post deleted.", post: deletedPost });
            }
            catch (e) {
                return res.json({ status: 500, ok: false, detil: "Unable to delete post.", stack: e.stack });
            }
        }
    }
);
// Add Post Image
// /shersocial/api/posts/add-image
apiRouter.post(
    "/posts/add-image",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    body("image").exists().notEmpty().withMessage("No image chosen."),
    body("image").custom(val => /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/.test(val) || /https?:\/\/[^\.]\..+/.test(val)).withMessage("Invalid image."),
    body("fileType").custom((val, { req }) => !req.body.image || !/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/.test(req.body.image) || val).withMessage("File type is required."),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else if (req.user.admin === 0 && post.createdBy !== req.user.userId) {
            return res.status(401).json({ status: 401, ok: false, detail: "You do not have access to update this post." });
        }
        else {
            try {
                if (/https?:\/\/[^\.]*\..+/.test(req.body.image)) {
                    const isImage = await urlIsImage(req.body.image);
                    if (!isImage) {
                        return res.status(400).json({ status: 200, ok: false, detail: "Invalid image URL." })
                    }
                    else {
                        con.query(`INSERT INTO post_images VALUES (
                            '${postId}',
                            '${req.body.image}'
                        )`, async (err) => {
                            if (err) throw err;
                            con.query(`UPDATE posts
                                SET updatedAt = ${Date.now()}
                                WHERE (postId = '${postId}')`, async (err) => {
                                if (err) throw err;
                                con.commit();
                                return res.status(200).json({ status: 200, ok: true, detail: "Post image added!" });
                            });
                        });
                    }
                }
                else {
                    const imagePath = await uploadPostImage(postId, req.body.image, req.body.fileType);
                    con.query(`INSERT INTO post_images VALUES (
                        '${postId}',
                        '${imagePath}'
                    )`,
                        (err) => {
                            if (err) throw err;
                            con.query(`UPDATE posts
                                SET updatedAt = ${Date.now()}
                                WHERE (postId = '${postId}')`, async (err) => {
                                if (err) throw err;
                                con.commit();
                                return res.status(200).json({ status: 200, ok: true, detail: "Post image added!" });
                            });
                        });
                }
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to add post image.", stack: e.stack });
            }
        }
    }
);
// Remove Post Image
// /shersocial/api/posts/remove-image
apiRouter.delete(
    "/posts/remove-image",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const postId = req.query.postId;
        const imagePath = req.query.imagePath ? decodeURIComponent(req.query.imagePath) : null;
        if (!postId || !imagePath) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID and image path must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else if (req.user.admin === 0 && post.createdBy !== req.user.userId) {
            return res.status(401).json({ status: 401, ok: false, detail: "You do not have access to update this post." });
        }
        else {
            try {
                con.query(`DELETE FROM post_images
                WHERE (postId = '${postId}' AND image = '${imagePath}')`, (err) => {
                    if (err) throw err;
                    con.query(`UPDATE posts
                        SET updatedAt = ${Date.now()}
                        WHERE (postId = '${postId}')`, async (err) => {
                        if (err) throw err;
                        con.commit();
                        return res.status(200).json({ status: 200, ok: true, detail: "Image removed!" });
                    });
                });
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to add post image.", stack: e.stack });
            }
        }
    }
);
// Like Post
// /shersocial/api/posts/like-post
apiRouter.post(
    "/posts/like-post",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else {
            try {
                con.query(`SELECT * FROM post_likes
                WHERE (postId = '${postId}' AND userId = '${req.user.userId}')`, (err, count) => {
                    if (err) throw err;
                    if (count.length > 0) {
                        return res.status(400).json({ status: 400, ok: false, detail: "You have already liked this post." })
                    }
                    else {
                        con.query(`INSERT INTO post_likes VALUES (
                            '${postId}',
                            '${req.user.userId}'
                        )`, (err) => {
                            if (err) throw err;
                            return res.status(200).json({ status: 200, ok: true, detail: "Post liked!" });
                        });
                    }
                })
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to like post.", stack: e.stack });
            }
        }
    }
);
// Unlike Post
// /shersocial/api/posts/unlike-post
apiRouter.post(
    "/posts/unlike-post",
    requireAuth({ type: "json", message: "This route requires authentication." }),
    async (req, res) => {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ status: 400, ok: false, detail: "Post ID must be provided in query parameters." });
        }
        const post = await getPostById(postId);
        if (!post) {
            return res.status(404).json({ status: 404, ok: false, detail: "Post not found." });
        }
        else {
            try {
                con.query(`SELECT * FROM post_likes
                WHERE (postId = '${postId}' AND userId = '${req.user.userId}')`, (err, count) => {
                    if (err) throw err;
                    if (count.length === 0) {
                        return res.status(400).json({ status: 400, ok: false, detail: "You have not liked this post." })
                    }
                    else {
                        con.query(`DELETE FROM post_likes
                        WHERE (postId = '${postId}' AND userId = '${req.user.userId}')`, (err) => {
                            if (err) throw err;
                            return res.status(200).json({ status: 200, ok: true, detail: "Post unliked!" });
                        });
                    }
                })
            } catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to unlike post.", stack: e.stack });
            }
        }
    }
);


// Admin Routes

// Add User
// /shersocial/api/admin/add-user
apiRouter.post(
    "/admin/add-user", // apiRouter uses "/shersocial/api" root - /shersocial/api/admin/add-user
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    body("username").toLowerCase().exists().notEmpty().withMessage("Username is required."), // Require non-empty username field
    body("username").toLowerCase().custom(val => !val || /^\w{3,24}$/.test(val)).withMessage("Invalid username."), // Require alpha-num. & underscore username 3-24 chars
    body("firstName").exists().notEmpty().withMessage("First name is required."), // Require non-empty first name field
    body("lastName").exists().notEmpty().withMessage("First name is required."), // Require non-empty last name field
    body("password").exists().notEmpty().withMessage("Password is required."), // Require non-empty password field
    body("confirmPassword").exists().notEmpty().withMessage("Password confirmation is required."), // Require non-empty confirm password field
    body("password").custom((val, { req }) => !val || !req.body.confirmPassword || val === req.body.confirmPassword).withMessage("Passwords do not match."), // Check if password and confirm password match only if both are not empty
    body("confirmPassword").custom((val, { req }) => !val || !req.body.password || val === req.body.password).withMessage("Passwords do not match."), // Check if password and confirm password match only if both are not empty
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                var newUserData = { ...req.body }; // Make new variable with body params
                Object.keys(newUserData).forEach(k => { // Loop new user data keys
                    if (!"username,firstName,lastName,password".split(",").includes(k)) { // Key isn't valid
                        delete newUserData[k]; // Delete it with no further errors;
                        // Note confirmPaswsord is not needed to create a new user, it is just for validation purposes
                    }
                });
                const newUser = await createUser(newUserData);
                return res.status(201) // OK Created
                    .json({ status: 200, ok: true, detail: "User added!", user: newUser });
            }
            catch (e) {
                return res.status(500) // Internal server error
                    .json({ status: 500, ok: false, detil: "Unable to add user.", stack: e.stack });

            }
        }
    }
);
// Get Users
// /shersocial/api/admin/users
apiRouter.get(
    "/admin/users",
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        try {
            const query = req.query.q || null;
            const perPage = req.query.resultsPerPage || 10;
            const page = (req.query.page || 1) < 1 ? 1 : (req.query.page || 1);
            con.query(`SELECT COUNT(*) AS count FROM users
            ${query ? `WHERE (
                LOWER(username) LIKE '%${query.toLowerCase()}%'
                OR LOWER(firstName) LIKE '%${query.toLowerCase()}%'
                OR LOWER(lastName) LIKE '%${query.toLowerCase()}%'
                OR CONCAT(LOWER(firstName), ' ', LOWER(lastName)) LIKE '%${query.toLowerCase()}%'
                OR userId = '${query}'
            )` : ''}`, (err, userCount) => {
                if (err) throw err;
                con.query(`SELECT * FROM users
                ${query ? `WHERE (
                    LOWER(username) LIKE '%${query.toLowerCase()}%'
                    OR LOWER(firstName) LIKE '%${query.toLowerCase()}%'
                    OR LOWER(lastName) LIKE '%${query.toLowerCase()}%'
                    OR CONCAT(LOWER(firstName), ' ', LOWER(lastName)) LIKE '%${query.toLowerCase()}%'
                    OR userId = '${query}'
                )` : ''}
                ORDER BY lastName, username, firstName
                LIMIT ${perPage}
                ${page > 1 ? ` OFFSET ${((page > Math.ceil(userCount[0].count / perPage) ? Math.ceil(userCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                    if (err) throw err;
                    return res.status(200).json({
                        status: 200, ok: true, detail: "Users searched!", users: rows.map(u => {
                            delete u.password;
                            return u;
                        }),
                        page: parseInt((page > Math.ceil(userCount[0].count / perPage) ? Math.ceil(userCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(userCount[0].count / perPage) ? Math.ceil(userCount[0].count / perPage) : page) : 1),
                        resultsPerPage: parseInt(perPage),
                        pages: Math.ceil(userCount[0].count / perPage)
                    });
                });
            });
        }
        catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to search users.", stack: e.stack });
        }
    }
);
// Delete User
// /shersocial/api/admin/delete-user
apiRouter.delete(
    "/admin/delete-user", // apiRouter uses "/shersocial/api" root - /shersocial/api/admin/delete-user
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        else if (!(await getUserById(userId))) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else if (userId === req.user.userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "You cannot delete yourself!" });
        }
        else {
            try {
                const deletedUser = await deleteUser(userId);
                return res.status(200) // OK
                    .json({ status: 200, ok: true, detail: "User deleted!", user: deletedUser });
            }
            catch (e) {
                return res.status(500) // Internal server error
                    .json({ status: 500, ok: false, detil: "Unable to delete user.", stack: e.stack });

            }
        }
    }
);
// Add User Admin
// /shersocial/api/admin/add-admin
apiRouter.post(
    "/admin/add-admin",
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        const user = await getUserById(userId)
        if (!user) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else if (user.admin === 1) {
            return res.status(400).json({ status: 400, ok: false, detail: "This user is already an admin." });
        }
        else {
            try {
                con.query(`UPDATE users
                SET admin = 1,
                updatedAt = ${Date.now()}
                WHERE (userId = '${userId}')`, (err) => {
                    if (err) throw err;
                    return res.status(200).json({ status: 200, ok: true, detail: "User assigned admin role!" });
                });
            }
            catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to assign user to admin role." });
            }
        }
    }
)
// Remove User Admin
// /shersocial/api/admin/remove-admin
apiRouter.post(
    "/admin/remove-admin",
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "User ID must be provided in query parameters." });
        }
        const user = await getUserById(userId)
        if (!user) {
            return res.status(404).json({ status: 404, ok: false, detail: "User not found." });
        }
        else if (userId === req.user.userId) {
            return res.status(400).json({ status: 400, ok: false, detail: "You cannot unassign yourself!" });
        }
        else if (user.admin === 0) {
            return res.status(400).json({ status: 400, ok: false, detail: "This user is not currently an admin." });
        }
        else {
            try {
                con.query(`UPDATE users
                SET admin = 0,
                updatedAt = ${Date.now()}
                WHERE (userId = '${userId}')`, (err) => {
                    if (err) throw err;
                    return res.status(200).json({ status: 200, ok: true, detail: "User removed from admin role!" });
                });
            }
            catch (e) {
                return res.status(500).json({ status: 500, ok: false, detail: "Unable to remove assign user from admin role." });
            }
        }

    }
)

// Add Signup Code
// /shersocial/api/admin/add-signup-code
apiRouter.post(
    "/admin/add-signup-code", // apiRouter uses "/shersocial/api" root - /shersocial/api/admin/add-user
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    body("signupCode").matches(/^\w{4,24}$/).withMessage("Invalid sign up code."),
    body("signupCode").exists().notEmpty().withMessage("Sign up code is required."),
    body("expiresAt").custom(val => !val || String(new Date(val).getTime()) !== "NaN").withMessage("Invalid expiry date/time."),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let ers = {};
            errors.array().forEach((e) => {
                ers[e.path] = e.msg;
            });
            return res.status(400).json({ status: 400, ok: false, detail: "The following errors were encountered:", errors: ers });
        }
        else {
            try {
                const signupCode = await createSignupCode({ signupCode: req.body.signupCode, expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt).getTime() : null });
                return res.status(201).json({ status: 201, ok: true, detail: "Sign up code created!", signupCode });
            }
            catch (e) {
                return res.status(500) // Internal server error
                    .json({ status: 500, ok: false, detil: "Unable to create sign up code.", stack: e.stack });
            }
        }
    }

);
// Get Sign Up Codes
// /shersocial/api/admin/signup-codes
apiRouter.get(
    "/admin/signup-codes",
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        try {
            const query = req.query.q || null;
            const perPage = req.query.resultsPerPage || 10;
            const page = (req.query.page || 1) < 1 ? 1 : (req.query.page || 1);
            con.query(`SELECT COUNT(*) AS count FROM signup_codes
            ${query ? `WHERE (
                LOWER(signupCode) LIKE '%${query.toLowerCase()}%'
            )` : ''}`, (err, codeCount) => {
                if (err) throw err;
                con.query(`SELECT * FROM signup_codes
                ${query ? `WHERE (
                    LOWER(signupCode) LIKE '%${query.toLowerCase()}%'
                )` : ''}
                ORDER BY signupCode
                LIMIT ${perPage}
                ${page > 1 ? ` OFFSET ${((page > Math.ceil(codeCount[0].count / perPage) ? Math.ceil(codeCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                    if (err) throw err;
                    return res.status(200).json({
                        status: 200, ok: true, detail: "Sign up codes searched!", signupCodes: rows,
                        page: ((page > Math.ceil(codeCount[0].count / perPage) ? Math.ceil(codeCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(codeCount[0].count / perPage) ? Math.ceil(codeCount[0].count / perPage) : page) : 1),
                        resultsPerPage: perPage,
                        pages: Math.ceil(codeCount[0].count / perPage) || 1
                    });
                });
            });
        }
        catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to search sign up codes.", stack: e.stack });
        }
    }
);
// Delete Sign Up Code
// /shersocial/api/admin/delete-signup-code
apiRouter.delete(
    "/admin/delete-signup-code", // apiRouter uses "/shersocial/api" root - /shersocial/api/admin/delete-signup-code
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        const signupCode = req.query.signupCode;
        if (!signupCode) {
            return res.status(400).json({ status: 400, ok: false, detail: "Sign up code must be provided in query parameters." });
        }
        else if (!(await getSignupCode(signupCode))) {
            return res.status(404).json({ status: 404, ok: false, detail: "Sign up code not found." });
        }
        else {
            try {
                const deletedCode = await deleteSignupCode(signupCode);
                return res.status(200) // OK
                    .json({ status: 200, ok: true, detail: "Sign up code deleted!", signupCode: deletedCode });
            }
            catch (e) {
                return res.status(500) // Internal server error
                    .json({ status: 500, ok: false, detil: "Unable to delete sign up code.", stack: e.stack });

            }
        }
    }
);

// Get Posts
// /shersocial/api/admin/posts
apiRouter.get(
    "/admin/posts",
    requireAuth({ type: "json", message: "This route requires authentication." }), // Require logged-in user
    requireAdmin({ type: "json", title: "Access Denied", message: "You do not have access to this route." }), // Require admin user
    async (req, res) => {
        try {
            const query = req.query.q || null;
            const perPage = req.query.resultsPerPage || 10;
            const page = (req.query.page || 1) < 1 ? 1 : (req.query.page || 1);
            const orderBy = req.query.orderBy || "title";
            con.query(`SELECT COUNT(*) AS count
            FROM posts
            LEFT JOIN users ON posts.createdBy = users.userId
            ${query ? `WHERE (
                LOWER(posts.title) LIKE '%${query.toLowerCase()}%'
                OR LOWER(users.firstName) LIKE '%${query.toLowerCase()}%'
                OR LOWER(users.lastName) LIKE '%${query.toLowerCase()}%'
                OR CONCAT(LOWER(users.firstName), ' ', LOWER(users.lastName)) LIKE '%${query.toLowerCase()}%'
                OR posts.postId = '${query}'
                OR users.userId = '${query}'
            )` : ''}`, (err, postCount) => {
                if (err) throw err;
                con.query(`SELECT posts.postId, posts.title, posts.createdAt, posts.updatedAt,
                (SELECT COUNT(*) FROM post_likes WHERE post_likes.postId = posts.postId) as likes,
                users.username as userUsername, CONCAT(users.firstName, ' ', users.lastName) as userFullName,
                users.image as userImage
                FROM posts
                LEFT JOIN users ON posts.createdBy = users.userId
                ${query ? `WHERE (
                    LOWER(posts.title) LIKE '%${query.toLowerCase()}%'
                    OR LOWER(users.firstName) LIKE '%${query.toLowerCase()}%'
                    OR LOWER(users.lastName) LIKE '%${query.toLowerCase()}%'
                    OR CONCAT(LOWER(users.firstName), ' ', LOWER(users.lastName)) LIKE '%${query.toLowerCase()}%'
                    OR posts.postId = '${query}'
                    OR users.userId = '${query}'
                )` : ''}
                ORDER BY ${orderBy}
                LIMIT ${perPage}
                ${page > 1 ? ` OFFSET ${((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) - 1) * perPage}` : ''}`, (err, rows) => {
                    if (err) throw err;
                    return res.status(200).json({
                        status: 200, ok: true, detail: "Posts searched!",
                        posts: rows.map(p => {
                            return {
                                ...p,
                                timeSince: getTimeSince(p.createdAt),
                                timeSinceUpdate: getTimeSince(p.updatedAt)
                            };
                        }),
                        page: parseInt((page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) > 0 ? (page > Math.ceil(postCount[0].count / perPage) ? Math.ceil(postCount[0].count / perPage) : page) : 1),
                        resultsPerPage: parseInt(perPage),
                        pages: Math.ceil(postCount[0].count / perPage),
                        orderBy
                    });
                });
            });
        }
        catch (e) {
            return res.status(500).json({ status: 500, ok: false, detail: "Unable to search posts.", stack: e.stack });
        }
    }
);


// Export Router
module.exports = apiRouter;