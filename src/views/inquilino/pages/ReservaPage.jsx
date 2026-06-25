import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { InquilinoNavbar } from '@/views/inquilino/components/InquilinoNavbar.jsx'
import { reservaController } from '@/controllers/reservaController.js'

export function ReservaPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [userData, setUserData] = useState(null)
  const [propiedad, setPropiedad] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [costos, setCostos] = useState(null)
  const [idReservaPendiente, setIdReservaPendiente] = useState(null)

  useEffect(() => {
    const fetchDatos = async () => {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user')
      if (!storedUser) {
        navigate('/')
        return
      }
      setUserData(JSON.parse(storedUser))

      const result = await reservaController.cargarDetallesPropiedad(id)
      if (result.success) {
        setPropiedad(result.data)
      } else {
        console.error('Error al cargar propiedad:', result.error)
        alert('No se pudo cargar la propiedad.')
      }
      setIsLoading(false)
    }
    fetchDatos()
  }, [id, navigate])

  // Recalcular costos cuando cambien las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin && propiedad) {
      const precioBase = propiedad.precio_noche || propiedad.precio || 0
      const calculo = reservaController.calcularCostos(precioBase, fechaInicio, fechaFin)

      if (!calculo.error) {
        setCostos(calculo)
      } else {
        setCostos(null)
      }
    } else {
      setCostos(null)
    }
  }, [fechaInicio, fechaFin, propiedad])

  const handleIniciarReserva = async () => {
    if (!costos || !propiedad) return
    setIsLoading(true)

    // Estructura de datos alineada con la tabla 'reserva'
    const nuevaReserva = {
      id_inquilino: userData.id_inquilino || userData.id,
      id_propiedad: propiedad.id_propiedad || propiedad.id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      pago: costos.total,
      estado: 'pendiente',
    }

    const result = await reservaController.iniciarReserva(nuevaReserva)
    if (result.success) {
      setIdReservaPendiente(result.data)
      setStep(2)
    } else {
      alert('Error al reservar: ' + result.error)
    }
    setIsLoading(false)
  }

  const handleConfirmarPago = async () => {
    setIsLoading(true)
    const result = await reservaController.confirmarReserva(idReservaPendiente)
    if (result.success) {
      setStep(3)
    } else {
      alert('Error al procesar el pago: ' + result.error)
    }
    setIsLoading(false)
  }

  if (isLoading && !propiedad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#6B8E23]">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <InquilinoNavbar />
      <div className="min-h-screen py-8 px-4 bg-[#FAFAFA]">
        <div className="container mx-auto max-w-5xl">
          <button
            onClick={() => navigate('/inquilino/explorar')}
            className="flex items-center gap-2 mb-8 text-[#5F5F5F] font-medium hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> Volver a explorar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {step === 1 && (
              <Card className="p-6 shadow-none border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-[#5F5F5F]">Fechas de Reserva</h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#5F5F5F]">Fecha Inicio</label>
                    <Input type="date" onChange={e => setFechaInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#5F5F5F]">Fecha Fin</label>
                    <Input type="date" onChange={e => setFechaFin(e.target.value)} />
                  </div>

                  {costos && (
                    <div className="bg-[#F9FAFB] p-4 rounded-lg mt-4 border">
                      <p className="text-sm text-gray-600">Días: {costos.dias}</p>
                      <p className="text-xl font-bold text-[#6B8E23]">
                        Total: ${costos.total.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleIniciarReserva}
                    disabled={!costos || isLoading}
                    className="w-full bg-[#6B8E23] hover:bg-[#5a7a1e] h-12"
                  >
                    {isLoading ? 'Procesando...' : 'Continuar'}
                  </Button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-6 border-2 border-[#6B8E23] shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Confirmar Pago</h2>
                <p className="mb-6 text-gray-600">
                  Tu reserva está pendiente. Haz clic abajo para confirmar y completar el proceso.
                </p>
                <Button
                  onClick={handleConfirmarPago}
                  disabled={isLoading}
                  className="w-full bg-[#6B8E23] hover:bg-[#5a7a1e] h-12"
                >
                  {isLoading ? 'Procesando...' : 'Pagar Reserva'}
                </Button>
              </Card>
            )}

            {step === 3 && (
              <Card className="p-6 text-center border-none shadow-none bg-transparent">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#5F5F5F]">¡Éxito!</h2>
                <p className="text-gray-600 mb-6">Tu reserva ha sido confirmada correctamente.</p>
                <Button onClick={() => navigate('/inquilino/explorar')} variant="outline">
                  Volver al inicio
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
