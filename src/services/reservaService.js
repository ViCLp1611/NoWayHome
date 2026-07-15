import { tenantBookingService } from '@/services/tenantBookingService'

export const reservaService = {
  crearReservaPendiente: tenantBookingService.crearReservaPendiente,
  confirmarReserva: tenantBookingService.confirmarReserva,
}
