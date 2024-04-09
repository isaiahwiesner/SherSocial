// Require authentication for a route
const disallowAuth = (options = {
    type: "page",
    message: "This route requires you to be logged out."
}) => {
    return (req, res, next) => {
        if (req.user) { // User is logged in (req.user assigned in ./authenticate.js)
            if (options.type === "json") { // JSON route, return JSON
                return res.json(403).json({ status: 403, ok: false, detail: options.message });
            }
            else { // Page route, return redirect to login page with
                if (req.query.redirect) { // Has a redirect query param
                    return res.redirect("/" // Start with "/"
                        + decodeURIComponent(req.query.redirect)); // Get decoded query param 
                }
                else { // No redirect query param
                    return res.redirect("/shersocial"); // Redirect to "/shersocial"
                }
            }
        }
        else { // No user, go to next
            return next();
        }
    };
};

module.exports = disallowAuth;