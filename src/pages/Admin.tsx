import { useState } from 'react';
import Alimentos from './admin/Alimentos';
import Opcoes from './admin/Opcoes';
import Refeicoes from './admin/Refeicoes';
import Usuarios from './admin/Usuarios';

const ABAS = [
  { id: 'opcoes', label: 'Opções' },
  { id: 'alimentos', label: 'Alimentos' },
  { id: 'refeicoes', label: 'Refeições' },
  { id: 'usuarios', label: 'Usuários' },
] as const;

export default function Admin() {
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('opcoes');
  return (
    <>
      <h1>Administração</h1>
      <div className="seg" role="tablist">
        {ABAS.map((a) => (
          <button key={a.id} role="tab" aria-selected={aba === a.id} className={aba === a.id ? 'on' : ''} onClick={() => setAba(a.id)}>
            {a.label}
          </button>
        ))}
      </div>
      {aba === 'opcoes' && <Opcoes />}
      {aba === 'alimentos' && <Alimentos />}
      {aba === 'refeicoes' && <Refeicoes />}
      {aba === 'usuarios' && <Usuarios />}
    </>
  );
}
