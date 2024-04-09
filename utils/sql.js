const { createConnection } = require("mysql");
const env = require("./env");
const con = createConnection({
    host: env.mysql.HOST,
    port: env.mysql.PORT,
    user: env.mysql.USER,
    password: env.mysql.PASS,
    database: env.mysql.DBAS
});

module.exports = {
    con
};