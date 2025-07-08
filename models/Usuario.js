const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  Nombre: String,
  Contraseña: String,
  "Pregunta de Recuperacion": String
}, { collection: 'Usuarios' });

module.exports = mongoose.model('Usuario', UsuarioSchema);
