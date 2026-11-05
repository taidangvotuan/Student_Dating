import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';
import { supabaseAdmin } from '../../supabase/supabase.js';
import { AppError } from '../errors/AppError.js';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id'>;
      userRole?: UserRole;
    }
  }
}

export function getUserRoleFromClaims(appMetadata: unknown): UserRole | undefined {
  if (typeof appMetadata !== 'object' || appMetadata === null || !('user_role' in appMetadata)) {
    return undefined;
  }

  const role = appMetadata.user_role;
  return role === UserRole.USER || role === UserRole.MODERATOR || role === UserRole.ADMIN
    ? role
    : undefined;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid Authorization header.'));
  }

  const token = header.slice(7).trim();
  if (!token) {
    return next(new AppError(401, 'Bearer token cannot be empty.'));
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      return next(new AppError(401, error?.message || 'Invalid or expired token.'));
    }

    req.user = { id: data.claims.sub };
    req.userRole = getUserRoleFromClaims(data.claims.app_metadata);
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid or expired token.';
    next(new AppError(401, message));
  }
}
