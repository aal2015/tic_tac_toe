import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { isAuthenticated } from "../services/nakama";

const ProtectedRoute = () => {
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const result = await isAuthenticated();
            setAllowed(result);
            setLoading(false);
        };

        checkAuth();
    }, []);

    if (loading) {
        return <p>Checking authentication...</p>;
    }

    if (!allowed) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;