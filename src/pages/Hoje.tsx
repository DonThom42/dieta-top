import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { unwrap, useCatalogo } from '../lib/data';
import { addDias, dataLonga, fmt, fmtSinal, hojeISO, num, situacao } from '../lib/calc';
import { toast, toastErro } from '../lib/toast';
import type { DiaRefeicao, Macros, MetasRow } from '../lib/types';
import { Bar, Icon, Spinner } from '../components/ui';

interface DiaSalvo {
  id: string;
  dia_refeicoes: DiaRefeicao[];
}
type Selecao = Record<number, number | null>; // refeicao_id -> opcao_id

const ZERO: Macros = { kcal: 0, proteina_g: 0, carboidrato_g: 0, gordura_g: 0 };
const somar = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + num(b.kcal),
  proteina_g: a.proteina_g + num(b.proteina_g),
  carboidrato_g: a.carboidrato_g + num(b.carboidrato_g),
  gordura_g: a.gordura_g + num(b.gordura_g),
});

export default function Hoje() {
  const [params, setParams] = useSearchParams();
  const data = params.get('d') ?? hojeISO();
  const cat = useCatalogo();

  const [dia, setDia] = useState<DiaSalvo | null>(null);
  const [metas, setMetas] = useState<MetasRow | null>(null);
  const [sel, setSel] = useState<Selecao>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);

  function irPara(d: string) {
    setAberta(null);
    if (d === hojeISO()) setParams({}); else setParams({ d });
  }

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const [diaRes, metasRes] = await Promise.all([
          supabase.from('dias').select('id, dia_refeicoes(*)').eq('data', data).maybeSingle(),
          supabase.rpc('calcular_metas', { p_data: data }),
        ]);
        const d = unwrap<DiaSalvo | null>(diaRes);
        const m = unwrap<MetasRow[]>(metasRes);
        const inicial: Selecao = {};
        if (d) {
          for (const r of d.dia_refeicoes) if (r.refeicao_id != null) inicial[r.refeicao_id] = r.opcao_id;
        } else {
          // Dia novo: começa igual ao último dia salvo antes dele.
          const prev = unwrap<{ dia_refeicoes: Pick<DiaRefeicao, 'refeicao_id' | 'opcao_id'>[] }[]>(
            await supabase.from('dias').select('dia_refeicoes(refeicao_id, opcao_id)').lt('data', data).order('data', { ascending: false }).limit(1),
          );
          for (const r of prev[0]?.dia_refeicoes ?? []) if (r.refeicao_id != null) inicial[r.refeicao_id] = r.opcao_id;
        }
        if (!cancelado) { setDia(d); setMetas(m[0] ?? null); setSel(inicial); }
      } catch (e) {
        if (!cancelado) toastErro(e);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [data]);

  const opcaoPorId = useMemo(() => new Map(cat.opcoes.map((o) => [o.opcao_id, o])), [cat.opcoes]);
  const salvoPorRefeicao = useMemo(() => new Map((dia?.dia_refeicoes ?? []).map((r) => [r.refeicao_id, r])), [dia]);

  // Para cada refeição: o que está escolhido, com valores salvos (se for a mesma escolha do registro) ou atuais.
  const linhas = cat.refeicoes.map((r) => {
    const opcoes = cat.opcoes.filter((o) => o.refeicao_id === r.id);
    const escolhida = sel[r.id] ?? null;
    const salvo = salvoPorRefeicao.get(r.id);
    const usaSalvo = escolhida != null && salvo?.opcao_id === escolhida;
    const viva = escolhida != null ? opcaoPorId.get(escolhida) : undefined;
    const macros: Macros | null = usaSalvo ? salvo! : viva ?? null;
    const nome = usaSalvo ? salvo!.opcao_nome : viva?.nome ?? null;
    const itens = usaSalvo
      ? salvo!.itens.map((i) => ({ nome: i.alimento, g: num(i.quantidade_g) }))
      : (cat.itens[escolhida ?? -1] ?? []).map((i) => ({ nome: i.alimentos?.nome ?? '?', g: num(i.quantidade_g) }));
    return { r, opcoes, escolhida: macros ? escolhida : null, macros, nome, itens };
  }).filter((l) => l.opcoes.length > 0 || l.macros);

  const total = linhas.reduce((acc, l) => (l.macros ? somar(acc, l.macros) : acc), ZERO);

  const idsEscolhidos = linhas.filter((l) => l.escolhida != null).map((l) => l.escolhida as number);
  const idsSalvos = (dia?.dia_refeicoes ?? []).map((r) => r.opcao_id).filter((x): x is number => x != null);
  const alterado = !dia || [...idsEscolhidos].sort().join() !== [...idsSalvos].sort().join();

  async function salvar() {
    setSalvando(true);
    try {
      unwrap(await supabase.rpc('salvar_dia', { p_data: data, p_opcoes: idsEscolhidos }));
      const novo = unwrap<DiaSalvo | null>(await supabase.from('dias').select('id, dia_refeicoes(*)').eq('data', data).maybeSingle());
      setDia(novo);
      toast('Dia salvo!');
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  const eHoje = data === hojeISO();
  const sit = metas ? situacao(total.kcal, num(metas.kcal)) : null;
  const diff = metas ? total.kcal - num(metas.kcal) : 0;

  const macros: { chave: 'proteina_g' | 'carboidrato_g' | 'gordura_g'; nome: string; cor: string }[] = [
    { chave: 'proteina_g', nome: 'Proteína', cor: 'var(--prot)' },
    { chave: 'carboidrato_g', nome: 'Carboidrato', cor: 'var(--carb)' },
    { chave: 'gordura_g', nome: 'Gordura', cor: 'var(--gord)' },
  ];

  return (
    <>
      <header className="datenav">
        <button className="icon-btn" aria-label="Dia anterior" onClick={() => irPara(addDias(data, -1))}><Icon name="esq" /></button>
        <div className="datenav-mid">
          <h1>{eHoje ? 'Hoje' : dataLonga(data).split(',')[0]}</h1>
          <label className="datepick">
            {dataLonga(data)}
            <input type="date" value={data} onChange={(e) => e.target.value && irPara(e.target.value)} aria-label="Escolher data" />
          </label>
        </div>
        <button className="icon-btn" aria-label="Próximo dia" onClick={() => irPara(addDias(data, 1))}><Icon name="dir" /></button>
      </header>

      {!eHoje && <button className="btn link small" onClick={() => irPara(hojeISO())}>Voltar para hoje</button>}

      {(carregando || cat.loading) && <Spinner />}
      {cat.error && <p className="msg erro">{cat.error}</p>}

      {!carregando && !cat.loading && (
        <>
          <section className="card summary">
            {metas ? (
              <>
                <div className="summary-top">
                  <div>
                    <div className="big">{fmt(total.kcal)}<small> / {fmt(metas.kcal)} kcal</small></div>
                    <div className={`diff ${sit}`}>
                      {sit === 'ok' ? 'Dentro da meta' : sit === 'abaixo' ? 'Abaixo da meta' : 'Acima da meta'} · {fmtSinal(diff)} kcal
                    </div>
                  </div>
                  {dia && !alterado && <span className="chip ok"><Icon name="check" size={14} /> Salvo</span>}
                </div>
                <Bar value={total.kcal} meta={num(metas.kcal)} cor="var(--primary)" />
                <div className="macros">
                  {macros.map((m) => {
                    const meta = num(metas[m.chave]);
                    return (
                      <div key={m.chave} className="macro">
                        <div className="macro-head"><span>{m.nome}</span><b>{fmt(total[m.chave])}<small> / {fmt(meta)} g</small></b></div>
                        <Bar value={total[m.chave]} meta={meta} cor={m.cor} />
                        <small className="muted">{fmtSinal(total[m.chave] - meta)} g</small>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="big">{fmt(total.kcal)}<small> kcal</small></div>
                <p className="muted">Para ver as metas, preencha seus dados e registre o peso em <Link to="/perfil">Perfil</Link>.</p>
                <div className="macros plain">
                  {macros.map((m) => <div key={m.chave}><span className="muted">{m.nome}</span> <b>{fmt(total[m.chave])} g</b></div>)}
                </div>
              </>
            )}
          </section>

          {linhas.length === 0 && <p className="muted">Nenhuma refeição cadastrada ainda. Peça ao administrador para criar as opções.</p>}

          {linhas.map(({ r, opcoes, escolhida, macros: mm, nome, itens }) => (
            <section key={r.id} className="card meal">
              <header className="meal-head">
                <h2>{r.nome}</h2>
                <span className="muted">{mm ? `${fmt(mm.kcal)} kcal` : 'Pulada'}</span>
              </header>
              {mm && !(aberta === r.id) && (
                <>
                  <p className="meal-opt">{nome}</p>
                  <p className="meal-macros muted">P {fmt(mm.proteina_g)} · C {fmt(mm.carboidrato_g)} · G {fmt(mm.gordura_g)} g</p>
                  <ul className="items">
                    {itens.map((i, k) => <li key={k}><span>{i.nome}</span><span className="muted">{fmt(i.g)} g</span></li>)}
                  </ul>
                </>
              )}
              {aberta === r.id && (
                <div className="radios" role="radiogroup" aria-label={`Opção de ${r.nome}`}>
                  {opcoes.map((o) => (
                    <button
                      key={o.opcao_id} role="radio" aria-checked={escolhida === o.opcao_id}
                      className={`radio ${escolhida === o.opcao_id ? 'on' : ''}`}
                      onClick={() => { setSel((s) => ({ ...s, [r.id]: o.opcao_id })); setAberta(null); }}
                    >
                      <span>{o.nome}</span>
                      <small className="muted">{fmt(o.kcal)} kcal · P {fmt(o.proteina_g)} · C {fmt(o.carboidrato_g)} · G {fmt(o.gordura_g)}</small>
                    </button>
                  ))}
                  <button role="radio" aria-checked={escolhida == null} className={`radio ${escolhida == null ? 'on' : ''}`}
                    onClick={() => { setSel((s) => ({ ...s, [r.id]: null })); setAberta(null); }}>
                    <span>Pular esta refeição</span>
                  </button>
                </div>
              )}
              {opcoes.length > 0 && (
                <button className="btn link small" onClick={() => setAberta(aberta === r.id ? null : r.id)}>
                  {aberta === r.id ? 'Fechar' : mm ? 'Trocar opção' : 'Escolher opção'}
                </button>
              )}
            </section>
          ))}

          <div className="savebar">
            <button className="btn primary" disabled={salvando || !alterado} onClick={() => void salvar()}>
              {salvando ? 'Salvando…' : dia && !alterado ? 'Dia salvo' : dia ? 'Atualizar dia' : 'Salvar dia'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
