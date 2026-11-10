import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { unwrap } from '../../lib/data';
import { fmt, parseNum, toStr } from '../../lib/calc';
import { toast, toastErro } from '../../lib/toast';
import type { Alimento } from '../../lib/types';
import { Field, Spinner } from '../../components/ui';

interface Form {
  id: number | null; nome: string; kcal: string; proteina_g: string; carboidrato_g: string; gordura_g: string;
  base: string; observacao: string; ativo: boolean;
}
const VAZIO: Form = { id: null, nome: '', kcal: '', proteina_g: '', carboidrato_g: '', gordura_g: '', base: '', observacao: '', ativo: true };

export default function Alimentos() {
  const [lista, setLista] = useState<Alimento[] | null>(null);
  const [busca, setBusca] = useState('');
  const [f, setF] = useState<Form | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try { setLista(unwrap<Alimento[]>(await supabase.from('alimentos').select('*').order('nome'))); } catch (e) { toastErro(e); setLista([]); }
  }
  useEffect(() => { void carregar(); }, []);

  const filtrada = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (lista ?? []).filter((a) => !t || a.nome.toLowerCase().includes(t));
  }, [lista, busca]);

  function editar(a: Alimento) {
    setF({
      id: a.id, nome: a.nome, kcal: toStr(a.kcal), proteina_g: toStr(a.proteina_g), carboidrato_g: toStr(a.carboidrato_g),
      gordura_g: toStr(a.gordura_g), base: a.base ?? '', observacao: a.observacao ?? '', ativo: a.ativo,
    });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!f) return;
    const v = { kcal: parseNum(f.kcal), p: parseNum(f.proteina_g), c: parseNum(f.carboidrato_g), g: parseNum(f.gordura_g) };
    if (!f.nome.trim() || [v.kcal, v.p, v.c, v.g].some((x) => !Number.isFinite(x) || x < 0)) {
      toast('Informe o nome e valores válidos (por 100 g).', 'erro'); return;
    }
    setSalvando(true);
    try {
      const row = {
        nome: f.nome.trim(), kcal: v.kcal, proteina_g: v.p, carboidrato_g: v.c, gordura_g: v.g,
        base: f.base.trim() || null, observacao: f.observacao.trim() || null, ativo: f.ativo,
      };
      unwrap(f.id == null ? await supabase.from('alimentos').insert(row) : await supabase.from('alimentos').update(row).eq('id', f.id));
      toast('Alimento salvo.');
      setF(null);
      await carregar();
    } catch (err) { toastErro(err); } finally { setSalvando(false); }
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((x) => (x ? { ...x, [k]: e.target.value } : x));

  if (!lista) return <Spinner />;

  return (
    <>
      <div className="toolbar">
        <input type="search" placeholder="Buscar alimento" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar alimento" />
        <button className="btn primary small" onClick={() => setF({ ...VAZIO })}>Novo</button>
      </div>

      {f && (
        <form className="card stack" onSubmit={salvar}>
          <h2>{f.id == null ? 'Novo alimento' : 'Editar alimento'}</h2>
          <Field label="Nome"><input value={f.nome} onChange={set('nome')} required /></Field>
          <p className="muted small">Valores por 100 g da porção comestível.</p>
          <div className="row2">
            <Field label="kcal"><input inputMode="decimal" value={f.kcal} onChange={set('kcal')} /></Field>
            <Field label="Proteína (g)"><input inputMode="decimal" value={f.proteina_g} onChange={set('proteina_g')} /></Field>
          </div>
          <div className="row2">
            <Field label="Carboidrato (g)"><input inputMode="decimal" value={f.carboidrato_g} onChange={set('carboidrato_g')} /></Field>
            <Field label="Gordura (g)"><input inputMode="decimal" value={f.gordura_g} onChange={set('gordura_g')} /></Field>
          </div>
          <Field label="Fonte"><input value={f.base} onChange={set('base')} placeholder="TACO, TBCA, rótulo…" /></Field>
          <Field label="Observação"><input value={f.observacao} onChange={set('observacao')} /></Field>
          <label className="check"><input type="checkbox" checked={f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativo (aparece ao montar opções)</label>
          <div className="row2">
            <button type="button" className="btn" onClick={() => setF(null)}>Cancelar</button>
            <button className="btn primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      )}

      <ul className="list card">
        {filtrada.map((a) => (
          <li key={a.id}>
            <button className="listrow" onClick={() => editar(a)}>
              <span className={a.ativo ? '' : 'off'}>{a.nome}</span>
              <small className="muted">{fmt(a.kcal)} kcal · P {fmt(a.proteina_g, 1)} · C {fmt(a.carboidrato_g, 1)} · G {fmt(a.gordura_g, 1)}</small>
            </button>
          </li>
        ))}
        {filtrada.length === 0 && <li className="muted">Nada encontrado.</li>}
      </ul>
    </>
  );
}
