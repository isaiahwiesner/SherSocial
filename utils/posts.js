// Imports
const { v4: uuid } = require("uuid");
const { con } = require("./sql");
const fs = require("fs");

// Get a post by ID
const getPostById = (postId) => {
    return new Promise((resolve) => { // Return a new promise
        con.query(`SELECT postId, title, content, privacy, posted,
        createdBy, createdAt, updatedAt, (SELECT COUNT(*) FROM post_likes WHERE (post_likes.postId = posts.postId)) as likes
        FROM posts
        WHERE (postId = '${postId}')`, (err, rows) => { // Execute SQL query
            if (err || rows.length === 0) resolve(null); // Error or no rows, resolve null
            con.query(`SELECT * FROM post_images
            WHERE (postId = '${postId}')`, (err, rows2) => {
                if (err) resolve(null); // Error, resolve null
                con.query(`SELECT userId, username, firstName, lastName, CONCAT(firstName, ' ', lastName) as fullName
                FROM users
                WHERE (userId = '${rows[0].createdBy}')`, (err, rows3) => {
                    if (err) resolve(null); // Error, resolve null
                    resolve({ ...rows[0], images: rows2, user: rows3[0] }); // Resolve the first row with images
                })
            })
        })
    });
};


// Creata a post
const createPost = (postData = { title: null, content: null, privacy: null }, userId) => {
    return new Promise(async (resolve, reject) => { // Return a new promise
        postData = { title: null, content: null, privacy: null, ...postData }; // Set default values for postData if not defined in function call
        if (!postData.title || !postData.content || !postData.privacy) reject("Missing title, content, or privacy.") // Reject if anything is undefined
        const postId = uuid(); // Generate a unique UUID
        con.query(`INSERT INTO posts VALUES (
            '${postId}',
            '${postData.title}',
            '${postData.content}',
            '${postData.privacy}',
            0,
            '${userId}',
            ${Date.now()},
            ${Date.now()}
        )`, (err) => { // SQL insert statement
            if (err) return reject(err);
            con.commit();
            return resolve({ ...postData, posted: 0, createdBy: userId, createdAt: Date.now(), updatedAt: Date.now() }); // Return the added data
        });
    });
};

// Delete a post
const deletePost = (postId) => {
    return new Promise(async (resolve, reject) => {
        const post = await getPostById(postId);
        if (!post) return reject("Post not found.");
        // Delete images associated with post
        con.query(`DELETE FROM post_images
        WHERE (postId = '${postId}')`, async (err) => {
            if (err) return reject(err);
            await deleteAllPostImages(postId);
            // Delete likes associated with post
            con.query(`DELETE FROM post_likes
            WHERE (postId = '${postId}')`, (err) => {
                if (err) return reject(err);
                // Delete post
                con.query(`DELETE FROM posts
                WHERE (postId = '${postId}')`, (err) => {
                    if (err) return reject(err);
                    con.commit();
                    resolve(post);
                });
            });
        });
    });
};

// Delete Post Image
const deletePostImage = (postId, imagePath) => {
    imagePath = imagePath.split("/").slice(-1);
    return new Promise(async (resolve, reject) => {
        try {
            const post = await getPostById(postId);
            if (!post) reject("Post not found.");
            if (!fs.existsSync("usercontent/post-images")) {
                fs.mkdirSync("usercontent/post-images");
            }
            if (!fs.existsSync(`usercontent/post-images/${postId}`)) {
                fs.mkdirSync(`usercontent/post-images/${postId}`);
            }
            fs.rmSync(`usercontent/post-images/${postId}/${f}`);
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
};
// Delete all post images
const deleteAllPostImages = (postId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const post = await getPostById(postId);
            if (!post) reject("Post not found.");
            if (!fs.existsSync("usercontent/post-images")) {
                fs.mkdirSync("usercontent/post-images");
            }
            if (!fs.existsSync(`usercontent/post-images/${postId}`)) {
                return resolve()
            }
            fs.readdirSync(`usercontent/post-images/${postId}`).filter(f => f.startsWith(postId)).forEach(f => {
                fs.rmSync(`usercontent/post-images/${postId}/${f}`);
            });
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
};

// Upload Post Image
const uploadPostImage = (postId, dataUri, fileType) => {
    return new Promise(async (resolve, reject) => {
        const post = await getPostById(postId);
        if (!post) reject("Post not found.");
        if (!fs.existsSync("usercontent/post-images")) {
            fs.mkdirSync("usercontent/post-images");
        }
        if (!fs.existsSync(`usercontent/post-images/${postId}`)) {
            fs.mkdirSync(`usercontent/post-images/${postId}`);
        }
        const dataUriParts = dataUri.match(/^data:(.+);base64,(.*)$/);
        const base64Data = dataUriParts[2];
        const buffer = Buffer.from(base64Data, "base64");
        const newFilePath = `usercontent/post-images/${postId}/${Date.now()}.${fileType}`;
        fs.writeFileSync(newFilePath, buffer);
        resolve(`/${newFilePath}`);
    });
};

module.exports = {
    getPostById,
    createPost,
    deletePost,
    deletePostImage,
    deleteAllPostImages,
    uploadPostImage
}