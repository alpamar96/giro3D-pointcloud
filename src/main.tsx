import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
// import Giro3D from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <Giro3D /> */}
    <App />
  </StrictMode>,
)
