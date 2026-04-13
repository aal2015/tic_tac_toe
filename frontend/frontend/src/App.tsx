import { useEffect } from "react";
import { useNavigate } from "react-router";
import AuthPage from "./pages/AuthPage";
import { isAuthenticated } from "./services/nakama";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/lobby");
    }
  }, [navigate]);

  return <AuthPage />;
}

export default App;