const jwt = require("jsonwebtoken");
const env = require("../utils/env");
const { generateJWTAccess } = require("../utils/users");

const authenticate = async (req, res, next) => {
    const accessToken = req.cookies.accessToken; // Get access token from cookies
    const refreshToken = req.cookies.refreshToken; // Get refresh token from cookies

    if (!accessToken && !refreshToken) {
        return next(); // Go to next if neither exist
    }

    try {
        if (!accessToken) throw new Error("No access token."); // Throw error if no access token
        const decoded = jwt.verify(accessToken, env.jwt.ACCESS); // Decode - will throw error if invalid
        const decodedRefresh = jwt.verify(refreshToken, env.jwt.REFRESH); // Decode - will throw error if invalid
        req.user = { // Assign user info to request
            ...decoded.user,
            fullName: `${decoded.user.firstName} ${decoded.user.lastName}`,
            lastLogin: decodedRefresh.iat * 1000, lastRefresh: decoded.iat * 1000, sessionExpires: decodedRefresh.exp * 1000
        };
        return next(); // Go to next
    }
    catch (e) { // Catch errors
        if (!refreshToken) { // No refresh token
            // Clear cookies
            res.clearCookie("refreshToken");
            res.clearCookie("accessToken");
            return next(); // Go to next
        }
        else { // Refresh token
            try {
                const decoded = jwt.verify(refreshToken, env.jwt.REFRESH); // Decode - will throw error if invalid
                const accessToken = await generateJWTAccess(refreshToken); // Generate new access
                const decodedAccess = jwt.verify(accessToken, env.jwt.ACCESS); // Decode - will throw error if invalid (should never be)
                req.user = { // Assign user info to request
                    ...decodedAccess.user,
                    fullName: `${decodedAccess.user.firstName} ${decodedAccess.user.lastName}`,
                    lastLogin: decoded.iat * 1000,
                    lastRefresh: decodedAccess.iat * 1000,
                    sessionExpires: decoded.exp * 1000
                };
                res.cookie("accessToken", accessToken); // Set access token cookie
                return next(); // Go to next
            }
            catch (e) {
                // Clear cookies
                res.clearCookie("accessToken");
                res.clearCookie("refreshToken");
                return next(); // Go to next
            }
        }
    }
};

module.exports = authenticate;