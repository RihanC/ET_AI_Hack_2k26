import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppPremium from './AppPremium'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppPremium />
  </StrictMode>,
)
