import multer from 'multer'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MIN_PROPERTY_IMAGES = 5
const MAX_PROPERTY_IMAGES = 20

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: MAX_PROPERTY_IMAGES,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imagenes JPEG, PNG o WEBP.'))
    }

    return cb(null, true)
  },
})

export function uploadPropertyImages(req, res, next) {
  upload.array('imagenes', MAX_PROPERTY_IMAGES)(req, res, (error) => {
    if (error) {
      const isFileSizeError = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      const isFileCountError =
        error instanceof multer.MulterError &&
        (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE')

      if (isFileSizeError) {
        return res.status(400).json({
          ok: false,
          message: 'Cada imagen debe pesar maximo 5 MB.',
        })
      }

      if (isFileCountError) {
        return res.status(400).json({
          ok: false,
          message: `Puedes subir maximo ${MAX_PROPERTY_IMAGES} imagenes.`,
        })
      }

      return res.status(400).json({
        ok: false,
        message: error.message || 'No se pudieron procesar las imagenes.',
      })
    }

    const imageCount = req.files?.length || 0

    if (imageCount < MIN_PROPERTY_IMAGES) {
      return res.status(400).json({
        ok: false,
        message: `Debes subir minimo ${MIN_PROPERTY_IMAGES} imagenes.`,
      })
    }

    if (imageCount > MAX_PROPERTY_IMAGES) {
      return res.status(400).json({
        ok: false,
        message: `Puedes subir maximo ${MAX_PROPERTY_IMAGES} imagenes.`,
      })
    }

    return next()
  })
}

export function uploadOptionalPropertyImages(req, res, next) {
  upload.array('imagenes', MAX_PROPERTY_IMAGES)(req, res, (error) => {
    if (error) {
      const isFileSizeError = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      const isFileCountError =
        error instanceof multer.MulterError &&
        (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE')

      if (isFileSizeError) {
        return res.status(400).json({
          ok: false,
          message: 'Cada imagen debe pesar maximo 5 MB.',
        })
      }

      if (isFileCountError) {
        return res.status(400).json({
          ok: false,
          message: `Puedes subir maximo ${MAX_PROPERTY_IMAGES} imagenes.`,
        })
      }

      return res.status(400).json({
        ok: false,
        message: error.message || 'No se pudieron procesar las imagenes.',
      })
    }

    return next()
  })
}

export { MAX_PROPERTY_IMAGES, MIN_PROPERTY_IMAGES }
