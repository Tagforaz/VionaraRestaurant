import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User } from '@/types';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User['role'][];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('errors.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('❌ Access Denied:', {
      userRole: user.role,
      allowedRoles: allowedRoles,
      includes: allowedRoles.includes(user.role)
    });
    return <Navigate to="/" replace />;
  }
  
  console.log('✅ Access Granted:', {
    userRole: user?.role,
    allowedRoles: allowedRoles
  });

  return <>{children}</>;
};

export default ProtectedRoute;
