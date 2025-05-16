import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
    const location = useLocation();
    const { user } = useAuth();

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to dashboard if user doesn't have required role
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute; 