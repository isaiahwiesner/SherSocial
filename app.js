// Isaiah Wiesner
// Date: 4/3/2024
// Updated: 4/3/2024
// Purpose: Web Programming Assignment 8



// Imports
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const apiRouter = require("./routers/apiRouter"); // Custom module
const pageRouter = require("./routers/pageRouter"); // Custom module
const env = require("./utils/env"); // Custom module
const { con } = require("./utils/sql"); // Custom module
const authenticate = require("./middleware/authenticate"); // Custom module
const passResetRequired = require("./middleware/passResetRequired"); // Custom module
const { getGeneralizedPath } = require("./utils/misc");


// Initialize App
const app = express();
app.use((req, res, next) => {
    bodyParser.json({ limit: "5mb" })(req, res, (err) => {
        if (err) {
            if (err.type === "entity.too.large") {
                return res.status(413).json({ status: 413, ok: false, detail: "File too large.", ...err });
            }
            return res.status(400).json({ status: 400, ok: false, detail: err.message, ...err });
        }
        next();
    });
}); // Use JSON body parser with custom error handler
app.use(cookieParser()); // Use cookie parser
app.set("view engine", "ejs"); // Set view engine to ejs
app.use("/shersocial/static", express.static("static")); // Use static file from directory "static" with "/static" as path root
app.use("/shersocial/usercontent", express.static("usercontent")); // Use static file from directory "usercontent" with "/usercontent" as path root - for storing user files
app.use((req, res, next) => { // Assigns generalized path to request for use in ejs 
    req.generalizedPath = getGeneralizedPath(req.path);
    return next();
});
app.use(authenticate); // Authenticate requests (refresh if needed, attach user to request)
app.use(passResetRequired()); // Authenticate requests (refresh if needed, attach user to request)
app.use("/shersocial/api", apiRouter); // Use page router for all requests with "/api" as path root
app.use("/shersocial", pageRouter); // Use page router for all requests with "/" as path root (all)


// Start App
app.listen(env.express.PORT, () => {
    console.log(`App started on ${env.express.FULL_URL}`);
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            const familyV4Value = typeof net.family === "string" ? "IPv4" : 4
            if (net.family === familyV4Value && !net.internal) {
                results.push(net.address);
            }
        }
    }
    if (results.length > 0) {
        console.log(`On your local network: http://${results[0]}:${env.express.PORT}/shersocial`);
    }
});

// Connect to SQL
con.connect(async (err) => {
    if (err) {
        console.log(err);
        console.log("Unable to connect to SQL database.");
    }
    else {
        console.log("Connected to MySQL!");
    }
});