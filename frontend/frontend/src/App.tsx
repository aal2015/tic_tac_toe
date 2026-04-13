import { useState } from 'react'
import Game from './pages/Game.js'
import AuthPage from './pages/AuthPage.js'
import './App.css'

function App() {
  const [isAuth, setIsAuth] = useState(false);

  return (
    <>
      {isAuth ? (
        <Game />
      ) : (
        <AuthPage onLogin={() => setIsAuth(true)} />
      )}
    </>
  )
}

export default App
