import { supabase } from '../config/supabase.js'

const PROPERTY_IMAGES_BUCKET = 'property-images'

function sanitizeFileName(fileName) {
  const safeName = String(fileName || 'imagen')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return safeName || 'imagen'
}

export async function uploadPropertyImages(idPropiedad, files, options = {}) {
  const uploadedImages = []
  const startOrder = Number.isInteger(options.startOrder) ? options.startOrder : 1
  const markFirstAsPrincipal = options.markFirstAsPrincipal !== false

  for (const [index, file] of files.entries()) {
    const order = startOrder + index
    const fileName = sanitizeFileName(file.originalname)
    const storagePath = `${idPropiedad}/${Date.now()}-${order}-${fileName}`

    const { error } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    if (error) {
      await deletePropertyImages(uploadedImages.map((image) => image.storage_path))
      throw new Error('No se pudieron subir las imagenes de la propiedad.')
    }

    const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath)

    uploadedImages.push({
      url: data.publicUrl,
      storage_path: storagePath,
      orden: order,
      es_principal: markFirstAsPrincipal && index === 0,
    })
  }

  return uploadedImages
}

export async function deletePropertyImages(storagePaths = []) {
  const pathsToDelete = storagePaths.filter(Boolean)

  if (pathsToDelete.length === 0) {
    return
  }

  try {
    await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(pathsToDelete)
  } catch {
    // Best-effort cleanup: the caller should keep returning the original error.
  }
}
