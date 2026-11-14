import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Heart, X, Sparkles } from 'lucide-react';

export function Brand() {
  return <span className="brand"><span className="brand-mark"><Heart size={23} fill="currentColor" /></span><span>student<span className="brand-light">dating</span><span className="brand-dot">.</span></span></span>;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button type="button" className={`button button-${variant} ${className}`} {...props} />;
}

export function Field({ label, error, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-help` : undefined} {...props} />{(error || hint) && <small className={error ? 'error' : 'muted'} id={`${id}-help`}>{error || hint}</small>}</div>;
}

export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>;
}

export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog className={`modal ${className}`} ref={ref} aria-labelledby={id} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header className="modal-header"><h2 id={id}>{title}</h2><Button variant="ghost" aria-label="Đóng hộp thoại" onClick={onClose}><X size={20} /></Button></header>{children}
  </dialog>;
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Sparkles size={30} /></span><h2>{title}</h2><p>{description}</p>{children}</div>;
}

export function Tags({ items }: { items: string[] }) {
  return <div className="tags">{items.map(item => <span className="tag" key={item}>{item}</span>)}</div>;
}
