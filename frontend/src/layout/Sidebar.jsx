import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Search,
  Upload,
  BrainCircuit,
  BarChart2,
  GitCompare,
  Info,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { to: '/',              label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/detect',        label: 'Detect Review',   icon: Search,          end: false },
  { to: '/bulk',          label: 'Bulk Detection',  icon: Upload,          end: false },
  { to: '/explainability',label: 'Explainable AI',  icon: BrainCircuit,    end: false },
  { to: '/reports',       label: 'Reports',         icon: BarChart2,       end: false },
  { to: '/models',        label: 'Model Comparison',icon: GitCompare,      end: false },
  { to: '/about',         label: 'About Project',   icon: Info,            end: false },
];

function LogoMark({ size = 28 }) {
  const gradientId = 'tl-shield-grad';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3A78F2" />
          <stop offset="1" stopColor="#74A6FF" />
        </linearGradient>
      </defs>
      <ShieldCheck
        size={size}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: 'block' }}
      />
    </svg>
  );
}

function SidebarNavLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium',
          'transition-all duration-200 ease-out motion-safe:transition-all',
          isActive
            ? 'text-tl-accent bg-tl-accent-bg font-semibold'
            : 'text-tl-sidebar hover:bg-tl-fill',
        ].join(' ')
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarNavLinkMobile({ to, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex items-center justify-center w-10 h-10 rounded-[10px]',
          'transition-all duration-200 ease-out motion-safe:transition-all',
          isActive
            ? 'text-tl-accent bg-tl-accent-bg'
            : 'text-tl-sidebar hover:bg-tl-fill',
        ].join(' ')
      }
    >
      <Icon size={20} />
    </NavLink>
  );
}

function UserInfo() {
  const auth = JSON.parse(localStorage.getItem('tl_auth') || '{}');
  const initials = (auth.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3A78F2] to-[#74A6FF] text-white text-xs font-bold flex items-center justify-center shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-tl-text truncate">{auth.name || 'User'}</p>
        <p className="text-[10px] text-tl-muted truncate">{auth.email || ''}</p>
      </div>
    </div>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('tl_auth');
    navigate('/login', { replace: true });
  };
  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-sm font-medium text-tl-sidebar hover:bg-tl-fake-bg hover:text-tl-fake transition-all duration-200 ease-out w-full"
    >
      <LogOut size={18} />
      <span>Sign Out</span>
    </button>
  );
}

function LogoutButtonMobile() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('tl_auth');
    navigate('/login', { replace: true });
  };
  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center w-10 h-10 rounded-[10px] text-tl-sidebar hover:bg-tl-fake-bg hover:text-tl-fake transition-all duration-200 ease-out"
      aria-label="Sign out"
    >
      <LogOut size={20} />
    </button>
  );
}

export default function Sidebar() {
  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-tl-card border-r border-tl-border z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <LogoMark size={28} />
          <span className="text-lg font-bold text-tl-text tracking-tight">TrustLens</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-3 mt-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <SidebarNavLink key={item.to} {...item} />
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="px-3 pb-2 space-y-1 border-t border-tl-border pt-2">
          <UserInfo />
          <LogoutButton />
        </div>
        <div className="px-5 py-3 border-t border-tl-border">
          <p className="text-[11px] text-tl-muted tracking-wide">© 2026 TrustLens</p>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-tl-card border-b border-tl-border sticky top-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="text-base font-bold text-tl-text tracking-tight">TrustLens</span>
        </div>

        {/* Icon-only nav links + Logout */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {menuItems.map((item) => (
            <SidebarNavLinkMobile key={item.to} to={item.to} icon={item.icon} end={item.end} />
          ))}
          <LogoutButtonMobile />
        </nav>
      </header>
    </>
  );
}
