const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    correo: { type: String, required: true, unique: true },
    password: { type: String, required: true } // Aquí guardaremos la contraseña encriptada
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);