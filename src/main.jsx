import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import '@/styles/index.css'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

// Opciones de configuración para el SDK de PayPal.
// Tu Client ID se carga de forma segura desde las variables de entorno.
const initialOptions = {
  'client-id': PAYPAL_CLIENT_ID,
  currency: 'MXN',
  intent: 'capture',
}

const root = createRoot(document.getElementById('root'))

// Si el Client ID de PayPal no está configurado, muestra un error claro en lugar de la app.
if (!PAYPAL_CLIENT_ID) {
  root.render(
    <StrictMode>
      <div
        style={{
          padding: '20px',
          fontFamily: 'sans-serif',
          backgroundColor: '#fffbe6',
          border: '1px solid #fcc300',
          borderRadius: '8px',
          margin: '20px',
        }}
      >
        <h1 style={{ color: '#7d5200' }}>Error de Configuración de PayPal</h1>
        <p>
          Asegúrate de que la variable <strong>VITE_PAYPAL_CLIENT_ID</strong> esté definida en tu
          archivo <code>.env</code> en la raíz del proyecto.
        </p>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          VITE_PAYPAL_CLIENT_ID=TU_CLIENT_ID_DE_PAYPAL_AQUI
        </pre>
      </div>
    </StrictMode>
  )
} else {
  root.render(
    <StrictMode>
      <PayPalScriptProvider options={initialOptions}>
        <App />
      </PayPalScriptProvider>
    </StrictMode>
  )
}
