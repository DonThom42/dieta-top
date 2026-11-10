import { useEffect, useState } from 'react';

type Kind = 'ok' | 'erro';
interface Item { id: number; msg: string; kind: Kind }

let seq = 0;
const listeners = new Set<(i: Item) => void>();

export function toast(msg: string, kind: Kind = 'ok') {
  const item = { id: ++seq, msg, kind };
  listeners.forEach((l) => l(item));
}

export const toastErro = (e: unknown) => toast(e instanceof Error ? e.message : String(e), 'erro');

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const l = (i: Item) => {
      setItems((s) => [...s, i]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== i.id)), i.kind === 'erro' ? 6000 : 2500);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return (
    <div className="toasts" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className={`toast ${i.kind}`}>{i.msg}</div>
      ))}
    </div>
  );
}
