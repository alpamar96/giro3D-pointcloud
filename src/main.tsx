import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Giro3D from './Giro3D'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Giro3D />
  </StrictMode>,
)
