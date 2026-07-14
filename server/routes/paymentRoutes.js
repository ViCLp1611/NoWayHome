// server/routes/paymentRoutes.js
import express from 'express'
import { paymentController } from '../controllers/paymentController.js'

const router = express.Router()

// Ruta para generar el recibo inicial
router.post('/create-order', paymentController.crearOrden)
router.post('/crear-orden', paymentController.crearOrden)

// Ruta para confirmar que el usuario sí pagó
router.post('/capture-order', paymentController.capturarOrden)
router.post('/capturar-orden', paymentController.capturarOrden)

export default router
