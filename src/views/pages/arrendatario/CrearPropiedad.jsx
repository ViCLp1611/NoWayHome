import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, ImagePlus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { AlertMessage } from '@/app/components/ui/AlertMessage'
import { geocodeAddress } from '@/services/geocodeService'
import { createProperty } from '@/services/propertyService'
import { PropertyLocationMap } from '@/views/components/PropertyLocationMap'
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

export function CrearPropiedad() {
  const navigate = useNavigate()
  const [canView, setCanView] = useState(false)
  const [userData, setUserData] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [geocodeState, setGeocodeState] = useState({ isLoading: false, type: '', message: '' })
  const [actionMessage, setActionMessage] = useState({ open: false, type: '', title: '', description: '' })
  const imagesRef = useRef([])

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

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

  const idArrendatario = useMemo(() => {
    return userData?.id_arrendatario || userData?.id
  }, [userData])

  const showActionMessage = (type, description, title) => {
    setActionMessage({
      open: true,
      type,
      title: title || (type === 'success' ? 'Accion completada' : 'Error'),
      description,
    })
  }

  const handleFieldChange = event => {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
    setMessage('')
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
    if (images.length + nextFiles.length > 20) {
      return 'Solo puedes subir un máximo de 20 fotografías.'
    }

    const hasInvalidType = nextFiles.some(file => !acceptedImageTypes.includes(file.type))
    if (hasInvalidType) {
      return 'Solo se permiten imágenes JPG, PNG o WEBP.'
    }

    const hasOversizedFile = nextFiles.some(file => file.size > maxImageSize)
    if (hasOversizedFile) {
      return 'Cada imagen debe pesar máximo 5 MB.'
    }

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

    setImages(current => [...current, ...nextImages])
    setErrors(current => ({ ...current, imagenes: '' }))
    setMessage('')
  }

  const removeImage = imageId => {
    setImages(current => {
      const imageToRemove = current.find(image => image.id === imageId)
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl)
      return current.filter(image => image.id !== imageId)
    })
    setErrors(current => ({ ...current, imagenes: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!form.titulo.trim()) nextErrors.titulo = 'El título es obligatorio.'
    if (!form.descripcion.trim()) nextErrors.descripcion = 'La descripción es obligatoria.'
    if (!form.direccion.trim()) nextErrors.direccion = 'La dirección es obligatoria.'
    if (!form.ciudad.trim()) nextErrors.ciudad = 'La ciudad es obligatoria.'
    if (!form.pais.trim()) nextErrors.pais = 'El país es obligatorio.'
    if (!isValidOptionalCoordinate(form.latitud, -90, 90)) {
      nextErrors.latitud = 'La latitud debe estar entre -90 y 90.'
    }
    if (!isValidOptionalCoordinate(form.longitud, -180, 180)) {
      nextErrors.longitud = 'La longitud debe estar entre -180 y 180.'
    }
    if (!allowedPriceTypes.includes(form.tipo_precio)) {
      nextErrors.tipo_precio = 'El tipo de precio no es válido.'
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
      nextErrors.numero_habitaciones = 'El número de habitaciones debe ser mayor o igual a 0.'
    }
    if (
      form.numero_banos !== '' &&
      (!Number.isInteger(Number(form.numero_banos)) ||
        Number(form.numero_banos) < 0)
    ) {
      nextErrors.numero_banos = 'El número de baños debe ser mayor o igual a 0.'
    }
    if (!idArrendatario) {
      nextErrors.form = 'No se pudo identificar al arrendatario actual.'
    }
    if (images.length < 5) {
      nextErrors.imagenes = 'Debes subir al menos 5 fotografías de la propiedad.'
    }
    if (images.length > 20) {
      nextErrors.imagenes = 'Solo puedes subir un máximo de 20 fotografías.'
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
    images.forEach(image => {
      propertyFormData.append('imagenes', image.file)
    })

    try {
      setIsSubmitting(true)
      await createProperty(propertyFormData)
      images.forEach(image => URL.revokeObjectURL(image.previewUrl))
      setForm(initialForm)
      setImages([])
      setErrors({})
      setIsSuccess(true)
      showActionMessage('success', 'Propiedad registrada correctamente.')
    } catch (error) {
      showActionMessage('error', error.message || 'No se pudo registrar la propiedad.')
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderError = field => {
    if (!errors[field]) return null
    return <p className="mt-2 text-sm text-red-700">{errors[field]}</p>
  }

  if (!canView) return null

  const priceLabel = form.tipo_precio === 'mensual' ? 'Precio mensual' : 'Precio por noche'
  const priceHelpText =
    form.tipo_precio === 'mensual'
      ? 'Este será el precio para estancias mensuales.'
      : 'Este será el precio que pagará el huésped por cada noche de estancia.'

  return (
    <>
      <UserNavbar />
      <main className="min-h-screen bg-[#FAFAFA] px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/arrendatario/perfil')}
            className="mb-5 text-[#6B8E23] hover:bg-[#6B8E23]/10 hover:text-[#5a7a1e] shadow-none rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>

          <Card className="bg-[#F2E8CF] border-none shadow-none rounded-2xl p-6 md:p-8">
            <div className="max-w-2xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#6B8E23]">
                <Home className="h-6 w-6" />
              </div>
              <h1 className="font-poppins text-2xl font-semibold text-[#5F5F5F] md:text-3xl">
                Agregar propiedad
              </h1>
              <p className="mt-3 text-[#5F5F5F]/80">
                Completa la información de tu alojamiento para publicarlo en NoWayHome.
              </p>
            </div>

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
                    <p className="mt-2 text-xs leading-5 text-[#5F5F5F]/70">{priceHelpText}</p>
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
                      Baños
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-poppins text-xl font-semibold text-[#5F5F5F]">
                      Fotografías
                    </h2>
                    <p className="mt-1 text-sm text-[#5F5F5F]/75">
                      Sube entre 5 y 20 imágenes JPG, PNG o WEBP. Máximo 5 MB por imagen.
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

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map(image => (
                      <div
                        key={image.id}
                        className="relative overflow-hidden rounded-xl bg-white border border-[#6B8E23]/10"
                      >
                        <img
                          src={image.previewUrl}
                          alt="Preview de propiedad"
                          className="h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
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
                    Ver mis propiedades
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:ml-auto bg-[#6B8E23] text-white hover:bg-[#5a7a1e] shadow-none rounded-xl disabled:opacity-60"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar propiedad'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

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
