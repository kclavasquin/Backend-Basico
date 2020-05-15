'use strict'

const router = require('express').Router();
const mongojs = require('mongojs');
const db = mongojs('RosyMovil', ['user']);
const mssql = require('mssql');
const sqlConn = require('../Conexion/conexion')
const token = require('../ServicesAPI/jwt');
const Authen = require('../Middleware/Authenticated');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const multer = require('multer');
const upload = multer({ dest: 'uploads/' })


//////*******************************TOKEN  y  Usuarios ********************************** */
///creamos un usuario de ejemplo
router.post('/AddUser', upload.fields([]), (req, res) => {
    res.json({ success: true });
    const { username, password, fullname, email, status, role, comment } = req.body;
    //Modelo de user
    var cUsername = username; // 'Cristhian';
    var cName = fullname; //'Cristhian Adalid Aguilar Vargas';
    var cPass = password; //'Cristhian.*.';
    var cEmail = email; //'gerentedeproducto@tiendasrosy.com';
    var cAdmin = status; // true;
    var cRole = role; //'2';
    var cComent = comment;
    var hash = bcrypt.hashSync(cPass, salt)

    const nick = ({
        username: cUsername,
        password: hash,
        name: cName,
        email: cEmail,
        admin: cAdmin,
        role: cRole,
        comment: cComent
    });

    // save the  user
    db.user.save(nick, function(err) {
        if (err) throw err;
        //console.log('User saved successfully');
        res.json({ success: true });
    });
});

router.get('/viewUsers', (req, res) => {
    db.user.find({}, (err, users) => {
        res.json(users);
    });
});

////******Funcion que autentifica el usuario y genera el token 
router.post('/autentificacion', function(req, res) {
    const Datos = req.body
    db.user.findOne({ username: Datos[0].username }, function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Autentificacion Fallida. Usuario no encontrado.' });
        } else if (user) {

            if (bcrypt.compareSync(Datos[0].password, user.password)) { //if (user.password != Datos[0].password) {
                res.json({
                    token: token.createToken(user),
                    _id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    success: true,
                    role: user.role,
                    userrosy: user.userrosy
                });
            } else {
                res.json({ success: false, message: 'Autentificacion Fallida. Password Incorrecto.' });
            }
        }
    });
});

//Informacion de los Usuarios Rosy
router.post('/InfoUsuariosRosy', async(req, res, next) => {
    const filtro = req.body
    var sqlString = String("SELECT A.Usuario,A.Nombre,A.Descripcion,B.Sucursal,C.Nombre AS NombreSucursal,C.Empresa, D.Nombre AS NombreEmpresa FROM TBLUsuarios A ");
    sqlString = sqlString + "INNER JOIN TBLUsuarioSucursales B ON B.Usuario=A.Usuario ";
    sqlString = sqlString + "INNER JOIN TBLSucursales C ON  C.Sucursal=B.Sucursal ";
    sqlString = sqlString + "INNER JOIN TBLEmpresas D ON D.Empresa=C.Empresa ";
    sqlString = sqlString + "WHERE A.Usuario='" + filtro.userrosy + "' ";
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})

///////////**********autentifica las rutas privadas 
router.get('/private', Authen.ensureAuthenticated, (req, res) => {
    var token = req.headers.authorization.split(' ')[1];
    res.json({ message: 'Autenticado correctamente y tu _id es:' + req.user });
});

//Accesos a Opciones Menu
router.post('/AccesoOpcionMenu', (req, res, next) => {
    db.OpcionMenu.findOne({ username: req.body.Username, opcion: req.body.OpcionMenu }, (err, Datos) => {
        if (err) return next(err);
        res.json(Datos);
    });
})

///*******************************Fin de ejemplos uso de TOKEN***************************


///
//Buscar Cliente
router.post('/buscarCliente', async(req, res, next) => {
    const filtro = req.body
    var sqlString = String("Select Cliente,NombreCompleto,RTN,Identidad,Telefono,Celular,NombreNegocio,Direccion From TBLClientes ");
    sqlString = sqlString + "WHERE NombreCompleto like '%" + filtro.buscar + "%' Order by Cliente";
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})

//Buscar Cliente
router.post('/buscarClienteCatalago', async(req, res, next) => {
    const filtro = req.body
    var sqlString = String("SELECT * FROM FNTClientes('%" + filtro.buscar + "%')");
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})

//Buscar Ciudades 
router.post('/buscarCiudadesCatalago', async(req, res, next) => {
    const filtro = req.body
    var sqlString = String("SELECT A.Ciudad AS CodCiudad,A.Nombre AS Ciudad,B.Nombre AS Municipio,C.Nombre AS Departamento ");
    sqlString = sqlString + " From TBLCiudades A  ";
    sqlString = sqlString + " INNER JOIN dbo.TBLMunicipios B ON B.Municipio = A.Municipio ";
    sqlString = sqlString + " INNER JOIN dbo.TBLDepartamentos C ON C.Departamento = B.Departamento ";
    sqlString = sqlString + " WHERE A.Nombre LIKE '%" + filtro.buscar + "%' ";
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})

//Add Clientes Nuevos 
router.post('/addClientes', async(req, res, next) => {
    const filtro = req.body
    var sqlString = String("EXEC PRDAddClientesNuevos '" + filtro.primerNombre + "','" + filtro.segundoNombre + "','" + filtro.primerApellido + "','" + filtro.segundoApellido + "','" + filtro.nombreCompleto + "','" + filtro.RTN + "','" + filtro.identidad + "','" + filtro.telefono + "','" + filtro.celular + "','" + filtro.correo + "','" + filtro.nombreNegocio + "','" + filtro.direccion + "','" + filtro.ciudad + "','" + filtro.empresa + "','" + filtro.usuario + "'");
    //
    console.log(filtro);
    console.log(sqlString);
    res.json({ "Resultado": true });
    return
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})



//buscamos etiqueta
router.post('/buscarEtiqueta', async(req, res, next) => {
    const filtro = req.body
        //console.log(filtro);
    var sqlString = String("EXEC EtiquetaMayoreo '" + filtro.etiqueta + "'");
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})

//buscamos etiqueta
router.post('/buscarProducto', async(req, res, next) => {
    const filtro = req.body
        //console.log(filtro);
    var sqlString = String("EXEC PRDProductoMayoreo '" + filtro.buscar + "'");
    //
    var request = new mssql.Request(sqlConn);
    request.query(sqlString, (err, result, recordset) => {
        if (err) return next(err);
        var datos = {};
        datos = result.recordset;
        res.json(datos);
    })
})



module.exports = router;