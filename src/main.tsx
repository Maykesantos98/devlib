import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './router'
import { initMotionFallback } from './lib/motionFallback'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)

// Só age em navegadores sem view-timeline (hoje: Firefox). Ver o módulo.
initMotionFallback()
