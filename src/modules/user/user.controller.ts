import type { Request, Response, NextFunction } from 'express';
import {
  AssignRoleSchema,
  RejectVerificationSchema,
  UserIdParamsSchema,
} from './user.schemas.js';
import * as UserService from './user.service.js';

export function createUserController(
  service: Pick<
    typeof UserService,
    'assignRole' | 'approveVerification' | 'rejectVerification'
  > = UserService
) {
  return {
    async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId } = UserIdParamsSchema.parse(req.params);
        const { role } = AssignRoleSchema.parse(req.body);
        const assignment = await service.assignRole(req.user!.id, userId, role);

        res.status(200).json({
          status: 'success',
          data: assignment,
        });
      } catch (err) {
        next(err);
      }
    },
    async approveVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId } = UserIdParamsSchema.parse(req.params);
        const verification = await service.approveVerification(req.user!.id, userId);

        res.status(200).json({
          status: 'success',
          data: verification,
        });
      } catch (err) {
        next(err);
      }
    },
    async rejectVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { userId } = UserIdParamsSchema.parse(req.params);
        const { rejectionReason } = RejectVerificationSchema.parse(req.body);
        const verification = await service.rejectVerification(
          req.user!.id,
          userId,
          rejectionReason
        );

        res.status(200).json({
          status: 'success',
          data: verification,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}

const userController = createUserController();

export const { assignRole, approveVerification, rejectVerification } = userController;
