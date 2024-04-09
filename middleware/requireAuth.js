const { getGeneralizedPath } = require("../utils/misc");

// Require authentication for a route
const requireAuth = (options = {
    type: "page",
    message: "This route requires authentication.",
    redirectPath: null
}) => {
    return (req, res, next) => {
        if (!req.user) { // No user (req.user assigned in ./authenticate.js)
            if (options.type === "json") { // JSON route, return JSON
                return res.json(401).json({ status: 401, ok: false, detail: options.message });
            }
            else { // Page route, return redirect to login page with
                const curPath = getGeneralizedPath(req.path); // Get generalized path (always starts with "/" and never ends with "/")
                return res.redirect("/login" // Always start with /login
                    + (options.redirectPath ? `?redirect=${encodeURIComponent(options.redirectPath)}` // Redirect path provided 
                        : curPath === "/" ? "" // Current path is "/", doesn't need a redirect query param since it is defaulted to "/"
                        : `?redirect=${encodeURIComponent(curPath.slice(1))}`) // Any other path gets a "redirect" query param with encoded path without starting "/"
                )
            }
        }
        else { // User is logged in, go to next
            return next();
        }
    };
};

module.exports = requireAuth;