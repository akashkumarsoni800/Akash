import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Ye line hata dena agar index.css nahi hai to

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
