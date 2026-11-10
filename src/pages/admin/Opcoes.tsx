import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { unwrap } from '../../lib/data';
import { fmt, num, parseNum } from '../../lib/calc';
import { toast, toastErro } from '../../lib/toast';
import type { Alimento, OpcaoTotais, Refeicao } from '../../lib/types';
import { Icon, Spinner } from '../../components/ui';

interface Item { id: number; alimento_id: number; quantidade_g: number; ordem: number; alimentos: Alimento }

export default function Opcoes() {
  const [refeicoes, setRefeicoes] = useState<Refeicao[] | null>(null);
  const [opcoes, setOpcoes] = useState<OpcaoTotais[]>([]);
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [refId, setRefId] = useState<number | null>(null);
  const [opId, setOpId] = useState<number | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [novaOpcao, setNovaOpcao] = useState('');
  const [busca, setBusca] = useState('');
  const [alimId, setAlimId] = useState('');
  const [qtd, setQtd] = useState('100');

  const carregarBase = useCallback(async () => {
    try {
      const [r, o, a] = await Promise.all([
        supabase.from('refeicoes').select('*').order('ordem').order('id'),
        supabase.from('opcoes_totais').select('*').order('nome'),
        supabase.from('alimentos').select('*').eq('ativo', true).order('nome'),
      ]);
      const rs = unwrap<Refeicao[]>(r);
      setRefeicoes(rs); setOpcoes(unwrap(o)); setAlimentos(unwrap(a));
      setRefId((cur) => cur ?? rs[0]?.id ?? null);
    } catch (e) { toastErro(e); setRefeicoes([]); }
  }, []);

  const carregarItens = useCallback(async (id: number | null) => {
    if (id == null) { setItens([]); return; }
    try {
      setItens(unwrap<Item[]>(await supabase.from('opcao_itens').select('id, alimento_id, quantidade_g, ordem, alimentos(*)').eq('opcao_id', id).order('ordem').order('id')));
    } catch (e) { toastErro(e); }
  }, []);

  useEffect(() => { void carregarBase(); }, [carregarBase]);
  useEffect(() => { void carregarItens(opId); }, [opId, carregarItens]);

  const daRefeicao = opcoes.filter((o) => o.refeicao_id === refId);
  const opcao = opcoes.find((o) => o.opcao_id === opId) ?? null;

  const totais = useMemo(() => itens.reduce((t, i) => {
    const f = num(i.quantidade_g) / 100;
    return {
      kcal: t.kcal + f * num(i.alimentos.kcal), p: t.p + f * num(i.alimentos.proteina_g),
      c: t.c + f * num(i.alimentos.carboidrato_g), g: t.g + f * num(i.alimentos.gordura_g),
    };
  }, { kcal: 0, p: 0, c: 0, g: 0 }), [itens]);

  const candidatos = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return alimentos.filter((a) => !t || a.nome.toLowerCase().includes(t)).slice(0, 80);
  }, [alimentos, busca]);

  async function run(fn: () => Promise<void>, ok?: string) {
    try { await fn(); if (ok) toast(ok); } catch (e) { toastErro(e); }
  }

  const criarOpcao = () => run(async () => {
    if (refId == null || !novaOpcao.trim()) return;
    const novo = unwrap<{ id: number }[]>(await supabase.from('opcoes_refeicao').insert({ refeicao_id: refId, nome: novaOpcao.trim() }).select('id'));
    setNovaOpcao('');
    await carregarBase();
    setOpId(novo[0].id);
  }, 'Opção criada.');

  const renomear = (nome: string) => run(async () => {
    if (!opcao || !nome.trim() || nome.trim() === opcao.nome) return;
    unwrap(await supabase.from('opcoes_refeicao').update({ nome: nome.trim() }).eq('id', opcao.opcao_id));
    await carregarBase();
  }, 'Nome atualizado.');

  const alternarAtiva = () => run(async () => {
    if (!opcao) return;
    unwrap(await supabase.from('opcoes_refeicao').update({ ativo: !opcao.ativo }).eq('id', opcao.opcao_id));
    await carregarBase();
  });

  const duplicar = () => run(async () => {
    if (!opcao) return;
    const nova = unwrap<{ id: number }[]>(await supabase.from('opcoes_refeicao')
      .insert({ refeicao_id: opcao.refeicao_id, nome: `${opcao.nome} (cópia)` }).select('id'));
    if (itens.length) {
      unwrap(await supabase.from('opcao_itens').insert(itens.map((i) => ({ opcao_id: nova[0].id, alimento_id: i.alimento_id, quantidade_g: i.quantidade_g, ordem: i.ordem }))));
    }
    await carregarBase();
    setOpId(nova[0].id);
  }, 'Opção duplicada. Ajuste o nome e as quantidades.');

  const excluir = () => run(async () => {
    if (!opcao || !window.confirm(`Excluir a opção "${opcao.nome}"? Os dias já salvos continuam com os valores gravados.`)) return;
    unwrap(await supabase.from('opcoes_refeicao').delete().eq('id', opcao.opcao_id));
    setOpId(null);
    await carregarBase();
  }, 'Opção excluída.');

  const mudarQtd = (item: Item, valor: string) => run(async () => {
    const v = parseNum(valor);
    if (!(v > 0)) { toast('Quantidade inválida.', 'erro'); await carregarItens(opId); return; }
    if (v === num(item.quantidade_g)) return;
    unwrap(await supabase.from('opcao_itens').update({ quantidade_g: v }).eq('id', item.id));
    await Promise.all([carregarItens(opId), carregarBase()]);
  });

  const remover = (item: Item) => run(async () => {
    unwrap(await supabase.from('opcao_itens').delete().eq('id', item.id));
    await Promise.all([carregarItens(opId), carregarBase()]);
  });

  const adicionar = () => run(async () => {
    const v = parseNum(qtd);
    if (opId == null || !alimId || !(v > 0)) { toast('Escolha um alimento e uma quantidade.', 'erro'); return; }
    const ordem = itens.reduce((m, i) => Math.max(m, i.ordem), 0) + 1;
    unwrap(await supabase.from('opcao_itens').insert({ opcao_id: opId, alimento_id: Number(alimId), quantidade_g: v, ordem }));
    setAlimId(''); setBusca('');
    await Promise.all([carregarItens(opId), carregarBase()]);
  });

  if (!refeicoes) return <Spinner />;
  if (refeicoes.length === 0) return <p className="muted">Crie uma refeição na aba “Refeições” primeiro.</p>;

  return (
    <>
      <div className="chips">
        {refeicoes.map((r) => (
          <button key={r.id} className={`pill ${r.id === refId ? 'on' : ''}`} onClick={() => { setRefId(r.id); setOpId(null); }}>{r.nome}</button>
        ))}
      </div>

      <ul className="list card">
        {daRefeicao.map((o) => (
          <li key={o.opcao_id}>
            <button className={`listrow ${o.opcao_id === opId ? 'sel' : ''}`} onClick={() => setOpId(o.opcao_id === opId ? null : o.opcao_id)}>
              <span className={o.ativo ? '' : 'off'}>{o.nome}{o.ativo ? '' : ' (inativa)'}</span>
              <small className="muted">{fmt(o.kcal)} kcal · P {fmt(o.proteina_g)} · C {fmt(o.carboidrato_g)} · G {fmt(o.gordura_g)}</small>
            </button>
          </li>
        ))}
        {daRefeicao.length === 0 && <li className="muted">Nenhuma opção nesta refeição.</li>}
      </ul>

      <div className="toolbar">
        <input placeholder="Nome da nova opção" value={novaOpcao} onChange={(e) => setNovaOpcao(e.target.value)} />
        <button className="btn primary small" onClick={() => void criarOpcao()}>Criar</button>
      </div>

      {opcao && (
        <section className="card stack">
          <input
            key={opcao.opcao_id} className="title-input" defaultValue={opcao.nome} aria-label="Nome da opção"
            onBlur={(e) => void renomear(e.target.value)}
          />
          <p className="muted small">Total: <b>{fmt(totais.kcal)} kcal</b> · P {fmt(totais.p)} · C {fmt(totais.c)} · G {fmt(totais.g)} g</p>

          <ul className="items edit">
            {itens.map((i) => (
              <li key={i.id}>
                <span>{i.alimentos.nome}</span>
                <input
                  key={`${i.id}-${i.quantidade_g}`} className="qty" inputMode="decimal" defaultValue={String(i.quantidade_g).replace('.', ',')}
                  aria-label={`Quantidade de ${i.alimentos.nome} em gramas`} onBlur={(e) => void mudarQtd(i, e.target.value)}
                />
                <span className="muted">g</span>
                <button className="icon-btn" aria-label={`Remover ${i.alimentos.nome}`} onClick={() => void remover(i)}><Icon name="lixo" size={18} /></button>
              </li>
            ))}
            {itens.length === 0 && <li className="muted">Sem itens ainda.</li>}
          </ul>

          <div className="addrow">
            <input type="search" placeholder="Buscar alimento" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar alimento para adicionar" />
            <select value={alimId} onChange={(e) => setAlimId(e.target.value)} aria-label="Alimento">
              <option value="">Escolha…</option>
              {candidatos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
            <input className="qty" inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} aria-label="Quantidade em gramas" />
            <button className="btn primary small" onClick={() => void adicionar()}><Icon name="mais" size={18} /> g</button>
          </div>

          <div className="row3">
            <button className="btn small" onClick={() => void alternarAtiva()}>{opcao.ativo ? 'Desativar' : 'Ativar'}</button>
            <button className="btn small" onClick={() => void duplicar()}><Icon name="copia" size={16} /> Duplicar</button>
            <button className="btn small danger" onClick={() => void excluir()}>Excluir</button>
          </div>
        </section>
      )}
    </>
  );
}
