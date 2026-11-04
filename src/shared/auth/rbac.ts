import { UserRole } from '@prisma/client';

export function getUserRoleFromClaims(appMetadata: unknown): UserRole | undefined {
  if (typeof appMetadata !== 'object' || appMetadata === null || !('user_role' in appMetadata)) {
    return undefined;
  }

  const role = appMetadata.user_role;
  return role === UserRole.USER || role === UserRole.MODERATOR || role === UserRole.ADMIN
    ? role
    : undefined;
}