import type { Request, Response, NextFunction } from 'express';
import {
  DiscoveryQuerySchema,
  UpdateDiscoveryCriteriaSchema,
} from './discovery.schemas.js';
import * as DiscoveryService from './discovery.service.js';
import { AppError } from '../../shared/errors/AppError.js';
import { logger } from '../../shared/logger/logger.js';

export async function getSearchCriteria(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const criteria = await DiscoveryService.getSearchCriteria(req.user!.id);
    res.status(200).json({ status: 'success', data: criteria });
    logger.info('Discovery search criteria retrieved', {
      userId: req.user!.id,
      action: 'get_search_criteria',
      outcome: 'success',
    });
  } catch (err) {
    const metadata = {
      userId: req.user?.id,
      action: 'get_search_criteria',
      outcome: 'failure',
      errorName: err instanceof Error ? err.name : 'UnknownError',
      ...(err instanceof AppError && { statusCode: err.statusCode }),
    };
    if (err instanceof AppError && err.statusCode < 500) {
      logger.warn('Discovery endpoint request failed', metadata);
    } else {
      logger.error('Discovery endpoint request failed', metadata);
    }
    next(err);
  }
}

export async function updateSearchCriteria(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = UpdateDiscoveryCriteriaSchema.parse(req.body);
    const criteria = await DiscoveryService.updateSearchCriteria(req.user!.id, body);
    res.status(200).json({ status: 'success', data: criteria });
    logger.info('Discovery search criteria updated', {
      userId: req.user!.id,
      action: 'update_search_criteria',
      outcome: 'success',
      updatedFields: Object.keys(body),
    });
  } catch (err) {
    const metadata = {
      userId: req.user?.id,
      action: 'update_search_criteria',
      outcome: 'failure',
      errorName: err instanceof Error ? err.name : 'UnknownError',
      ...(err instanceof AppError && { statusCode: err.statusCode }),
    };
    if (err instanceof AppError && err.statusCode < 500) {
      logger.warn('Discovery endpoint request failed', metadata);
    } else {
      logger.error('Discovery endpoint request failed', metadata);
    }
    next(err);
  }
}

export async function getDiscoveryFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = DiscoveryQuerySchema.parse(req.query);
    const result = await DiscoveryService.getDiscoveryFeed(req.user!.id, query.limit, query.offset);
    res.status(200).json({
      status: 'success',
      data: result.items,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        hasMore: result.hasMore,
      },
    });
    logger.info('Discovery feed retrieved', {
      userId: req.user!.id,
      action: 'get_discovery_feed',
      outcome: 'success',
      limit: query.limit,
      offset: query.offset,
      returnedCount: result.items.length,
      hasMore: result.hasMore,
    });
  } catch (err) {
    const metadata = {
      userId: req.user?.id,
      action: 'get_discovery_feed',
      outcome: 'failure',
      errorName: err instanceof Error ? err.name : 'UnknownError',
      ...(err instanceof AppError && { statusCode: err.statusCode }),
    };
    if (err instanceof AppError && err.statusCode < 500) {
      logger.warn('Discovery endpoint request failed', metadata);
    } else {
      logger.error('Discovery endpoint request failed', metadata);
    }
    next(err);
  }
}
