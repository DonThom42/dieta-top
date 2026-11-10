import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { ItemView, OpcaoTotais, Refeicao } from './types';

interface DbError { code?: string; message: string }

export function traduzErro(e: DbError): string {
  switch (e.code) {
    case '23505': return 'Já existe um registro com esse valor.';
    case '23503': return 'Este item está em uso e não pode ser removido.';
    case '42501': return 'Sem permissão para esta ação.';
    case '23514': return 'Algum valor está fora do permitido.';
    default:
      if (/Failed to fetch|NetworkError|Load failed/i.test(e.message)) return 'Sem conexão com a internet.';
      return e.message;
  }
}

/** Devolve `data` ou lança um Error com mensagem em português. */
export function unwrap<T>(res: { data: unknown; error: DbError | null }): T {
  if (res.error) throw new Error(traduzErro(res.error));
  return res.data as T;
}

export interface Catalogo {
  loading: boolean;
  error: string | null;
  refeicoes: Refeicao[];
  opcoes: OpcaoTotais[]; // só opções ativas
  itens: Record<number, ItemView[]>; // por opcao_id
  reload: () => Promise<void>;
}

/** Catálogo compartilhado: refeições, opções ativas (com totais) e itens de cada opção. */
export function useCatalogo(): Catalogo {
  const [s, setS] = useState<Omit<Catalogo, 'reload'>>({ loading: true, error: null, refeicoes: [], opcoes: [], itens: {} });

  const reload = useCallback(async () => {
    try {
      const [r, o, i] = await Promise.all([
        supabase.from('refeicoes').select('*').order('ordem').order('id'),
        supabase.from('opcoes_totais').select('*').eq('ativo', true).order('nome'),
        supabase.from('opcao_itens').select('id, opcao_id, quantidade_g, ordem, alimentos(nome)').order('ordem'),
      ]);
      const itens: Record<number, ItemView[]> = {};
      for (const it of unwrap<ItemView[]>(i)) (itens[it.opcao_id] ??= []).push(it);
      setS({ loading: false, error: null, refeicoes: unwrap(r), opcoes: unwrap(o), itens });
    } catch (e) {
      setS((p) => ({ ...p, loading: false, error: e instanceof Error ? e.message : String(e) }));
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { ...s, reload };
}
