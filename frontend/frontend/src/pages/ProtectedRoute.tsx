import { isAuthenticated } from "../services/nakama"
import { Navigate, Outlet } from "react-router";

const ProtectedRoute = () => {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;