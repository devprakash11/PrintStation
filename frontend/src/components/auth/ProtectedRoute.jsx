import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { InitialLoader } from '../common/Loader.jsx';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <InitialLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
