import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './src/routes/authRoutes.js' // <-- Importación

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Montar rutas
app.use('/api/auth', authRoutes) // <-- Configuración

app.listen(PORT, () => {
  console.log(`Servidor seguro corriendo en http://localhost:${PORT}`)
})
