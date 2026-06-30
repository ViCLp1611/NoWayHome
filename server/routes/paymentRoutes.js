// server/routes/paymentRoutes.js
import express from 'express'
import { paymentController } from '../controllers/paymentController.js'

const router = express.Router()

// Ruta para generar el recibo inicial
router.post('/create-order', paymentController.crearOrden)

// Ruta para confirmar que el usuario sí pagó
router.post('/capture-order', paymentController.capturarOrden)

export default router
