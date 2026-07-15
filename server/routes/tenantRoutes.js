import express from 'express'
import {
  confirmTenantReservationHandler,
  cancelTenantReservationHandler,
  createTenantReservationHandler,
  getTenantProfileHandler,
  getTenantPropertyHandler,
  getTenantReservationHandler,
  listTenantPropertiesHandler,
  listTenantReservationsHandler,
  updateTenantProfileHandler,
} from '../controllers/tenantController.js'

const router = express.Router()

router.get('/profile/:id', getTenantProfileHandler)
router.patch('/profile/:id', updateTenantProfileHandler)
router.get('/properties/:id', getTenantPropertyHandler)
router.get('/properties', listTenantPropertiesHandler)
router.get('/reservas/:id', getTenantReservationHandler)
router.patch('/reservas/:id/confirm', confirmTenantReservationHandler)
router.patch('/reservas/:id/cancel', cancelTenantReservationHandler)
router.get('/reservas', listTenantReservationsHandler)
router.post('/reservas', createTenantReservationHandler)

export default router
