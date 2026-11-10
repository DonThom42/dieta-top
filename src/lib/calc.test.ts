import { describe, expect, it } from 'vitest';
import { addDias, calcMetas, fmtSinal, idadeEm, parseNum, situacao, sugerirFator } from './calc';

describe('calcMetas (valores da aba Resumo da planilha)', () => {
  const m = calcMetas({
    sexo: 'Masculino', pesoKg: 83.55, alturaCm: 180, idade: 26,
    fator: 1.55, superavit: 0.08, protGkg: 2.2, gordGkg: 0.9,
  });
  it('TMB e GET', () => {
    expect(m.tmb).toBeCloseTo(1835.5, 1);
    expect(m.get).toBeCloseTo(2845.03, 1);
  });
  it('meta de kcal e macros', () => {
    expect(m.kcal).toBeCloseTo(3072.63, 1);
    expect(m.proteina).toBeCloseTo(183.81, 2);
    expect(m.gordura).toBeCloseTo(75.195, 2);
    expect(m.carboidrato).toBeCloseTo(415.16, 1);
  });
  it('as calorias dos macros fecham a meta', () => {
    expect(m.proteina * 4 + m.carboidrato * 4 + m.gordura * 9).toBeCloseTo(m.kcal, 6);
  });
  it('feminino usa -161', () => {
    const f = calcMetas({ sexo: 'Feminino', pesoKg: 60, alturaCm: 165, idade: 30, fator: 1.45, superavit: 0, protGkg: 2, gordGkg: 0.9 });
    expect(f.tmb).toBeCloseTo(10 * 60 + 6.25 * 165 - 150 - 161, 6);
  });
});

describe('fator de atividade', () => {
  it('3, 4 e 5 treinos', () => {
    expect(sugerirFator(3)).toBe(1.45);
    expect(sugerirFator(4)).toBe(1.55);
    expect(sugerirFator(5)).toBe(1.65);
    expect(sugerirFator(6)).toBeNull();
  });
});

describe('situação do dia', () => {
  it('±5% fecha a meta', () => {
    expect(situacao(2982, 3073)).toBe('ok'); // -3%
    expect(situacao(3273, 3073)).toBe('acima'); // +6,5%
    expect(situacao(2800, 3073)).toBe('abaixo'); // -8,9%
  });
});

describe('datas e números', () => {
  it('idade considera o aniversário', () => {
    expect(idadeEm('2000-11-11', '2026-11-10')).toBe(25);
    expect(idadeEm('2000-11-10', '2026-11-10')).toBe(26);
  });
  it('addDias atravessa o mês', () => {
    expect(addDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDias('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('parseNum aceita vírgula', () => {
    expect(parseNum('83,5')).toBe(83.5);
    expect(parseNum(' 2.2 ')).toBe(2.2);
    expect(parseNum('')).toBeNaN();
  });
  it('fmtSinal', () => {
    expect(fmtSinal(200)).toBe('+200');
    expect(fmtSinal(-91)).toBe('−91');
    expect(fmtSinal(0.2)).toBe('0');
  });
});
