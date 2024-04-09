const { getGeneralizedPath } = require("../utils/misc");

const passResetRequired = (options = {
    disabledRoutes: ["/shersocial/api/update-password", "/shersocial/api/logout", "/shersocial"]
}) => {
    return (req, res, next) => {
        const curPath = getGeneralizedPath(req.path);
        if (!req.user || options.disabledRoutes.includes(curPath) || req.user.passResetRequired === 0) return next();
        return res.redirect("/shersocial");
    }
};

module.exports = passResetRequired;