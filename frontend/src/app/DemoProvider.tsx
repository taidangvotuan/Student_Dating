import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createInitialState } from '../mocks/data';
import { loadDemo, saveDemo } from '../services/storage';
import type { DemoState } from '../services/models';

interface DemoContextValue {
  state: DemoState; update: (change: (state: DemoState) => DemoState) => void;
  notice: string; notify: (message: string) => void; storageWarning: string;
}
const DemoContext = createContext<DemoContextValue | null>(null);
function boot() {
  try { return loadDemo(window.localStorage); }
  catch { return { state: createInitialState(), recovered: true }; }
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(boot);
  const [state, setState] = useState(initial.state);
  const [notice, notify] = useState(initial.recovered ? 'Dữ liệu demo cũ không hợp lệ. Đã tạo phiên mới.' : '');
  const [storageWarning, setStorageWarning] = useState('');
  useEffect(() => {
    let saved = false;
    try { saved = saveDemo(window.localStorage, state); } catch { /* localStorage can be disabled */ }
    // Surface an external storage failure; this does not change the persisted state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!saved) setStorageWarning('Trình duyệt không cho phép lưu. Tiến độ chỉ được giữ trong phiên này.');
  }, [state]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return <DemoContext.Provider value={{ state, update: setState, notice, notify, storageWarning }}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('DemoProvider is required');
  return value;
}
