import { NavLink, Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { ROLE_HOME, ROLE_LABEL } from '../format';
import { Loading } from './ui';

export function RequireAuth() {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Loading />;
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}
export const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  return user.role === role ? children : <Navigate to={ROLE_HOME[user.role]} replace />;
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const links = [[ROLE_HOME[user.role], 'Dashboard'], ['/app/movies', 'Explorer'], ['/app/compare', 'Compare'], ['/app/insights', 'Insights'], ['/app/risk', 'Risk Explorer'], ['/app/profile', 'Profile']];
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-ink via-ink to-[#1a1a1a]">
      <header className="sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-gold/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/" className="font-serif text-2xl text-gold" style={{ textShadow: '0 0 10px rgba(240,192,64,.5)' }}>Second<span className="text-paper">Take</span></Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 flex-1" aria-label="Main">
            {links.map(([to, label]) => <NavLink key={to} to={to} end={to !== '/app/movies'} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted hidden sm:inline">{user.name} · <span className="text-gold">{ROLE_LABEL[user.role]}</span></span>
            <button className="btn-ghost" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>
      <main key={loc.pathname} className="page-enter flex-1 max-w-7xl w-full mx-auto px-4 py-8"><Outlet /></main>
      <footer className="bg-ink py-6 text-center text-sm text-muted border-t border-[#222]">
        <h3 className="text-gold font-bold mb-1">SecondTake</h3>
        <p>A smarter look before the final decision · Prototype data is partly illustrative — verify before citing.</p>
      </footer>
    </div>
  );
}
