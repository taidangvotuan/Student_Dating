import { UserRole } from '@prisma/client';
import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication is required.'));
    }
    
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return next(new AppError(403, 'You do not have permission to access this resource.'));
    }

    next();
  };
}
