import express from 'express'
import {
  createPropertyHandler,
  getLandlordPropertyHandler,
  healthCheck,
  listLandlordPropertiesHandler,
  updateLandlordPropertyHandler,
} from '../controllers/propertyController.js'
import { uploadOptionalPropertyImages, uploadPropertyImages } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.get('/health', healthCheck)
router.get('/:id', getLandlordPropertyHandler)
router.patch('/:id', uploadOptionalPropertyImages, updateLandlordPropertyHandler)
router.get('/', listLandlordPropertiesHandler)
router.post('/', uploadPropertyImages, createPropertyHandler)

export default router
