import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ }: ProtectedRouteProps) => {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Check role if needed
  // const user = JSON.parse(userStr);
  // if (allowedRoles && !allowedRoles.includes(user.role)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return <Outlet />;
};
