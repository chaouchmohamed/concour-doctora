import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ROUTES } from '../constants';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** If provided, only these roles may access. Others → /dashboard */
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#8B7355] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#6B6B6B]">Loading…</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // If the backend says the user MUST change their password first,
    // redirect to the change-password page (unless already there).
    if (user?.must_change_password && location.pathname !== ROUTES.CHANGE_PASSWORD) {
        return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.profile.role as UserRole)) {
        // Redirect to the first page the user CAN access
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    return <>{children}</>;
};
