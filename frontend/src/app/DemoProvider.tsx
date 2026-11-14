import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createInitialState } from "../mocks/data";
import { loadDemo, saveDemo } from "../services/storage";
import type { DemoState } from "../services/models";

interface DemoContextValue {
  state: DemoState;
  update: (change: (state: DemoState) => DemoState) => void;
  notice: string;
  notify: (message: string) => void;
  storageWarning: string;
}
const DemoContext = createContext<DemoContextValue | null>(null);
function boot() {
  try {
    return loadDemo(window.localStorage);
  } catch {
    return { state: createInitialState(), recovered: true };
  }
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(boot);
  const [state, setState] = useState(initial.state);
  const current = useRef(initial.state);
  const [notice, notify] = useState(
    initial.recovered ? "Dữ liệu demo cũ không hợp lệ. Đã tạo phiên mới." : "",
  );
  const [storageWarning, setStorageWarning] = useState("");
  const update = useCallback((change: (state: DemoState) => DemoState) => {
    const next = change(current.current);
    current.current = next;
    setState(next);
    let saved = false;
    try {
      saved = saveDemo(window.localStorage, next);
    } catch {
      /* localStorage can be disabled */
    }
    if (!saved)
      setStorageWarning(
        "Trình duyệt không cho phép lưu. Tiến độ chỉ được giữ trong phiên này.",
      );
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <DemoContext.Provider
      value={{ state, update, notice, notify, storageWarning }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider is required");
  return value;
}
