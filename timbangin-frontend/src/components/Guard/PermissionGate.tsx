import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ permission, children }) => {
  const { permissions } = useAuthStore();

  if (permissions.includes(permission)) {
    return <>{children}</>;
  }

  return null;
};

export default PermissionGate;
