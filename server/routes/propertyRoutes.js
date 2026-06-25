import express from 'express'
import {
  createPropertyHandler,
  deletePropertyImageHandler,
  getLandlordPropertyHandler,
  healthCheck,
  listLandlordPropertiesHandler,
  replacePropertyImageHandler,
  updateLandlordPropertyHandler,
} from '../controllers/propertyController.js'
import {
  uploadOptionalPropertyImages,
  uploadPropertyImages,
  uploadSinglePropertyImage,
} from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/health', healthCheck)
router.get('/:id', getLandlordPropertyHandler)
router.patch('/:id/images/:imageId', uploadSinglePropertyImage, replacePropertyImageHandler)
router.patch('/:id', uploadOptionalPropertyImages, updateLandlordPropertyHandler)
router.delete('/:id/images/:imageId', deletePropertyImageHandler)
router.get('/', listLandlordPropertiesHandler)
router.post('/', uploadPropertyImages, createPropertyHandler)

export default router
