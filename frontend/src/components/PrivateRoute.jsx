import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, allowedRoles }) {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.rol))
    return (
      <div className="p-6 text-red-600 font-bold">
        Acceso denegado – No tenés permisos para ver esta sección.
      </div>
    );

  return children;
}
