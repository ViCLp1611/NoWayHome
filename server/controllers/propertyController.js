import { supabase } from '../config/supabase.js'
import {
  resolvePropertyTitle,
  sendPropertyCreatedEmail,
  sendPropertyStatusChangedEmail,
  sendPropertyUpdatedEmail,
} from '../services/emailNotificationService.js'
import {
  createProperty,
  deletePropertyImage,
  getLandlordProperties,
  getLandlordPropertyById,
  replacePropertyImage,
  updateLandlordProperty,
  ValidationError,
} from '../services/propertyService.js'

async function notifyLandlordPropertyEvent({
  event,
  landlordId,
  property,
  previousStatus = null,
}) {
  const parsedLandlordId = Number(landlordId || property?.id_arrendatario)
  if (!Number.isInteger(parsedLandlordId) || parsedLandlordId <= 0 || !property) {
    return
  }

  try {
    const { data: landlord, error } = await supabase
      .from('arrendatario')
      .select('id_arrendatario,nombre,correo')
      .eq('id_arrendatario', parsedLandlordId)
      .maybeSingle()

    if (error || !landlord?.correo) return

    const emailPayload = {
      to: landlord.correo,
      name: landlord.nombre,
      propertyTitle: resolvePropertyTitle(property),
      city: property.ciudad || '',
      country: property.pais || '',
      price: property.precio_por_noche ?? property.precio,
      priceType: property.tipo_precio,
      status: property.estado || 'activa',
      previousStatus,
    }

    if (event === 'created') {
      await sendPropertyCreatedEmail(emailPayload)
    } else if (event === 'status_changed') {
      await sendPropertyStatusChangedEmail(emailPayload)
    } else {
      await sendPropertyUpdatedEmail(emailPayload)
    }
  } catch (err) {
    console.error('[propertyController] Error preparando correo de propiedad:', err?.message || err)
  }
}

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

    void notifyLandlordPropertyEvent({
      event: 'created',
      landlordId: req.body?.id_arrendatario,
      property: result.property,
    })

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
    const previousProperty = await getLandlordPropertyById(
      idPropiedad,
      req.body?.id_arrendatario
    ).catch(() => null)
    const property = await updateLandlordProperty(idPropiedad, req.body, req.files || [])

    const prevEstado = String(previousProperty?.estado || '').trim().toLowerCase()
    const nextEstado = String(property?.estado || '').trim().toLowerCase()
    const statusChanged = Boolean(prevEstado && nextEstado && prevEstado !== nextEstado)

    void notifyLandlordPropertyEvent({
      event: statusChanged ? 'status_changed' : 'updated',
      landlordId: req.body?.id_arrendatario,
      property,
      previousStatus: statusChanged ? prevEstado : null,
    })

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

export async function deletePropertyImageHandler(req, res) {
  const idPropiedad = req.params?.id
  const imageId = req.params?.imageId
  const idArrendatario = req.query?.id_arrendatario || req.body?.id_arrendatario

  try {
    const property = await deletePropertyImage(idPropiedad, imageId, idArrendatario)

    return res.json({
      ok: true,
      message: 'Imagen eliminada correctamente.',
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
      message: 'No se pudo eliminar la imagen.',
    })
  }
}

export async function replacePropertyImageHandler(req, res) {
  const idPropiedad = req.params?.id
  const imageId = req.params?.imageId
  const idArrendatario = req.body?.id_arrendatario || req.query?.id_arrendatario

  try {
    const property = await replacePropertyImage(idPropiedad, imageId, req.file, idArrendatario)

    return res.json({
      ok: true,
      message: 'Imagen reemplazada correctamente.',
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
      message: 'No se pudo reemplazar la imagen.',
    })
  }
}

export function createPropertyPlaceholder(_req, res) {
  return res.json({
    ok: true,
    message: 'Endpoint de creacion de propiedad preparado',
  })
}
