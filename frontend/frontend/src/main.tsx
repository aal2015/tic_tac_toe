import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import ProtectedRoute from './pages/ProtectedRoute.tsx';
import Lobby from './pages/Lobby.tsx';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/lobby" element={<Lobby />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
