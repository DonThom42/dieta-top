import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { unwrap } from '../../lib/data';
import { toast, toastErro } from '../../lib/toast';
import type { Refeicao } from '../../lib/types';
import { Spinner } from '../../components/ui';

export default function Refeicoes() {
  const [lista, setLista] = useState<Refeicao[] | null>(null);
  const [novo, setNovo] = useState('');

  async function carregar() {
    try { setLista(unwrap<Refeicao[]>(await supabase.from('refeicoes').select('*').order('ordem').order('id'))); } catch (e) { toastErro(e); setLista([]); }
  }
  useEffect(() => { void carregar(); }, []);

  async function atualizar(r: Refeicao, campos: Partial<Refeicao>) {
    try {
      unwrap(await supabase.from('refeicoes').update(campos).eq('id', r.id));
      await carregar();
    } catch (e) { toastErro(e); }
  }

  async function criar() {
    if (!novo.trim()) return;
    try {
      const ordem = (lista ?? []).reduce((m, r) => Math.max(m, r.ordem), 0) + 1;
      unwrap(await supabase.from('refeicoes').insert({ nome: novo.trim(), ordem }));
      setNovo(''); toast('Refeição criada.');
      await carregar();
    } catch (e) { toastErro(e); }
  }

  if (!lista) return <Spinner />;
  return (
    <>
      <p className="muted small">A ordem define como as refeições aparecem na tela Hoje. Refeições sem opções cadastradas ficam ocultas.</p>
      <ul className="list card">
        {lista.map((r) => (
          <li key={r.id} className="editrow">
            <input
              defaultValue={r.nome} aria-label={`Nome da refeição ${r.nome}`}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== r.nome) void atualizar(r, { nome: v }); }}
            />
            <input
              className="ordem" inputMode="numeric" defaultValue={r.ordem} aria-label={`Ordem de ${r.nome}`}
              onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== r.ordem) void atualizar(r, { ordem: v }); }}
            />
          </li>
        ))}
      </ul>
      <div className="toolbar">
        <input placeholder="Nova refeição (ex.: Pré-treino)" value={novo} onChange={(e) => setNovo(e.target.value)} />
        <button className="btn primary small" onClick={() => void criar()}>Adicionar</button>
      </div>
    </>
  );
}
