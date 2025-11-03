/**
 * useRouteGuard Hook
 * Provides route protection based on user permissions
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/constants';
import { Permission } from '@/types';

interface RouteGuardOptions {
  requiredPermission?: Permission;
  redirectTo?: string;
}

export function useRouteGuard({ requiredPermission, redirectTo = '/unauthorized' }: RouteGuardOptions = {}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no permission is required, allow access
    if (!requiredPermission) return;

    // If user is not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user has required permission
    if (!hasPermission(currentUser, requiredPermission)) {
      navigate(redirectTo);
    }
  }, [currentUser, requiredPermission, redirectTo, navigate]);

  return {
    isAuthorized: !requiredPermission || (currentUser && hasPermission(currentUser, requiredPermission)),
    user: currentUser,
  };
}