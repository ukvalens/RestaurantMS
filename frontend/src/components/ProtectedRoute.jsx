import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'customer' ? '/customer/menu' : '/app/dashboard'} />;
  }
  return children;
};

export default ProtectedRoute;
