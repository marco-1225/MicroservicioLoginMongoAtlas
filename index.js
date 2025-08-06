require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Rutas
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log(' Conectado a MongoDB Atlas con éxito'))
  .catch(err => console.error(' Error al conectar MongoDB:', err));

// Usar rutas
app.use('/api', authRoutes);

// Levantar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
