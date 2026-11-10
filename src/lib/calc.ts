import type { Sexo } from './types';

// ---- Fórmulas da planilha ------------------------------------------------
// (O banco tem a mesma conta em calcular_metas(); aqui serve para a prévia ao vivo no Perfil.)

/** Fator de atividade sugerido pelo nº de treinos (aba Calculadora: 3, 4 ou 5 treinos). */
export const FATOR_POR_TREINOS: Record<number, number> = { 3: 1.45, 4: 1.55, 5: 1.65 };
export const sugerirFator = (treinos: number): number | null => FATOR_POR_TREINOS[treinos] ?? null;

export interface MetasInput {
  sexo: Sexo;
  pesoKg: number;
  alturaCm: number;
  idade: number;
  fator: number;
  superavit: number; // 0.08 = 8%
  protGkg: number;
  gordGkg: number;
}

export interface MetasCalc {
  tmb: number;
  get: number;
  kcal: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
}

export function calcMetas(i: MetasInput): MetasCalc {
  const tmb = 10 * i.pesoKg + 6.25 * i.alturaCm - 5 * i.idade + (i.sexo === 'Masculino' ? 5 : -161);
  const get = tmb * i.fator;
  const kcal = get * (1 + i.superavit);
  const proteina = i.pesoKg * i.protGkg;
  const gordura = i.pesoKg * i.gordGkg;
  const carboidrato = (kcal - proteina * 4 - gordura * 9) / 4;
  return { tmb, get, kcal, proteina, carboidrato, gordura };
}

export const imc = (pesoKg: number, alturaCm: number) => pesoKg / (alturaCm / 100) ** 2;
/** Faixa de ganho semanal: 0,15% a 0,30% do peso (aba Calculadora). */
export const ganhoSemanal = (pesoKg: number): [number, number] => [pesoKg * 0.0015, pesoKg * 0.003];

// ---- Situação do dia vs meta ---------------------------------------------
export const TOLERANCIA = 0.05; // ±5% da meta conta como "fechou"
export type Situacao = 'ok' | 'abaixo' | 'acima';

export function situacao(total: number, meta: number, tol = TOLERANCIA): Situacao {
  if (!meta) return 'ok';
  const r = total / meta - 1;
  if (r > tol) return 'acima';
  if (r < -tol) return 'abaixo';
  return 'ok';
}

// ---- Datas ----------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (iso: string) => new Date(`${iso}T12:00:00`);

export const hojeISO = () => toISO(new Date());

export function addDias(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function idadeEm(nascimento: string, ref: string): number {
  const n = fromISO(nascimento);
  const r = fromISO(ref);
  let idade = r.getFullYear() - n.getFullYear();
  if (r.getMonth() < n.getMonth() || (r.getMonth() === n.getMonth() && r.getDate() < n.getDate())) idade--;
  return idade;
}

export function dataCurta(iso: string): string {
  return fromISO(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
}

export function dataLonga(iso: string): string {
  const s = fromISO(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Números ----------------------------------------------------------------
export const num = (v: unknown): number => Number(v);

export function fmt(v: number | string, casas = 0): string {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function fmtSinal(v: number, casas = 0): string {
  const r = Number(v.toFixed(casas));
  if (r === 0) return fmt(0, casas);
  return `${r > 0 ? '+' : '−'}${fmt(Math.abs(r), casas)}`;
}

/** Aceita "83,5" ou "83.5". Devolve NaN se vazio/ inválido. */
export function parseNum(s: string): number {
  const t = s.trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
}

export const toStr = (v: number | null | undefined): string => (v == null ? '' : String(v).replace('.', ','));
