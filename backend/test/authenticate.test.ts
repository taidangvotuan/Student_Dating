import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate } from '../src/shared/middleware/authenticate.js';
import { AppError } from '../src/shared/errors/AppError.js';
import type { Request, Response } from 'express';

describe('Authentication Middleware', () => {
  it('should reject requests without Authorization header with 401 AppError', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    let caughtError: unknown;

    await authenticate(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal((caughtError as AppError).statusCode, 401);
    assert.ok((caughtError as AppError).message.includes('Missing or invalid Authorization'));
  });

  it('should reject requests with malformed Authorization header with 401 AppError', async () => {
    const req = { headers: { authorization: 'Basic 12345' } } as Request;
    const res = {} as Response;
    let caughtError: unknown;

    await authenticate(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal((caughtError as AppError).statusCode, 401);
  });

  it('should reject empty Bearer token with 401 AppError', async () => {
    const req = { headers: { authorization: 'Bearer ' } } as Request;
    const res = {} as Response;
    let caughtError: unknown;

    await authenticate(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal((caughtError as AppError).statusCode, 401);
  });

  it('should reject invalid Bearer token with 401 AppError', async () => {
    const req = { headers: { authorization: 'Bearer invalid.token.value' } } as Request;
    const res = {} as Response;
    let caughtError: unknown;

    await authenticate(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof AppError);
    assert.equal((caughtError as AppError).statusCode, 401);
  });
});
