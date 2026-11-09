import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import type { AdminProfile, AdminRole } from '@sajag/shared';
import { adminApi, queryKeys } from '../api/endpoints';
import { adminTokenStore } from './token-store';

export interface AdminSession {
  token: string | null;
  profile: AdminProfile | undefined;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  can: (...roles: AdminRole[]) => boolean;
  signOut: () => void;
}

export function useAdminSession(): AdminSession {
  const token = useSyncExternalStore(adminTokenStore.subscribe, adminTokenStore.get);
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.adminMe, token],
    queryFn: adminApi.me,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
  return {
    token,
    profile,
    isLoading: Boolean(token) && isLoading,
    error,
    retry: () => void refetch(),
    can: (...roles) => Boolean(profile && roles.includes(profile.role)),
    signOut: adminTokenStore.clear,
  };
}
