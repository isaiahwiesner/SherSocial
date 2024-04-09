// Isaiah Wiesner
// Date: 4/3/2024
// Updated: 4/3/2024
// Purpose: Page Router for Web Programming Assignment 8



// Imports
const { Router } = require('express');
const disallowAuth = require('../middleware/disallowAuth');
const requireAdmin = require('../middleware/requireAdmin');
const requireAuth = require('../middleware/requireAuth');
const { con } = require("../utils/sql");
const { getUserByUsername } = require('../utils/users');
const { getGeneralizedPath } = require('../utils/misc');
const { getPostById } = require('../utils/posts');
const { getTimeSince } = require('../utils/time');


// Router Initialization
const pageRouter = Router();



// Home Page
// /shersocial
pageRouter.get("/", (req, res) => {
    if (req.user && req.user.passResetRequired === 1) return res.render("pages/requirePassResetPage", {
        auth: { user: req.user }, // Assign auth.user to the user if there is one
        generalizedPath: req.generalizedPath
    });
    return res.render("pages/homePage", {
        auth: { user: req.user }, // Assign auth.user to the user if there is one
        generalizedPath: req.generalizedPath
    });
});

// Profile Page
// /shersocial/profile
pageRouter.get("/profile",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    async (req, res) => {
        try {
            con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) AS fullName, image,
            (SELECT COUNT(*) FROM user_followers WHERE user_followers.userId = users.userId) AS followers,
            (SELECT COUNT(*) FROM posts WHERE (posts.createdBy = users.userId AND posts.posted = 1)) AS posts,
            (SELECT COUNT(*) FROM post_likes WHERE postId IN (SELECT postId from posts where posts.createdBy = users.userId)) AS likes
            FROM users
            WHERE (userId = '${req.user.userId}')`, (err, rows) => {
                if (err) throw err;
                if (rows.length === 0) throw new Error("Unable to get user data.");
                return res.render("pages/profile/profilePage", {
                    auth: { user: req.user }, // Assign auth.user to the user if there is one
                    generalizedPath: req.generalizedPath,
                    user: rows[0]
                });
            });
        }
        catch (e) {
            return res.render("pages/errorPage", {
                auth: { user: req.user }, // Assign auth.user to the user if there is one
                generalizedPath: req.generalizedPath
            });
        }
    }
);
// Edit Profile Page
// /shersocial/profile/edit
pageRouter.get("/profile/edit",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    (req, res) => {
        return res.render("pages/profile/editProfilePage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);

// Sign Up Page
// /shersocial/login
pageRouter.get(
    "/signup",
    disallowAuth(), // Use disallowAuth to prevent logged-in users from using signup
    (req, res) => {
        return res.render("pages/signupPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);
// Login Page
// /shersocial/login
pageRouter.get(
    "/login",
    disallowAuth(), // Use disallowAuth to prevent logged-in users from using login
    (req, res) => {
        return res.render("pages/loginPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);

// Other Profile Page
// /shersocial/@username
pageRouter.get(
    "/@:username",
    requireAuth(),
    async (req, res) => {
        const username = req.params.username;
        if (!username || !(await getUserByUsername(username))) {
            return res.render("pages/errorPage", {
                title: "User Not Found",
                message: "The user you are looking for does not exist. Please check the username and try again.",
                auth: { user: req.user },
                generalizedPath: req.generalizedPath
            });
        }
        else {
            try {
                // User is requested user - all posts
                if (req.user && req.user.username === username) {
                    con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) AS fullName, image,
                        (SELECT COUNT(*) FROM user_followers WHERE user_followers.userId = users.userId) AS followers,
                        (SELECT COUNT(*) FROM posts WHERE (posts.createdBy = users.userId AND posts.posted = 1)) AS posts,
                        (SELECT COUNT(*) FROM post_likes WHERE postId IN (SELECT postId from posts where posts.createdBy = users.userId)) AS likes
                        FROM users
                        WHERE (username = '${username}')`, (err, rows) => {
                        if (err) throw err;
                        if (rows.length === 0) throw new Error("Unable to get user data.");
                        return res.render("pages/profile/profilePage", {
                            auth: { user: req.user }, // Assign auth.user to the user if there is one
                            generalizedPath: req.generalizedPath,
                            user: rows[0]
                        });
                    });
                }
                // User is logged in - members and public privacy and check if following
                else if (req.user) {
                    con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) AS fullName, image,
                    (SELECT COUNT(*) FROM user_followers WHERE user_followers.userId = users.userId) AS followers,
                    (SELECT COUNT(*) FROM posts WHERE (posts.createdBy = users.userId AND (posts.privacy = 'public' OR posts.privacy = 'members') AND posts.posted = 1)) AS posts,
                    (SELECT COUNT(*) FROM post_likes WHERE postId IN (SELECT postId from posts where posts.createdBy = users.userId)) AS likes
                    FROM users
                    WHERE (username = '${username}')`, (err, rows) => {
                        if (err) throw err;
                        if (rows.length === 0) throw new Error("Unable to get user data.");
                        con.query(`SELECT * FROM user_followers
                        WHERE (userId = '${rows[0].userId}' AND followerId = '${req.user.userId}')`, (err, rows2) => {
                            if (err) throw err;
                            return res.render("pages/profile/profilePage", {
                                auth: { user: req.user }, // Assign auth.user to the user if there is one
                                generalizedPath: req.generalizedPath,
                                user: rows[0],
                                isFollowing: (rows2.length > 0)
                            });
                        });
                    });
                }
                // User is not logged in - public privacy only
                else {
                    con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) AS fullName, image,
                        (SELECT COUNT(*) FROM user_followers WHERE user_followers.userId = users.userId) AS followers,
                        (SELECT COUNT(*) FROM posts WHERE (posts.createdBy = users.userId AND posts.privacy = 'public' AND posts.posted = 1)) AS posts,
                        (SELECT COUNT(*) FROM post_likes WHERE postId IN (SELECT postId from posts where posts.createdBy = users.userId)) AS likes
                        FROM users
                        WHERE (username = '${username}')`, (err, rows) => {
                        if (err) throw err;
                        if (rows.length === 0) throw new Error("Unable to get user data.");
                        return res.render("pages/profile/profilePage", {
                            auth: { user: req.user }, // Assign auth.user to the user if there is one
                            generalizedPath: req.generalizedPath,
                            user: rows[0]
                        });
                    });
                }
            }
            catch (e) {
                return res.render("pages/errorPage", {
                    auth: { user: req.user }, // Assign auth.user to the user if there is one
                    generalizedPath: req.generalizedPath
                });
            }
        }
    }
);
// Add Post page
// /shersocial/post
pageRouter.get(
    "/post",
    requireAuth(),
    async (req, res) => {
        try {
            const imagePage = req.query.images && req.query.images === "1" ? true : false;
            con.query(`SELECT * FROM posts
            WHERE (createdBy = '${req.user.userId}'
            AND posted = 0)`, (err, rows) => {
                if (err) throw err;
                if (rows.length === 0 && imagePage) {
                    return res.redirect("/post");
                }
                else if (rows.length === 0 || !imagePage) {
                    return res.render("pages/posts/postPage", {
                        auth: { user: req.user },
                        generalizedPath: getGeneralizedPath(req.path),
                        post: rows.length > 0 ? rows[0] : null
                    });
                }
                else {
                    con.query(`SELECT * FROM post_images
                    WHERE (postId = '${rows[0].postId}')`, (err, rows2) => {
                        if (err) throw err;
                        return res.render("pages/posts/postImagesPage", {
                            auth: { user: req.user },
                            generalizedPath: getGeneralizedPath(req.path),
                            post: { ...rows[0], images: rows2 }
                        });
                    });
                }
            });
        }
        catch (e) {
            return res.render("pages/errorPage", {
                title: "Error Adding Post",
                message: "There was an error while loading this page. Please try again later.",
                auth: { user: req.user },
                generalizedPath: getGeneralizedPath(req.path)
            })
        }
    }
);
// View Post Page
// /shersocial/posts/:postId
pageRouter.get(
    "/posts/:postId",
    async (req, res) => {
        const post = await getPostById(req.params.postId);
        if (!post || post.posted === 0) {
            return res.render("pages/errorPage", {
                title: "Post Not Found",
                message: "The post you are looking for does not exist. Please check the URL and try again.",
                auth: { user: req.user },
                generalizedPath: req.generalizedPath
            });
        }
        else if (post.privacy === "members" && !req.user) {
            return res.redirect(`/shersocial/login?redirect=${encodeURIComponent(req.generalizedPath.slice(1))}`);
        }
        else if (post.privacy === "private" && (!req.user || req.user.admin === 0 || req.user.userId !== post.createdBy)) {
            return res.render("pages/errorPage", {
                title: "Private Post",
                message: "This post is private.",
                auth: { user: req.user },
                generalizedPath: req.generalizedPath
            })
        }
        else {
            try {
                var formattedContent = post.content
                    .replace(/\*\*\*(\*{0,2}[^\*]*\*{0,2})\*\*\*/g, "<span style='font-size:1.5rem; font-weight:500;'>$1</span>")
                    .replace(/\*\*(\*?[^\*]*\*?)\*\*/g, "<span style='font-size:1.25rem;font-weight:500;'>$1</span>")
                    .replace(/-----/g, `<br><hr class="hr m-0">`)
                    .replace(/\*([^\*]*)\*/g, "<span style='font-weight:500;'>$1</span>")
                    .replace(/__(_?[^_]*_?)__/g, "<u>$1</u>")
                    .replace(/_([^_]*)_/g, "<i>$1</i>")
                    .replace(/\(([^\)]*)\)\[([^\]]*)\]/g, `<a href="$2" class="link" target="_blank">$1</a>`)
                    .replace(/\[([^\]]*)\]/g, `<a href="$1" class="link" target="_blank">$1</a>`)
                    .replace(/```(`{0,2}[^`]*`{0,2})```/g, "<p class='m-2' style='background-color:var(--bs-gray-300);font-family:monospace;padding: 0 4px;'>$1</p>")
                    .replace(/`([^`]*)`/g, "<span style='background-color:var(--bs-gray-300);font-family:monospace;padding: 0 4px;'>$1</span>");
                while ((match = formattedContent.match(/<img:(\d+)>/)) !== null) {
                    formattedContent = formattedContent.replace(match[0], post.images.length >= parseInt(match[1]) ? `<img class="my-1" src="${post.images[parseInt(match[1]) - 1].image}">` : "(Error loading image)");
                }
                con.query(`SELECT * FROM post_likes
                WHERE (postId = '${post.postId}' AND userId = '${req.user ? req.user.userId : ''}')`, (err, isLikedQ) => {
                    if (err) throw err;
                    return res.render("pages/posts/viewPostPage", {
                        auth: { user: req.user },
                        generalizedPath: req.generalizedPath,
                        post: {
                            ...post,
                            timeSince: getTimeSince(post.createdAt),
                            formattedContent
                        },
                        isLiked: isLikedQ.length > 0
                    });
                });
            }
            catch (e) {
                return res.render("pages/errorPage", {
                    title: "Error Getting Post",
                    message: "There was an error while loading this page. Please try again later.",
                    auth: { user: req.user },
                    generalizedPath: getGeneralizedPath(req.path)
                });
            }
        }
    }
);
// Edit Post Page
// /shersocial/posts/:postId/edit
pageRouter.get(
    "/posts/:postId/edit",
    requireAuth(),
    async (req, res) => {
        const post = await getPostById(req.params.postId);
        if (!post || post.posted === 0) {
            return res.render("pages/errorPage", {
                title: "Post Not Found",
                message: "The post you are looking for does not exist. Please check the URL and try again.",
                auth: { user: req.user },
                generalizedPath: req.generalizedPath
            });
        }
        else if (post.createdBy !== req.user.userId) {
            return res.render("pages/errorPage", {
                title: "Access Denied",
                message: "You do not have access to edit this post.",
                auth: { user: req.user },
                generalizedPath: req.generalizedPath
            });
        }
        else {
            try {
                return res.render("pages/posts/editPostPage", {
                    auth: { user: req.user },
                    generalizedPath: req.generalizedPath,
                    post
                });
            }
            catch (e) {
                return res.render("pages/errorPage", {
                    title: "Error Editing Post",
                    message: "There was an error while loading this page. Please try again later.",
                    auth: { user: req.user },
                    generalizedPath: getGeneralizedPath(req.path)
                });
            }
        }
    }
);

// Admin Dashboard
// /shersocial/admin/add-user
pageRouter.get(
    "/admin",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    requireAdmin({ type: "page", title: "Access Denied", message: "You do not have access to this page." }), // Use requireAdmin to prevent non-admin users
    (req, res) => {
        return res.render("pages/admin/adminPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);
// Amin Users Page
// /shersocial/admin/users
pageRouter.get(
    "/admin/users",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    requireAdmin({ type: "page", title: "Access Denied", message: "You do not have access to this page." }), // Use requireAdmin to prevent non-admin users
    (req, res) => {
        return res.render("pages/admin/adminUsersPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);
// Add User Page
// /shersocial/admin/users/add
pageRouter.get(
    "/admin/users/add",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    requireAdmin({ type: "page", title: "Access Denied", message: "You do not have access to this page." }), // Use requireAdmin to prevent non-admin users
    (req, res) => {
        return res.render("pages/admin/addUserPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);
// Amin Sign Up Codes Page
// /shersocial/admin/signup-codes
pageRouter.get(
    "/admin/signup-codes",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    requireAdmin({ type: "page", title: "Access Denied", message: "You do not have access to this page." }), // Use requireAdmin to prevent non-admin users
    (req, res) => {
        return res.render("pages/admin/adminSignupCodesPage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);
// Add Sign Up Code Page
// /shersocial/admin/signup-codes/add
pageRouter.get(
    "/admin/signup-codes/add",
    requireAuth(), // Use requireAuth to prevent non-logged-in users
    requireAdmin({ type: "page", title: "Access Denied", message: "You do not have access to this page." }), // Use requireAdmin to prevent non-admin users
    (req, res) => {
        return res.render("pages/admin/addSignupCodePage", {
            auth: { user: req.user }, // Assign auth.user to the user if there is one
            generalizedPath: req.generalizedPath
        });
    }
);

// 404 Page
// /shersocial/*
pageRouter.get("/shersocial/*", (req, res) => {
    return res.render("pages/errorPage", {
        title: "Page Not Found",
        message: "The page you are looking for does not exist. Please check the URL and try again.",
        auth: { user: req.user },
        generalizedPath: req.generalizedPath
    });
});



// Export Router
module.exports = pageRouter;