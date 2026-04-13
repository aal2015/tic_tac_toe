import { useEffect, useState } from "react";
import Lobby from "./pages/Lobby";
import AuthPage from "./pages/AuthPage";
import { isAuthenticated } from "./services/nakama";


function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  return (
    <>
      {isAuth ? (
        <Lobby />
      ) : (
        <AuthPage onLogin={() => setIsAuth(true)} />
      )}
    </>
  );
}

export default App;