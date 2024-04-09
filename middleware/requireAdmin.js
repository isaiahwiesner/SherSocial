// Require authentication for a route
const requireAuth = (options = {
    type: "page",
    title: "Access Denied",
    message: "You do not have access to this route."
}) => {
    return (req, res, next) => {
        if (!req.user.admin) { // User is not admin (req.user assigned in ./authenticate.js)
            if (options.type === "json") { // JSON route, return JSON
                return res.json(403).json({ status: 403, ok: false, detail: options.message });
            }
            else { // Page route, render the error page
                return res.render("pages/errorPage", { auth: { user: req.user }, title: options.title, message: options.message });
            }
        }
        else { // User is admin, go to next
            return next();
        }
    };
};

module.exports = requireAuth;