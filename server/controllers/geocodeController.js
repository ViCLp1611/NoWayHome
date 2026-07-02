import { geocodeAddress, ValidationError } from '../services/geocodeService.js'

export async function geocodeAddressHandler(req, res) {
  try {
    const location = await geocodeAddress(req.query?.address)

    return res.json({
      ok: true,
      location,
    })
  } catch (error) {
    if (error instanceof ValidationError || error.statusCode === 400 || error.statusCode === 404) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        message: error.message,
      })
    }

    return res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo buscar la ubicacion.',
    })
  }
}
