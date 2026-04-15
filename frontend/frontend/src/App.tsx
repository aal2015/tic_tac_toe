import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AuthPage from "./pages/AuthPage";
import { isAuthenticated } from "./services/nakama";

function App() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await isAuthenticated();

      if (result) {
        navigate("/lobby");
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // ⏳ Prevent UI flicker while checking session
  if (loading) {
    return <p>Checking session...</p>;
  }

  return <AuthPage />;
}

export default App;