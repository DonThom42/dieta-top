import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from '../lib/toast';
import { Field } from '../components/ui';

/** Aparece quando a pessoa chega por um link de convite ou de recuperação de senha. */
export default function SetPassword() {
  const { finishPassword, signOut } = useAuth();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (a.length < 6) { setErro('Use pelo menos 6 caracteres.'); return; }
    if (a !== b) { setErro('As senhas não conferem.'); return; }
    setBusy(true); setErro(null);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);
    if (error) { setErro(error.message); return; }
    toast('Senha definida!');
    finishPassword();
  }

  return (
    <div className="auth">
      <h1>Crie sua senha</h1>
      <p className="muted">Defina a senha que você vai usar para entrar no app.</p>
      <form onSubmit={salvar} className="stack">
        <Field label="Nova senha">
          <input type="password" autoComplete="new-password" required value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        <Field label="Repita a senha">
          <input type="password" autoComplete="new-password" required value={b} onChange={(e) => setB(e.target.value)} />
        </Field>
        {erro && <p className="msg erro" role="alert">{erro}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha'}</button>
        <button type="button" className="btn link" onClick={() => void signOut()}>Cancelar</button>
      </form>
    </div>
  );
}
