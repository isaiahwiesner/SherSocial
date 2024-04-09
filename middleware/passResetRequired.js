const { getGeneralizedPath } = require("../utils/misc");

const passResetRequired = (options = {
    disabledRoutes: ["/api/update-password", "/api/logout", "/"]
}) => {
    return (req, res, next) => {
        const curPath = getGeneralizedPath(req.path);
        if (!req.user || options.disabledRoutes.includes(curPath) || req.user.passResetRequired === 0) return next();
        return res.redirect("/");
    }
};

module.exports = passResetRequired;