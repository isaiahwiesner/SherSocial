// Load ENV variables
require("dotenv").config();

const env = {
    encryption: {
        SECRET: process.env.CRYPTO_SECRET,
        IV_SECRET: process.env.CRYPTO_IV_SECRET
    },
    express: {
        HOST: process.env.EXPRESS_HOST,
        PORT: process.env.EXPRESS_PORT,
        FULL_URL: process.env.EXPRESS_FULL_URL
    },
    jwt: {
        ACCESS: process.env.JWT_ACCESS_SECRET,
        ACCESS_EXP: process.env.JWT_ACCESS_EXP,
        REFRESH: process.env.JWT_REFRESH_SECRET,
        REFRESH_EXP: process.env.JWT_REFRESH_EXP
    },
    mysql: {
        HOST: process.env.MYSQL_HOST,
        PORT: process.env.MYSQL_PORT,
        USER: process.env.MYSQL_USER,
        PASS: process.env.MYSQL_PASS,
        DBAS: process.env.MYSQL_DBAS
    }
};

module.exports = env;