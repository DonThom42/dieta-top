import { useState, type FormEvent } from 'react';
import { emailLink, supabase } from '../lib/supabase';
import { Field } from '../components/ui';

function traduz(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'E-mail ainda não confirmado. Peça ao administrador para confirmar o seu usuário.';
  if (/rate limit|too many/i.test(msg)) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Sem conexão com a internet.';
  return msg;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(emailLink.erro ? `Link inválido ou expirado. Peça um novo convite ou use "Esqueci a senha".` : null);
  const [info, setInfo] = useState<string | null>(null);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErro(null); setInfo(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) setErro(traduz(error.message));
    setBusy(false);
  }

  async function esqueci() {
    if (!email.trim()) { setErro('Digite o seu e-mail acima e toque em "Esqueci a senha" de novo.'); return; }
    setBusy(true); setErro(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (error) setErro(traduz(error.message));
    else setInfo('Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.');
  }

  return (
    <div className="auth">
      <img src="/icons/icon-192.png" alt="" width={72} height={72} className="auth-logo" />
      <h1>Dieta</h1>
      <p className="muted">Entre com o e-mail e a senha cadastrados.</p>
      <form onSubmit={entrar} className="stack">
        <Field label="E-mail">
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Field>
        {erro && <p className="msg erro" role="alert">{erro}</p>}
        {info && <p className="msg ok">{info}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <button type="button" className="btn link" onClick={esqueci} disabled={busy}>Esqueci a senha</button>
      </form>
    </div>
  );
}
