import { useEffect, useState } from "react";
import Game from "./pages/Game";
import AuthPage from "./pages/AuthPage";
import { getSession } from "./services/nakama";

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session || session.expires_at! * 1000 < Date.now()) {
      localStorage.removeItem("session");
      setIsAuth(false);
      return;
    }

    setIsAuth(true);
  }, []);

  return (
    <>
      {isAuth ? (
        <Game />
      ) : (
        <AuthPage onLogin={() => setIsAuth(true)} />
      )}
    </>
  );
}

export default App;