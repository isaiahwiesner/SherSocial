
# SherSocial
SherSocial is a website intended for students to share thoughts and ideas as well as ask for opinions and more. It is made with Express.js along with other NPM packages. This read-me goes over the main concepts used to create it.

# Basic Concepts
This section will cover basic concepts from the application.
## Initialization
The first step in making the express app is to add the import of Express and initialize an app variable.
```js
// Import Express
const express = require("express");
// Create Express app
const app = express();
// Start the app
//  app.listen(port, callback)
app.listen(3000, () => {
    console.log("App started on port 3000!");
});
```
## Middleware
The next step is to add any middleware to the base of the application. This can include routers, middleware functions, body parsers, and more. The first parameter of a middleware function is the base path. If this parameter is not provided, it is assumed that the entire app (or router) will use it.
```js
// External library import
const bodyParser = require("body-parser");
// Custom module import
const apiRouter = require("./routers/apiRouter");

// Use JSON body parser for all incoming requests
app.use(bodyParser.json());
// Use the API router with routes starting with "/api"
app.use("/api", apiRouter);
// Serve the "static" folder in the project directory
//  using the base path "/static"
app.use("/static", express.static("static"));
```

# Databases
This section covers how the database portion of the app works.
## Initialization
For the database, I chose to use a MySQL database as Sheridan provides MySQL databases on cPanel. Using the correct parameters, we can use the NPM MySQL library to manipulate data in the database.
```bash
npm install mysql
```
```js
const mysql = require("mysql");
const connection = mysql.createConnection({
    host: "127.0.0.1", // if this is running on the same server as the SQL (which it is)
    port: 3306, // The SQL port for most providers
    user: "username", // Your cPanel SQL username
    password: "Password123", // Your cPanel SQL password
    database: "test_db" // The database being used
});
```
Please note that this configuration is best stored in a `.env` file in the root application folder.
```env
MYSQL_HOST="127.0.0.1"
MYSQL_PORT=3306
MYSQL_USER="username"
MYSQL_PASS="Password123"
MYSQL_DATABASE="test_db"
```
```js
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
});
```
## Queries
Querying is as simple as it is in a DML software. All you need to do is use the function `connection.query()` and provide a valid SQL query string as the first argument along with a callback function as the second argument.
```js
// Import connection from custom module
const { connection } = require("./utils/sql.js");
con.query(`SELECT * FROM users`, (err, rows) => {
    if (err) {
        // Handle error
    }
    else {
        console.log(rows);
        // Expected output:
        //  [{username: "username", ...}, ...]
    }
});
```
These queries can be nested if needed as long as errors do not go unchecked.

# EJS (Embedded JavaScript)
EJS is a NPM library that allows you to embed variables in HTML code. There are a few steps to implementing EJS.
## Step 1 - Install EJS
```bash
npm install ejs
```
## Step 2 - app.js
```js
app.set("view engine", "ejs");
```
## Step 3 - Create Folders
You are going to need to store your EJS files in a folder called "views". A common file structure is to have embedded folders for pages and "partials" (data that is only partially part of a page and can be reused).
```
├── appfolder
│   ├── app.js
│   ├── views
│   │   ├── pages
│   │   ├── partials
```
## Step 4 - Render Responses
In either your mail app file or a file containing a router, you will use this code in to render.
```js
app.get(
    "/", // Index path
    (req, res) => {
        // Render the page
        res.render("pages/homepage", {
            // Variables inside object are accessable within the EJS file
            foo: 1,
            bar: 2
        });
    }
);
```
Note that you do not have to provide the views folder in the path or the file extension. Anything inside this string will be defaulted to inside the views folder.