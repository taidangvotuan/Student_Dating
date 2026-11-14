import { createInitialState } from '../mocks/data';
import { stateSchema, type DemoState } from './models';

export const STORAGE_KEY = 'student-dating:demo:v1';
export interface DemoStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function loadDemo(storage: DemoStorage): { state: DemoState; recovered: boolean } {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: createInitialState(), recovered: false };
    return { state: stateSchema.parse(JSON.parse(raw)), recovered: false };
  } catch { return { state: createInitialState(), recovered: true }; }
}
export function saveDemo(storage: DemoStorage, state: DemoState): boolean {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(stateSchema.parse(state))); return true; }
  catch { return false; }
}
