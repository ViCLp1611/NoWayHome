import {
  createProperty,
  getLandlordProperties,
  getLandlordPropertyById,
  updateLandlordProperty,
  ValidationError,
} from '../services/propertyService.js'

export function healthCheck(_req, res) {
  return res.json({
    ok: true,
    module: 'arrendatario-properties',
    message: 'Modulo de propiedades activo',
  })
}

export async function createPropertyHandler(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'Debes subir imagenes de la propiedad.',
    })
  }

  try {
    const result = await createProperty(req.body, req.files)

    return res.status(201).json({
      ok: true,
      message: 'Propiedad registrada correctamente',
      property: result.property,
      images: result.images,
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
      message: 'No se pudo registrar la propiedad.',
    })
  }
}

export async function listLandlordPropertiesHandler(req, res) {
  const idArrendatario = req.query?.id_arrendatario

  try {
    const properties = await getLandlordProperties(idArrendatario)

    return res.json({
      ok: true,
      properties,
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
      message: 'No se pudieron cargar tus propiedades. Intenta nuevamente.',
    })
  }
}

export async function getLandlordPropertyHandler(req, res) {
  const idPropiedad = req.params?.id
  const idArrendatario = req.query?.id_arrendatario

  try {
    const property = await getLandlordPropertyById(idPropiedad, idArrendatario)

    return res.json({
      ok: true,
      property,
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
      message: 'No se pudo cargar la propiedad.',
    })
  }
}

export async function updateLandlordPropertyHandler(req, res) {
  const idPropiedad = req.params?.id

  try {
    const property = await updateLandlordProperty(idPropiedad, req.body, req.files || [])

    return res.json({
      ok: true,
      message: 'Propiedad actualizada correctamente.',
      property,
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
      message: 'No se pudo actualizar la propiedad.',
    })
  }
}

export function createPropertyPlaceholder(_req, res) {
  return res.json({
    ok: true,
    message: 'Endpoint de creacion de propiedad preparado',
  })
}
