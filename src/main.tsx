/**
 * ImageVisLab - Digital Image Processing Simulator
 * 
 * Application entry point.
 * Renders the main App component into the DOM.
 * 
 * @module main
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components'
import './index.css'
import App from './App.tsx'

// Mount the application to the root element
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
