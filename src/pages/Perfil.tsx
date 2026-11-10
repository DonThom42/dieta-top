import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { unwrap } from '../lib/data';
import { calcMetas, fmt, ganhoSemanal, hojeISO, idadeEm, imc, parseNum, sugerirFator, toStr } from '../lib/calc';
import { toast, toastErro } from '../lib/toast';
import { useInstalar } from '../lib/install';
import type { Medida, Sexo } from '../lib/types';
import { Field } from '../components/ui';

export default function Perfil() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const instalar = useInstalar();

  // dados pessoais
  const [nome, setNome] = useState(profile?.nome ?? '');
  const [sexo, setSexo] = useState<Sexo | ''>(profile?.sexo ?? '');
  const [altura, setAltura] = useState(toStr(profile?.altura_cm));
  const [nasc, setNasc] = useState(profile?.data_nascimento ?? '');
  const [salvandoP, setSalvandoP] = useState(false);

  // medida / parâmetros
  const [data, setData] = useState(hojeISO());
  const [peso, setPeso] = useState('');
  const [treinos, setTreinos] = useState('4');
  const [sup, setSup] = useState('8');
  const [prot, setProt] = useState('2,2');
  const [gord, setGord] = useState('0,9');
  const [fator, setFator] = useState('1,55');
  const [salvandoM, setSalvandoM] = useState(false);

  // Preenche a medida com a mais recente.
  useEffect(() => {
    (async () => {
      try {
        const m = unwrap<Medida[]>(await supabase.from('medidas').select('*').order('data', { ascending: false }).limit(1));
        if (m[0]) {
          setPeso(toStr(m[0].peso_kg)); setTreinos(String(m[0].treinos_semana));
          setSup(toStr(Number((Number(m[0].superavit) * 100).toFixed(2))));
          setProt(toStr(m[0].proteina_g_kg)); setGord(toStr(m[0].gordura_g_kg)); setFator(toStr(m[0].fator_atividade));
        }
      } catch (e) { toastErro(e); }
    })();
  }, []);

  async function salvarPerfil(e: FormEvent) {
    e.preventDefault();
    const alt = parseNum(altura);
    if (altura && !(alt > 0)) { toast('Altura inválida.', 'erro'); return; }
    setSalvandoP(true);
    try {
      unwrap(await supabase.from('profiles').update({
        nome: nome.trim(), sexo: sexo || null, altura_cm: altura ? alt : null, data_nascimento: nasc || null,
      }).eq('id', session!.user.id));
      await refreshProfile();
      toast('Dados salvos.');
    } catch (err) { toastErro(err); } finally { setSalvandoP(false); }
  }

  function mudarTreinos(v: string) {
    setTreinos(v);
    const f = sugerirFator(parseNum(v));
    if (f) setFator(toStr(f));
  }

  const p = {
    peso: parseNum(peso), treinos: parseNum(treinos), sup: parseNum(sup) / 100,
    prot: parseNum(prot), gord: parseNum(gord), fator: parseNum(fator), alt: parseNum(altura),
  };
  const medidaOk = [p.peso, p.treinos, p.sup, p.prot, p.gord, p.fator].every((x) => Number.isFinite(x)) && p.peso > 0 && p.fator > 0;

  const previa = useMemo(() => {
    if (!medidaOk || !sexo || !(p.alt > 0) || !nasc || !data) return null;
    return calcMetas({
      sexo, pesoKg: p.peso, alturaCm: p.alt, idade: idadeEm(nasc, data),
      fator: p.fator, superavit: p.sup, protGkg: p.prot, gordGkg: p.gord,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medidaOk, sexo, altura, nasc, data, peso, sup, prot, gord, fator]);

  async function salvarMedida(e: FormEvent) {
    e.preventDefault();
    if (!medidaOk) { toast('Confira os números da medida.', 'erro'); return; }
    setSalvandoM(true);
    try {
      unwrap(await supabase.from('medidas').upsert({
        user_id: session!.user.id, data, peso_kg: p.peso, treinos_semana: Math.round(p.treinos),
        superavit: p.sup, proteina_g_kg: p.prot, gordura_g_kg: p.gord, fator_atividade: p.fator,
      }, { onConflict: 'user_id,data' }));
      toast('Medida registrada.');
    } catch (err) { toastErro(err); } finally { setSalvandoM(false); }
  }

  const faltaPerfil = !profile?.sexo || !profile.altura_cm || !profile.data_nascimento;

  return (
    <>
      <h1>Perfil</h1>

      <form className="card stack" onSubmit={salvarPerfil}>
        <h2>Dados pessoais</h2>
        {faltaPerfil && <p className="msg info">Preencha sexo, altura e data de nascimento para calcular suas metas.</p>}
        <Field label="Nome"><input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" /></Field>
        <div className="row2">
          <Field label="Sexo">
            <select value={sexo} onChange={(e) => setSexo(e.target.value as Sexo | '')}>
              <option value="">Selecione</option>
              <option>Masculino</option>
              <option>Feminino</option>
            </select>
          </Field>
          <Field label="Altura (cm)"><input inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} /></Field>
        </div>
        <Field label="Data de nascimento"><input type="date" value={nasc} onChange={(e) => setNasc(e.target.value)} max={hojeISO()} /></Field>
        <button className="btn" disabled={salvandoP}>{salvandoP ? 'Salvando…' : 'Salvar dados'}</button>
      </form>

      <form className="card stack" onSubmit={salvarMedida}>
        <h2>Peso e parâmetros</h2>
        <p className="muted small">Cada registro vale a partir da sua data. Suas metas dos dias seguintes usam o registro mais recente.</p>
        <div className="row2">
          <Field label="Data"><input type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} required /></Field>
          <Field label="Peso (kg)"><input inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} required /></Field>
        </div>
        <div className="row2">
          <Field label="Treinos / semana"><input inputMode="numeric" value={treinos} onChange={(e) => mudarTreinos(e.target.value)} /></Field>
          <Field label="Fator de atividade" hint="3, 4 e 5 treinos sugerem 1,45 / 1,55 / 1,65"><input inputMode="decimal" value={fator} onChange={(e) => setFator(e.target.value)} /></Field>
        </div>
        <div className="row3">
          <Field label="Superávit (%)"><input inputMode="decimal" value={sup} onChange={(e) => setSup(e.target.value)} /></Field>
          <Field label="Proteína g/kg"><input inputMode="decimal" value={prot} onChange={(e) => setProt(e.target.value)} /></Field>
          <Field label="Gordura g/kg"><input inputMode="decimal" value={gord} onChange={(e) => setGord(e.target.value)} /></Field>
        </div>

        {previa ? (
          <div className="preview">
            <h3>Suas metas</h3>
            <dl>
              <div><dt>TMB</dt><dd>{fmt(previa.tmb)} kcal</dd></div>
              <div><dt>Manutenção (GET)</dt><dd>{fmt(previa.get)} kcal</dd></div>
              <div className="hl"><dt>Meta do dia</dt><dd>{fmt(previa.kcal)} kcal</dd></div>
              <div><dt>Proteína</dt><dd>{fmt(previa.proteina)} g</dd></div>
              <div><dt>Carboidrato</dt><dd className={previa.carboidrato < 0 ? 'neg' : ''}>{fmt(previa.carboidrato)} g</dd></div>
              <div><dt>Gordura</dt><dd>{fmt(previa.gordura)} g</dd></div>
              <div><dt>IMC</dt><dd>{fmt(imc(p.peso, p.alt), 1)}</dd></div>
              <div><dt>Ganho semanal esperado</dt><dd>{fmt(ganhoSemanal(p.peso)[0], 2)} a {fmt(ganhoSemanal(p.peso)[1], 2)} kg</dd></div>
            </dl>
            {previa.carboidrato < 0 && <p className="msg erro">Proteína e gordura passam da meta de calorias. Reduza os g/kg.</p>}
            <p className="muted small">Estimativa baseada em Mifflin-St Jeor; não é prescrição. Revise o peso após 2–3 semanas.</p>
          </div>
        ) : (
          <p className="muted small">Preencha os dados pessoais e a medida para ver as metas.</p>
        )}
        <button className="btn primary" disabled={salvandoM}>{salvandoM ? 'Salvando…' : 'Registrar medida'}</button>
      </form>

      <section className="card stack">
        <h2>Conta</h2>
        <p className="muted small">{session?.user.email}{profile?.role === 'admin' ? ' · administrador' : ''}</p>
        {instalar.podeInstalar && <button className="btn" onClick={() => void instalar.instalar()}>Instalar app no celular</button>}
        {!instalar.podeInstalar && !instalar.instalado && (
          <p className="muted small">Para instalar: no Chrome, abra o menu ⋮ e toque em “Instalar app” (ou “Adicionar à tela inicial”).</p>
        )}
        <button className="btn" onClick={() => void signOut()}>Sair</button>
      </section>
    </>
  );
}
