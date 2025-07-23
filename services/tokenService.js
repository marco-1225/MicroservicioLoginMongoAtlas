const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = Buffer.from(process.env.JWT_SECRET, 'base64');

// 🔐 Generar Access Token con claims personalizados
const generateAccessToken = (usuario) => {
  const token = jwt.sign(
    {
      id: usuario._id,
      nombre: usuario.nombreUsuario
    },
    secretKey,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
      issuer: process.env.JWT_ISSUER || 'miapp-login',
      audience: process.env.JWT_AUDIENCE || 'miapp-autor'
    }
  );

  return token; // JWT estándar
};


const generateRefreshToken = (tamañoBytes = 32) => {
  const randomBytes = crypto.randomBytes(tamañoBytes);
  return randomBytes.toString('base64');
};

// ✅ Verificar Access Token
const verifyAccessToken = (token) => {
  return jwt.verify(token, secretKey);
};

// 🔐 Comparar refresh token recibido vs guardado
const isValidRefreshToken = (tokenFromClient, tokenInDb) => {
  return tokenFromClient === tokenInDb;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  isValidRefreshToken
};