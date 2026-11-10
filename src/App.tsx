import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Spinner } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import Hoje from './pages/Hoje';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';

function Gate() {
  const { session, profile, profileError, loading, needsPassword, signOut } = useAuth();
  if (loading) return <div className="splash"><Spinner /></div>;
  if (!session) return <Login />;
  if (needsPassword) return <SetPassword />;
  if (!profile) {
    return (
      <div className="auth">
        <h1>Não foi possível abrir o perfil</h1>
        <p className="msg erro">{profileError}</p>
        <button className="btn" onClick={() => void signOut()}>Sair</button>
      </div>
    );
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Hoje />} />
        <Route path="historico" element={<Historico />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="admin" element={profile.role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
