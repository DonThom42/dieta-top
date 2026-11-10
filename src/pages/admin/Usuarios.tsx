import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { unwrap } from '../../lib/data';
import { toast, toastErro } from '../../lib/toast';
import type { Profile, Role } from '../../lib/types';
import { Spinner } from '../../components/ui';

export default function Usuarios() {
  const { session } = useAuth();
  const [lista, setLista] = useState<Profile[] | null>(null);

  async function carregar() {
    try { setLista(unwrap<Profile[]>(await supabase.from('profiles').select('*').order('nome'))); } catch (e) { toastErro(e); setLista([]); }
  }
  useEffect(() => { void carregar(); }, []);

  async function mudarPapel(p: Profile, role: Role) {
    try {
      unwrap(await supabase.from('profiles').update({ role }).eq('id', p.id));
      toast('Papel atualizado.');
      await carregar();
    } catch (e) { toastErro(e); }
  }

  if (!lista) return <Spinner />;
  return (
    <>
      <p className="muted small">
        Para convidar alguém, use Authentication → Users no painel do Supabase. A pessoa aparece aqui depois do primeiro acesso. O administrador não vê os dados pessoais (peso, dias) dos outros usuários.
      </p>
      <ul className="list card">
        {lista.map((p) => (
          <li key={p.id} className="editrow">
            <span>{p.nome || '(sem nome)'}{p.id === session?.user.id ? <small className="muted"> · você</small> : null}</span>
            <select
              value={p.role} aria-label={`Papel de ${p.nome}`} disabled={p.id === session?.user.id}
              onChange={(e) => void mudarPapel(p, e.target.value as Role)}
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </li>
        ))}
      </ul>
    </>
  );
}
