import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { geocodeAddress } from '@/services/geocodeService'
import { PropertyLocationMap } from '@/views/components/PropertyLocationMap'
import {
  deletePropertyImage,
  getPropertyById,
  replacePropertyImage,
  updateProperty,
} from '@/services/propertyService'
import { ConfirmActionModal } from '@/views/admin/components/ConfirmActionModal'
import { UserNavbar } from '@/views/user/components/UserNavbar.jsx'

const initialForm = {
  titulo: '',
  descripcion: '',
  direccion: '',
  ciudad: '',
  pais: '',
  tipo_precio: 'noche',
  precio_por_noche: '',
  capacidad: '',
  numero_habitaciones: '',
  numero_banos: '',
  latitud: '',
  longitud: '',
  estado: 'activa',
}

const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024
const allowedPriceTypes = ['noche', 'mensual']
const locationFoundMessage = 'Ubicación encontrada. Puedes ajustar el marcador antes de guardar.'
const locationNotFoundMessage =
  'No se encontró una ubicación para esa dirección. Intenta ser más específico.'
const locationSearchFailedMessage =
  'No pudimos buscar la ubicación en este momento. Intenta nuevamente.'

function isValidOptionalCoordinate(value, min, max) {
  if (value === null || value === undefined || value === '') return true
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max
}

function normalizeOptionalNumber(value) {
  return value === '' ? '' : String(Number(value))
}

export function EditarPropiedad() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [canView, setCanView] = useState(false)
  const [userData, setUserData] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [currentImages, setCurrentImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [geocodeState, setGeocodeState] = useState({ isLoading: false, type: '', message: '' })
  const [deletingImageId, setDeletingImageId] = useState(null)
  const [replacingImageId, setReplacingImageId] = useState(null)
  const [confirmAction, setConfirmAction] = useState({ open: false, type: '', image: null, file: null })
  const [actionMessage, setActionMessage] = useState({ open: false, type: '', title: '', description: '' })
  const newImagesRef = useRef([])

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')

    if (!storedUser) {
      navigate('/')
      return
    }

    const user = JSON.parse(storedUser)
    const role = user?.role || user?.rol

    if (role !== 'arrendatario' && role !== 'host' && !user?.id_arrendatario) {
      navigate('/profile')
      return
    }

    setUserData(user)
    setCanView(true)
  }, [navigate])

  const idArrendatario = useMemo(() => {
    return userData?.id_arrendatario || userData?.id
  }, [userData])

  useEffect(() => {
    newImagesRef.current = newImages
  }, [newImages])

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const showActionMessage = (type, description, title) => {
    setActionMessage({
      open: true,
      type,
      title: title || (type === 'success' ? 'Accion completada' : 'Error'),
      description,
    })
  }

  useEffect(() => {
    if (!canView || !idArrendatario || !id) return

    async function loadProperty() {
      try {
        setIsLoading(true)
        setMessage('')
        const property = await getPropertyById(id, idArrendatario)
        setForm({
          titulo: property.titulo || '',
          descripcion: property.descripcion || '',
          direccion: property.direccion || '',
          ciudad: property.ciudad || '',
          pais: property.pais || '',
          tipo_precio: property.tipo_precio || 'noche',
          precio_por_noche: property.precio_por_noche || '',
          capacidad: property.capacidad || '',
          numero_habitaciones: property.numero_habitaciones ?? '',
          numero_banos: property.numero_banos ?? '',
          latitud: property.latitud ?? '',
          longitud: property.longitud ?? '',
          estado: property.estado || 'activa',
        })
        setCurrentImages(property.imagenes || [])
      } catch (error) {
        showActionMessage('error', error.message || 'No se pudo cargar la propiedad.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProperty()
  }, [canView, idArrendatario, id])

  const handleFieldChange = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
    setMessage('')
    setIsSuccess(false)
  }

  const handleLocationChange = coordinates => {
    setForm(current => ({
      ...current,
      latitud: coordinates.latitud,
      longitud: coordinates.longitud,
    }))
    setErrors(current => ({ ...current, latitud: '', longitud: '' }))
    setGeocodeState({ isLoading: false, type: '', message: '' })
    setMessage('')
    setIsSuccess(false)
  }

  const buildSearchAddress = () => {
    return [form.direccion, form.ciudad, form.pais]
      .map(value => value.trim())
      .filter(Boolean)
      .join(', ')
  }

  const handleSearchLocation = async () => {
    const address = buildSearchAddress()

    if (!address) {
      setGeocodeState({
        isLoading: false,
        type: 'error',
        message: 'Escribe una dirección para buscar la ubicación.',
      })
      return
    }

    try {
      setGeocodeState({ isLoading: true, type: '', message: '' })
      const location = await geocodeAddress(address)
      setForm(current => ({
        ...current,
        latitud: location.latitud,
        longitud: location.longitud,
      }))
      setErrors(current => ({ ...current, latitud: '', longitud: '' }))
      setGeocodeState({
        isLoading: false,
        type: 'success',
        message: locationFoundMessage,
      })
      setIsSuccess(false)
    } catch (error) {
      const isNotFound = error.message?.toLowerCase().includes('no se encontro')
      setGeocodeState({
        isLoading: false,
        type: 'error',
        message: isNotFound ? locationNotFoundMessage : locationSearchFailedMessage,
      })
    }
  }

  const validateImageFiles = nextFiles => {
    const totalImages = currentImages.length + newImages.length + nextFiles.length

    if (totalImages > 20) {
      return 'Solo puedes tener un maximo de 20 fotografias por propiedad.'
    }

    if (currentImages.length + newImages.length + nextFiles.length > 20) {
      return 'Solo puedes tener un maximo de 20 fotografias.'
    }

    const hasInvalidType = nextFiles.some(file => !acceptedImageTypes.includes(file.type))
    if (hasInvalidType) {
      return 'Solo se permiten imagenes JPG, PNG o WEBP.'
    }

    const hasOversizedFile = nextFiles.some(file => file.size > maxImageSize)
    if (hasOversizedFile) {
      return 'Cada imagen debe pesar maximo 25 MB.'
    }

    return ''
  }

  const validateReplacementFile = file => {
    if (!file) return 'Selecciona una imagen para reemplazar la fotografía.'
    if (!acceptedImageTypes.includes(file.type)) return 'Solo se permiten imagenes JPG, PNG o WEBP.'
    if (file.size > maxImageSize) return 'Cada imagen debe pesar maximo 25 MB.'
    return ''
  }

  const handleImagesChange = event => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''

    if (selectedFiles.length === 0) return

    const imageError = validateImageFiles(selectedFiles)

    if (imageError) {
      setErrors(current => ({ ...current, imagenes: imageError }))
      return
    }

    const nextImages = selectedFiles.map(file => ({
      file,
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      previewUrl: URL.createObjectURL(file),
    }))

    setNewImages(current => [...current, ...nextImages])
    setErrors(current => ({ ...current, imagenes: '' }))
    setMessage('')
    setIsSuccess(false)
  }

  const removeNewImage = imageId => {
    setNewImages(current => {
      const imageToRemove = current.find(image => image.id === imageId)
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl)
      return current.filter(image => image.id !== imageId)
    })
    setErrors(current => ({ ...current, imagenes: '' }))
  }

  const handleDeleteCurrentImage = image => {
    if (currentImages.length <= 5) {
      setErrors(current => ({
        ...current,
        imagenes: 'La propiedad debe conservar al menos 5 fotografías.',
      }))
      showActionMessage('error', 'La propiedad debe conservar al menos 5 fotografías.')
      setIsSuccess(false)
      return
    }
    setConfirmAction({ open: true, type: 'delete', image, file: null })
  }

  const executeDeleteCurrentImage = async image => {
    try {
      setDeletingImageId(image.id_imagen)
      setMessage('')
      setErrors(current => ({ ...current, imagenes: '' }))
      const result = await deletePropertyImage(id, image.id_imagen, idArrendatario)
      setCurrentImages(result.property?.imagenes || [])
      setIsSuccess(true)
      showActionMessage('success', 'Imagen eliminada correctamente.')
    } catch (error) {
      showActionMessage('error', error.message || 'No se pudo eliminar la imagen.')
      setIsSuccess(false)
    } finally {
      setDeletingImageId(null)
      setConfirmAction({ open: false, type: '', image: null, file: null })
    }
  }

  const handleReplacementFileChange = (image, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    const imageError = validateReplacementFile(file)
    if (imageError) {
      setErrors(current => ({ ...current, imagenes: imageError }))
      showActionMessage('error', imageError)
      return
    }

    setErrors(current => ({ ...current, imagenes: '' }))
    setConfirmAction({ open: true, type: 'replace', image, file })
  }

  const executeReplaceCurrentImage = async (image, file) => {
    const replacementFormData = new FormData()
    replacementFormData.append('id_arrendatario', String(idArrendatario))
    replacementFormData.append('imagen', file)

    try {
      setReplacingImageId(image.id_imagen)
      setMessage('')
      const result = await replacePropertyImage(id, image.id_imagen, replacementFormData)
      setCurrentImages(result.property?.imagenes || [])
      setIsSuccess(true)
      showActionMessage('success', 'Imagen reemplazada correctamente.')
    } catch (error) {
      showActionMessage('error', error.message || 'No se pudo reemplazar la imagen.')
      setIsSuccess(false)
    } finally {
      setReplacingImageId(null)
      setConfirmAction({ open: false, type: '', image: null, file: null })
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.titulo.trim()) nextErrors.titulo = 'El ti­tulo es obligatorio.'
    if (!form.descripcion.trim()) nextErrors.descripcion = 'La descripcion es obligatoria.'
    if (!form.direccion.trim()) nextErrors.direccion = 'La direccion es obligatoria.'
    if (!form.ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria.'
    if (!form.pais.trim()) nextErrors.pais = 'El pais es obligatorio.'
    if (!isValidOptionalCoordinate(form.latitud, -90, 90)) {
      nextErrors.latitud = 'La latitud debe estar entre -90 y 90.'
    }
    if (!isValidOptionalCoordinate(form.longitud, -180, 180)) {
      nextErrors.longitud = 'La longitud debe estar entre -180 y 180.'
    }
    if (!allowedPriceTypes.includes(form.tipo_precio)) {
      nextErrors.tipo_precio = 'El tipo de precio no es valido.'
    }
    if (Number(form.precio_por_noche) <= 0) {
      nextErrors.precio_por_noche =
        form.tipo_precio === 'mensual'
          ? 'El precio mensual debe ser mayor a 0.'
          : 'El precio por noche debe ser mayor a 0.'
    }
    if (form.capacidad !== '' && Number(form.capacidad) <= 0) {
      nextErrors.capacidad = 'La capacidad debe ser mayor a 0.'
    }
    if (
      form.numero_habitaciones !== '' &&
      (!Number.isInteger(Number(form.numero_habitaciones)) ||
        Number(form.numero_habitaciones) < 0)
    ) {
      nextErrors.numero_habitaciones = 'El numero de habitaciones debe ser mayor o igual a 0.'
    }
    if (
      form.numero_banos !== '' &&
      (!Number.isInteger(Number(form.numero_banos)) ||
        Number(form.numero_banos) < 0)
    ) {
      nextErrors.numero_banos = 'El numero de baños debe ser mayor o igual a 0.'
    }
    if (form.estado !== 'activa' && form.estado !== 'inactiva' && form.estado !== 'suspendida') {
      nextErrors.estado = 'El estado no es valido.'
    }
    if (form.estado === 'suspendida') {
      nextErrors.estado = 'El estado suspendida queda reservado para administración.'
    }
    if (!idArrendatario) {
      nextErrors.form = 'No se pudo identificar al arrendatario actual.'
    }
    if (currentImages.length + newImages.length > 20) {
      nextErrors.imagenes = 'Solo puedes tener un mÃ¡ximo de 20 fotografias por propiedad.'
    }

    return nextErrors
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setMessage('')
    setIsSuccess(false)

    const nextErrors = validateForm()
    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) return

    const propertyFormData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'capacidad' || key === 'numero_habitaciones' || key === 'numero_banos') {
        propertyFormData.append(key, normalizeOptionalNumber(value))
        return
      }

      propertyFormData.append(key, value)
    })
    propertyFormData.append('id_arrendatario', String(idArrendatario))
    newImages.forEach(image => {
      propertyFormData.append('imagenes', image.file)
    })

    try {
      setIsSubmitting(true)
      const result = await updateProperty(id, propertyFormData)
      newImages.forEach(image => URL.revokeObjectURL(image.previewUrl))
      setNewImages([])
      setCurrentImages(result.property?.imagenes || currentImages)
      setIsSuccess(true)
      showActionMessage(
        'success',
        newImages.length > 0 ? 'Imágenes agregadas correctamente.' : 'Propiedad actualizada correctamente.'
      )
    } catch (error) {
      showActionMessage('error', error.message || 'No se pudo actualizar la propiedad.')
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderError = field => {
    if (!errors[field]) return null
    return <p className="mt-2 text-sm text-red-700">{errors[field]}</p>
  }

  const priceLabel = form.tipo_precio === 'mensual' ? 'Precio mensual' : 'Precio por noche'
  const isDeleteAction = confirmAction.type === 'delete'
  const actionImageLabel = confirmAction.image?.es_principal
    ? 'la imagen principal'
    : 'esta imagen'

  if (!canView) return null

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/arrendatario/propiedades')}
            className="mb-5 text-[#6B8E23] hover:bg-[#6B8E23]/10 hover:text-[#5a7a1e] shadow-none rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis propiedades
          </Button>

          <Card className="bg-[#F2E8CF] border-none shadow-none rounded-2xl p-6 md:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#6B8E23]">
              <Pencil className="h-6 w-6" />
            </div>
            <h1 className="font-poppins text-2xl font-semibold text-[#5F5F5F] md:text-3xl">
              Editar propiedad
            </h1>
            <p className="mt-3 text-[#5F5F5F]/80">
              Actualiza la informacion de tu alojamiento publicado en NoWayHome.
            </p>

            {isLoading ? (
              <p className="mt-8 text-[#5F5F5F]">Cargando propiedad...</p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                <section className="space-y-4">
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                    Información básica
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="titulo" className="text-[#5F5F5F] font-medium">
                        Título
                      </label>
                      <Input
                        id="titulo"
                        name="titulo"
                        value={form.titulo}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('titulo')}
                    </div>

                    <div>
                      <label htmlFor="descripcion" className="text-[#5F5F5F] font-medium">
                        Descripción
                      </label>
                      <Textarea
                        id="descripcion"
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleFieldChange}
                        className="mt-2 min-h-32 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('descripcion')}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                    Ubicación
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label htmlFor="direccion" className="text-[#5F5F5F] font-medium">
                        Dirección
                      </label>
                      <Input
                        id="direccion"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('direccion')}
                    </div>
                    <div>
                      <label htmlFor="ciudad" className="text-[#5F5F5F] font-medium">
                        Ciudad
                      </label>
                      <Input
                        id="ciudad"
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('ciudad')}
                    </div>
                    <div>
                      <label htmlFor="pais" className="text-[#5F5F5F] font-medium">
                        País
                      </label>
                      <Input
                        id="pais"
                        name="pais"
                        value={form.pais}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('pais')}
                    </div>
                    <div className="md:col-span-3">
                      <Button
                        type="button"
                        onClick={handleSearchLocation}
                        disabled={geocodeState.isLoading}
                        className="rounded-xl bg-[#6B8E23] text-white shadow-none hover:bg-[#5a7a1e] disabled:opacity-60"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {geocodeState.isLoading ? 'Buscando ubicación...' : 'Buscar ubicación'}
                      </Button>
                      {geocodeState.message && (
                        <AlertMessage
                          type={geocodeState.type}
                          message={geocodeState.message}
                          className="mt-3"
                        />
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[#5F5F5F] font-medium">Mapa de ubicación</label>
                      <PropertyLocationMap
                        editable
                        latitud={form.latitud}
                        longitud={form.longitud}
                        onChange={handleLocationChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="latitud" className="text-[#5F5F5F] font-medium">
                        Latitud
                      </label>
                      <Input
                        id="latitud"
                        name="latitud"
                        value={form.latitud}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('latitud')}
                    </div>
                    <div>
                      <label htmlFor="longitud" className="text-[#5F5F5F] font-medium">
                        Longitud
                      </label>
                      <Input
                        id="longitud"
                        name="longitud"
                        value={form.longitud}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('longitud')}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                    Capacidad y precio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label htmlFor="tipo_precio" className="text-[#5F5F5F] font-medium">
                        Tipo de precio
                      </label>
                      <select
                        id="tipo_precio"
                        name="tipo_precio"
                        value={form.tipo_precio}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 w-full rounded-xl border border-[#6B8E23]/20 bg-white px-3 text-[#5F5F5F] outline-none transition-colors focus:border-[#6B8E23]"
                      >
                        <option value="noche">Por noche</option>
                        <option value="mensual">Mensual</option>
                      </select>
                      {renderError('tipo_precio')}
                    </div>
                    <div>
                      <label htmlFor="precio_por_noche" className="text-[#5F5F5F] font-medium">
                        {priceLabel}
                      </label>
                      <Input
                        id="precio_por_noche"
                        name="precio_por_noche"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.precio_por_noche}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('precio_por_noche')}
                    </div>
                    <div>
                      <label htmlFor="capacidad" className="text-[#5F5F5F] font-medium">
                        Capacidad
                      </label>
                      <Input
                        id="capacidad"
                        name="capacidad"
                        type="number"
                        min="1"
                        step="1"
                        value={form.capacidad}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('capacidad')}
                    </div>
                    <div>
                      <label htmlFor="numero_habitaciones" className="text-[#5F5F5F] font-medium">
                        Habitaciones
                      </label>
                      <Input
                        id="numero_habitaciones"
                        name="numero_habitaciones"
                        type="number"
                        min="0"
                        step="1"
                        value={form.numero_habitaciones}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('numero_habitaciones')}
                    </div>
                    <div>
                      <label htmlFor="numero_banos" className="text-[#5F5F5F] font-medium">
                        BaÃ±os
                      </label>
                      <Input
                        id="numero_banos"
                        name="numero_banos"
                        type="number"
                        min="0"
                        step="1"
                        value={form.numero_banos}
                        onChange={handleFieldChange}
                        className="mt-2 h-12 bg-white border-[#6B8E23]/20 focus:border-[#6B8E23] text-[#5F5F5F] rounded-xl"
                      />
                      {renderError('numero_banos')}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">Estado</h2>
                  <div>
                    <label htmlFor="estado" className="text-[#5F5F5F] font-medium">
                      Estado de publicacion
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      value={form.estado}
                      onChange={handleFieldChange}
                      disabled={form.estado === 'suspendida'}
                      className="mt-2 h-12 w-full rounded-xl border border-[#6B8E23]/20 bg-white px-3 text-[#5F5F5F] outline-none transition-colors focus:border-[#6B8E23] disabled:opacity-70"
                    >
                      <option value="activa">Activa</option>
                      <option value="inactiva">Inactiva</option>
                      {form.estado === 'suspendida' && <option value="suspendida">Suspendida</option>}
                    </select>
                    {renderError('estado')}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                    Imágenes actuales
                  </h2>
                  {currentImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {currentImages.map(image => (
                        <div
                          key={image.id_imagen || image.url}
                          className="relative overflow-hidden rounded-xl bg-white border border-[#6B8E23]/10"
                        >
                          <img
                            src={image.url}
                            alt="Imagen actual de la propiedad"
                            className="h-32 w-full object-cover"
                          />
                          {image.es_principal && (
                            <span className="absolute left-2 top-2 rounded-lg bg-[#6B8E23] px-2 py-1 text-xs font-medium text-white">
                              Principal
                            </span>
                          )}
                          <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-end gap-2">
                            <label className="inline-flex cursor-pointer items-center rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#6B8E23] shadow-sm hover:bg-[#F2E8CF]">
                              {replacingImageId === image.id_imagen ? 'Reemplazando...' : 'Reemplazar'}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={event => handleReplacementFileChange(image, event)}
                                disabled={replacingImageId === image.id_imagen}
                                className="sr-only"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDeleteCurrentImage(image)}
                              disabled={deletingImageId === image.id_imagen}
                              className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#A67C52] shadow-sm hover:bg-[#F2E8CF] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              {deletingImageId === image.id_imagen ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5F5F5F]/75">Esta propiedad no tiene imÃ¡genes.</p>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                        Agregar nuevas imagenes
                      </h2>
                      <p className="mt-1 text-sm text-[#5F5F5F]/75">
                        Puedes tener entre 5 y 20 fotografias por propiedad.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-white px-4 py-3 font-medium text-[#6B8E23] border-2 border-[#6B8E23] hover:bg-[#6B8E23] hover:text-white transition-all">
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Seleccionar fotos
                      <input
                        type="file"
                        name="imagenes"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImagesChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {renderError('imagenes')}

                  {newImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {newImages.map(image => (
                        <div
                          key={image.id}
                          className="relative overflow-hidden rounded-xl bg-white border border-[#6B8E23]/10"
                        >
                          <img
                            src={image.previewUrl}
                            alt="Preview nueva"
                            className="h-32 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(image.id)}
                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#A67C52] shadow-sm hover:bg-[#F2E8CF]"
                            aria-label="Quitar imagen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {errors.form && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                    {errors.form}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {isSuccess && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/arrendatario/propiedades')}
                      className="border-2 border-[#6B8E23] text-[#6B8E23] hover:bg-[#6B8E23] hover:text-white shadow-none rounded-xl"
                    >
                      Volver a mis propiedades
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:ml-auto bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl disabled:opacity-60"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </main>

      <ConfirmActionModal
        open={confirmAction.open}
        title={isDeleteAction ? 'Eliminar imagen' : 'Reemplazar imagen'}
        description={
          isDeleteAction ? (
            <p>
              ¿Seguro quieres eliminar {actionImageLabel}? Esta acción también borrará el archivo del
              almacenamiento. La propiedad debe conservar al menos 5 fotografías.
            </p>
          ) : (
            <p>
              ¿Seguro quieres reemplazar {actionImageLabel}? Se mantendrá el mismo orden en la galería.
            </p>
          )
        }
        cancelLabel="Cancelar"
        confirmLabel={
          isDeleteAction
            ? deletingImageId
              ? 'Eliminando...'
              : 'Eliminar'
            : replacingImageId
              ? 'Reemplazando...'
              : 'Reemplazar'
        }
        confirmVariant={isDeleteAction ? 'adminDanger' : 'adminPrimary'}
        disableCancel={Boolean(deletingImageId || replacingImageId)}
        disableConfirm={Boolean(deletingImageId || replacingImageId)}
        onCancel={() => setConfirmAction({ open: false, type: '', image: null, file: null })}
        onConfirm={() => {
          if (confirmAction.type === 'delete') {
            executeDeleteCurrentImage(confirmAction.image)
            return
          }

          executeReplaceCurrentImage(confirmAction.image, confirmAction.file)
        }}
      />

      <ConfirmActionModal
        open={actionMessage.open}
        type={actionMessage.type}
        title={actionMessage.title}
        description={actionMessage.description}
        confirmLabel="Entendido"
        onConfirm={() => setActionMessage({ open: false, type: '', title: '', description: '' })}
      />
    </>
  )
}
