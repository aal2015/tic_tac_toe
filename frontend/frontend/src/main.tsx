import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import Lobby from './pages/Lobby.tsx';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
       <Route path="/" element={<App />} />
       <Route path="/lobby" element={<Lobby />} />
    </Routes>
  </BrowserRouter>
)
