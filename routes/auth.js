const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../services/tokenService');

const tokensInvalidos = new Set();
const SECRET_KEY = process.env.JWT_SECRET || 'xR4pZ+YJvLvk0b2Pn8qTLr5E3W1KyX4VJ8t7yA0ZuB0=';

// Middleware para verificar el token de acceso
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  if (tokensInvalidos.has(token)) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token inválido' });
    req.usuario = decoded;
    next();
  });
};

// LOGIN (sin encriptación)
router.post('/login', async (req, res) => {
  const { Nombre, Contraseña } = req.body;

  try {
    const usuario = await Usuario.findOne({ Nombre, Contraseña });

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken();

    usuario.refreshToken = refreshToken;
    usuario.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await usuario.save();

    res.status(200).json({
      message: 'Login exitoso',
      token: accessToken,
      refreshToken,
      usuario: {
        id: usuario._id,
        nombre: usuario.Nombre
      }
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Registro sin encriptar
router.post('/registrar', async (req, res) => {
  const { Nombre, Contraseña, Pregunta, Respuesta } = req.body;

  try {
    const usuarioExistente = await Usuario.findOne({ Nombre });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const nuevoUsuario = new Usuario({
      Nombre,
      Contraseña,
      "Pregunta de Recuperacion": Pregunta,
      "Respuesta de Recuperacion": Respuesta
    });

    await nuevoUsuario.save();

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.Nombre
      }
    });
  } catch (error) {
    console.error('Error en /registrar:', error);
    return res.status(500).json({ message: 'Error del servidor al registrar' });
  }
});

// Refrescar token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token requerido' });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario || usuario.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Refresh token inválido o expirado' });
    }

    const newAccessToken = generateAccessToken(usuario);
    const newRefreshToken = generateRefreshToken(usuario);

    usuario.refreshToken = newRefreshToken;
    await usuario.save();

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Refresh token inválido o expirado' });
  }
});

// Obtener pregunta de recuperación
router.post('/recuperar-pregunta', async (req, res) => {
  const { Nombre } = req.body;

  try {
    const usuario = await Usuario.findOne({ Nombre });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ pregunta: usuario['Pregunta de Recuperacion'] });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Validar respuesta de recuperación
router.post('/recuperar-respuesta', async (req, res) => {
  const { Nombre, respuesta } = req.body;

  try {
    const usuario = await Usuario.findOne({ Nombre });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario['Respuesta de Recuperacion'] !== respuesta) {
      return res.status(401).json({ message: 'Respuesta incorrecta' });
    }

    res.status(200).json({
      message: 'Respuesta correcta. Acceso concedido.',
      usuario: {
        id: usuario._id,
        nombre: usuario.Nombre,
        contraseña: usuario.Contraseña
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Logout
router.post('/logout', verificarToken, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id);
  if (usuario) {
    usuario.refreshToken = null;
    await usuario.save();
  }
  return res.status(200).json({ message: 'Sesión cerrada. Token invalidado.' });
});

// Ruta protegida
router.get('/protegido', verificarToken, (req, res) => {
  res.json({ message: 'Ruta protegida', usuario: req.usuario });
});

// Cambiar contraseña sin encriptar
router.post('/cambiar-contrasena', verificarToken, async (req, res) => {
  const { contrasenaActual, nuevaContrasena } = req.body;

  if (!contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
  }

  try {
    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.Contraseña !== contrasenaActual) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    usuario.Contraseña = nuevaContrasena;
    await usuario.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
