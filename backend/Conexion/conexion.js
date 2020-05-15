//creamos las Clase de  conexion sql
const debug = require('debug')('app:dbConn');
const mssql = require('mssql'); //conexion a la db de  sql

var conexionSQL = '';

var cIP = process.env.IP
var cPWD = process.env.PWD
var cPORTSQL = parseInt(process.env.PORTSQL, 10);
var cUser = process.env.USER
var cDB = process.env.DB

///////configuracion para conexion al server sql
var Config = {
    user: cUser,
    password: cPWD,
    server: cIP,
    port: cPORTSQL,
    database: cDB,
    connectionTimeout: 999999999,
    requestTimeout: 999999999,
};


////funcion que establece la conexion
const pool = new mssql.ConnectionPool(Config);
pool.connect().then(function() {
    debug('Conexion Exitosamente a SQL Server');
}).catch(function(err) {
    debug('Error Con la Conexion a SQL');
    console.log(err);
})


conexionSQL = pool;
module.exports = conexionSQL