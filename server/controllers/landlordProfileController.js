import {
  getLandlordProfile,
  updateLandlordProfile,
  ValidationError,
} from '../services/landlordProfileService.js'

export async function getLandlordProfileHandler(req, res) {
  try {
    const profile = await getLandlordProfile(req.params?.id)

    return res.json({
      ok: true,
      profile,
    })
  } catch (error) {
    if (error instanceof ValidationError || error.statusCode === 400) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      })
    }

    return res.status(500).json({
      ok: false,
      message: 'No se pudo cargar tu informacion.',
    })
  }
}

export async function updateLandlordProfileHandler(req, res) {
  try {
    const profile = await updateLandlordProfile(req.params?.id, req.body)

    return res.json({
      ok: true,
      message: 'Informacion actualizada correctamente.',
      profile,
    })
  } catch (error) {
    if (error instanceof ValidationError || error.statusCode === 400) {
      return res.status(400).json({
        ok: false,
        message: error.message,
      })
    }

    return res.status(500).json({
      ok: false,
      message: 'No se pudo actualizar tu informacion. Intenta nuevamente.',
    })
  }
}
