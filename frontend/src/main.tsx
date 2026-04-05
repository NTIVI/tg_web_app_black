import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TadsWidgetProvider } from 'react-tads-widget'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TadsWidgetProvider>
        <App />
      </TadsWidgetProvider>
    </BrowserRouter>
  </StrictMode>,
)
