import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { getUserRoleFromClaims } from '../src/shared/auth/rbac.js';
import { requireRole } from '../src/shared/middleware/rbac.js';
import { AppError } from '../src/shared/errors/AppError.js';

describe('RBAC middleware', () => {
  it('reads only recognized roles from trusted app metadata', () => {
    assert.equal(getUserRoleFromClaims({ user_role: UserRole.ADMIN }), UserRole.ADMIN);
    assert.equal(getUserRoleFromClaims({ user_role: UserRole.MODERATOR }), UserRole.MODERATOR);
    assert.equal(getUserRoleFromClaims({ user_role: 'owner' }), undefined);
    assert.equal(getUserRoleFromClaims(null), undefined);
  });

  it('allows an authenticated user with an allowed role', () => {
    const req = { user: {}, userRole: UserRole.MODERATOR } as Request;
    let nextCalled = false;

    requireRole(UserRole.MODERATOR)(req, {} as Response, (error) => {
      assert.equal(error, undefined);
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
  });

  it('rejects a user without an allowed role with 403', () => {
    const req = { user: {}, userRole: UserRole.USER } as Request;
    let caughtError: unknown;

    requireRole(UserRole.ADMIN)(req, {} as Response, (error) => {
      caughtError = error;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal(caughtError.statusCode, 403);
  });

  it('rejects requests that were not authenticated with 401', () => {
    const req = {} as Request;
    let caughtError: unknown;

    requireRole(UserRole.ADMIN)(req, {} as Response, (error) => {
      caughtError = error;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal(caughtError.statusCode, 401);
  });
});
