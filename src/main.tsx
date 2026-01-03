import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Agar ye file nahi h to is line ko hata dein
import { BrowserRouter } from 'react-router-dom' // ✅ Router YAHAN hona chahiye

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Yahan Router lagaya */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
