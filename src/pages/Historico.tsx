import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { unwrap } from '../lib/data';
import { addDias, dataCurta, fmt, fmtSinal, hojeISO, num, situacao } from '../lib/calc';
import { toastErro } from '../lib/toast';
import type { Dia, Medida } from '../lib/types';
import { Spinner } from '../components/ui';

function PesoChart({ pontos }: { pontos: { data: string; peso: number }[] }) {
  if (pontos.length < 2) return <p className="muted">Registre o peso em pelo menos duas datas (em Perfil) para ver o gráfico.</p>;
  const W = 320, H = 150, px = 34, py = 18;
  const pesos = pontos.map((p) => p.peso);
  const min = Math.min(...pesos) - 0.5, max = Math.max(...pesos) + 0.5;
  const t0 = new Date(pontos[0].data).getTime(), t1 = new Date(pontos[pontos.length - 1].data).getTime();
  const x = (d: string) => px + ((new Date(d).getTime() - t0) / Math.max(t1 - t0, 1)) * (W - px - 12);
  const y = (v: number) => H - py - ((v - min) / (max - min)) * (H - 2 * py);
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(p.data).toFixed(1)} ${y(p.peso).toFixed(1)}`).join(' ');
  const ult = pontos[pontos.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`Peso de ${fmt(pontos[0].peso, 1)} a ${fmt(ult.peso, 1)} kg`}>
      {[min, (min + max) / 2, max].map((v, i) => (
        <g key={i}>
          <line x1={px} x2={W - 8} y1={y(v)} y2={y(v)} className="grid" />
          <text x={px - 4} y={y(v) + 3} textAnchor="end" className="axis">{fmt(v, 1)}</text>
        </g>
      ))}
      <path d={linha} className="line" />
      {pontos.map((p) => <circle key={p.data} cx={x(p.data)} cy={y(p.peso)} r={3} className="dot" />)}
      <text x={x(ult.data)} y={y(ult.peso) - 8} textAnchor="end" className="axis strong">{fmt(ult.peso, 1)} kg</text>
      <text x={px} y={H - 2} className="axis">{dataCurta(pontos[0].data)}</text>
      <text x={W - 8} y={H - 2} textAnchor="end" className="axis">{dataCurta(ult.data)}</text>
    </svg>
  );
}

export default function Historico() {
  const [medidas, setMedidas] = useState<Medida[] | null>(null);
  const [dias, setDias] = useState<Dia[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, d] = await Promise.all([
          supabase.from('medidas').select('*').order('data'),
          supabase.from('dias').select('*').order('data', { ascending: false }).limit(60),
        ]);
        setMedidas(unwrap<Medida[]>(m));
        setDias(unwrap<Dia[]>(d));
      } catch (e) {
        toastErro(e);
        setMedidas([]); setDias([]);
      }
    })();
  }, []);

  if (!medidas || !dias) return <Spinner />;

  const hoje = hojeISO();
  const inicio7 = addDias(hoje, -6);
  const ultimos7 = dias.filter((d) => d.data >= inicio7 && d.data <= hoje);
  const fechou = ultimos7.filter((d) => situacao(num(d.total_kcal), num(d.meta_kcal)) === 'ok').length;
  const media = ultimos7.length ? ultimos7.reduce((s, d) => s + num(d.total_kcal), 0) / ultimos7.length : 0;

  return (
    <>
      <h1>Histórico</h1>

      <section className="card">
        <h2>Últimos 7 dias</h2>
        {ultimos7.length === 0 ? (
          <p className="muted">Nenhum dia salvo nos últimos 7 dias.</p>
        ) : (
          <div className="stats">
            <div><b>{fechou}/{ultimos7.length}</b><span className="muted">dias dentro da meta (±5%)</span></div>
            <div><b>{fmt(media)}</b><span className="muted">kcal por dia, em média</span></div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Peso</h2>
        <PesoChart pontos={medidas.map((m) => ({ data: m.data, peso: num(m.peso_kg) }))} />
      </section>

      <section className="card">
        <h2>Dias salvos</h2>
        {dias.length === 0 && <p className="muted">Quando você salvar um dia na tela Hoje, ele aparece aqui.</p>}
        <ul className="daylist">
          {dias.map((d) => {
            const sit = situacao(num(d.total_kcal), num(d.meta_kcal));
            return (
              <li key={d.id}>
                <Link to={d.data === hoje ? '/' : `/?d=${d.data}`} className="dayrow">
                  <span className="dayrow-date">{dataCurta(d.data)}</span>
                  <span className="dayrow-kcal">{fmt(d.total_kcal)} <small className="muted">/ {fmt(d.meta_kcal)} kcal</small></span>
                  <span className={`chip ${sit}`}>{fmtSinal(num(d.total_kcal) - num(d.meta_kcal))}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
