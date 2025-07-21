const jwt = require('jsonwebtoken');

const generateAccessToken = (usuario) => {
  return jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (usuario) => {
  return jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
