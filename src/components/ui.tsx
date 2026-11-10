import type { ReactNode } from 'react';
import { situacao } from '../lib/calc';

const PATHS: Record<string, string> = {
  hoje: 'M8 2v3M16 2v3M3.5 9h17M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4zM8 14l2.5 2.5L16 12',
  historico: 'M4 19V5M4 19h16M8 15l3-4 3 2 5-7',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  admin: 'M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  esq: 'M15 5l-7 7 7 7',
  dir: 'M9 5l7 7-7 7',
  mais: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  baixo: 'M6 9l6 6 6-6',
  copia: 'M9 9h10v10H9zM5 15V5h10',
  lixo: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
};

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return <div className="spinner" role="status"><i />{label}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Barra de progresso do total contra a meta. */
export function Bar({ value, meta, cor }: { value: number; meta: number | null; cor: string }) {
  const pct = meta ? (value / meta) * 100 : 0;
  const acima = meta ? situacao(value, meta) === 'acima' : false;
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(pct, 100))}>
      <div className="bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: acima ? 'var(--acima)' : cor }} />
    </div>
  );
}
