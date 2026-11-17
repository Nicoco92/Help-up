import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Ordre important : les variables de la charte d'abord, puis la base, puis les styles de Leaflet.
import './styles/tokens.css'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
