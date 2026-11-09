import type { NextFunction, Request, Response } from 'express';
import {
  NotificationPageQuerySchema,
  NotificationParamsSchema,
} from './notification.schemas.js';
import {
  notificationService,
  type NotificationService,
} from './notification.service.js';

function resolveLocale(req: Request, explicitLocale?: 'vi' | 'en'): 'vi' | 'en' {
  if (explicitLocale) {
    return explicitLocale;
  }
  const acceptLang = req.headers['accept-language'];
  if (acceptLang && acceptLang.toLowerCase().includes('en')) {
    return 'en';
  }
  return 'vi';
}

export function createNotificationController(
  service: NotificationService = notificationService
) {
  return {
    async listNotifications(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const query = NotificationPageQuerySchema.parse(req.query);
        const locale = resolveLocale(req, query.locale);
        const data = await service.listNotifications(
          req.user!.id,
          query.limit,
          query.cursor,
          query.status,
          locale
        );
        res.status(200).json({ status: 'success', data });
      } catch (error) {
        next(error);
      }
    },

    async getUnreadCount(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const data = await service.getUnreadCount(req.user!.id);
        res.status(200).json({ status: 'success', data });
      } catch (error) {
        next(error);
      }
    },

    async markAsRead(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const { id } = NotificationParamsSchema.parse(req.params);
        const locale = resolveLocale(
          req,
          req.query.locale === 'en' || req.query.locale === 'vi'
            ? req.query.locale
            : undefined
        );
        const data = await service.markAsRead(req.user!.id, id, locale);
        res.status(200).json({ status: 'success', data });
      } catch (error) {
        next(error);
      }
    },

    async markAllAsRead(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const data = await service.markAllAsRead(req.user!.id);
        res.status(200).json({ status: 'success', data });
      } catch (error) {
        next(error);
      }
    },

    async deleteNotification(
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> {
      try {
        const { id } = NotificationParamsSchema.parse(req.params);
        await service.deleteNotification(req.user!.id, id);
        res.status(200).json({
          status: 'success',
          message: 'Notification deleted successfully.',
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

const defaultController = createNotificationController();
export const listNotifications = defaultController.listNotifications;
export const getUnreadCount = defaultController.getUnreadCount;
export const markAsRead = defaultController.markAsRead;
export const markAllAsRead = defaultController.markAllAsRead;
export const deleteNotification = defaultController.deleteNotification;
