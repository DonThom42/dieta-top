import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Toaster } from '../lib/toast';
import { Icon } from './ui';

export default function Layout() {
  const { profile } = useAuth();
  const abas = [
    { to: '/', label: 'Hoje', icon: 'hoje', end: true },
    { to: '/historico', label: 'Histórico', icon: 'historico' },
    { to: '/perfil', label: 'Perfil', icon: 'perfil' },
    ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: 'admin' }] : []),
  ];
  return (
    <div className="shell">
      <main className="page">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Principal">
        {abas.map((a) => (
          <NavLink key={a.to} to={a.to} end={a.end} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            <Icon name={a.icon} />
            <span>{a.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toaster />
    </div>
  );
}
