import type { Request, Response, NextFunction } from 'express';
import {
  UpdateProfileSchema,
  UpdateInterestsSchema,
  UpdatePreferencesSchema,
} from './profile.schemas.js';
import * as ProfileService from './profile.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.id;
    const profile = await ProfileService.getProfile(studentId);
    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.id;
    const body = UpdateProfileSchema.parse(req.body);
    const updated = await ProfileService.updateProfile(studentId, body);
    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function setInterests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.id;
    const body = UpdateInterestsSchema.parse(req.body);
    const result = await ProfileService.setInterests(studentId, body);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function upsertPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user!.id;
    const body = UpdatePreferencesSchema.parse(req.body);
    const preferences = await ProfileService.upsertPreferences(studentId, body);
    res.status(200).json({
      status: 'success',
      data: preferences,
    });
  } catch (err) {
    next(err);
  }
}

export async function listInterests(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const interests = await ProfileService.listInterests();
    res.status(200).json({
      status: 'success',
      data: interests,
    });
  } catch (err) {
    next(err);
  }
}
