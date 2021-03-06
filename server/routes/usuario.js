const express = require('express');
const bcrypt = require('bcrypt');

// Se utiliza para devolver un objeto solo con los campos que se quieren actualizar
const _ = require('underscore');

const Usuario = require('../models/usuario');

const app = express();

app.get('/usuario', function(req, res) {

    // {estado: true}

    // Guardamos en una variable el parametro opcional desde, si no viene será 0
    // Esto nos sirve para paginar el resultado de los usuarios, ya que por defecto solo mostrará los 5 primeros
    let desde = req.query.desde || 0;
    desde = Number(desde)

    let limite = req.query.limite || 5;
    limite = Number(limite)

    Usuario.find({estado:true}, 'nombre email role estado google img').skip(desde).limit(limite).exec( (err, usuarios) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        Usuario.count({estado:true}, (err, total) => {
            res.json({
                ok: true,
                usuarios,
                numUsuarios: total
            })
        })
        
    })

})

app.post('/usuario', function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password,10),
        role: body.role
    });

    usuario.save((err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // Ponemos la contraseña a null para no mostrarla al hacer la respuesta
        // userDB.password = null;

        res.json({
            ok: true,
            usuario: userDB
        })
    } )
    
})

app.put('/usuario/:id', function(req, res) {

    let id = req.params.id;
    // Indicamos que queremos uar underscore y pasamos un array con los campos que son actualizables
    let body = _.pick(req.body, ['nombre','email','img','role','estado']);
    

    Usuario.findByIdAndUpdate(id, body, {new: true, runValidators: true}, (err, userDB) => {
    // Con el tercer parámetro, decimos que encuentre el objeto en BBDD y lo cambie por el cuerpo de la peticioon
    // Además con runValidators: true, estamos haciendo que ejecute las validaciones que tenemos en el model del usuario
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            usuario : userDB
        });
    })

    
})

app.delete('/usuario/:id', function(req, res) {

    let id = req.params.id;
    //Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
    
    let cambiaEstado = {
        estado:false
    }

    Usuario.findByIdAndUpdate(id, cambiaEstado, {new: true}, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if(!usuarioBorrado){
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        })
    })

})

module.exports = app;