import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Sprout, LogOut, Menu, X, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/store/ThemeContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  title: string;
  subtitle: string;
  badgeColor: string;
}

export function DashboardLayout({ navItems, title, subtitle, badgeColor }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, showToast, platformSettings } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
    showToast('Logged out successfully');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === navItems[0].to) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-neutral-900 text-neutral-300 flex flex-col shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold font-display text-white">{platformSettings.siteName}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-neutral-800">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor} mb-2`}>
            {subtitle}
          </span>
          <p className="text-sm font-medium text-white">{user?.name || 'Guest'}</p>
          <p className="text-xs text-neutral-500">{user?.email || 'Not signed in'}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-800">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all mb-1"
          >
            <Sprout size={18} />
            Back to Store
          </Link>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:bg-red-600/20 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200">
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors" title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="relative w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-500" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <ChevronDown size={16} className="text-neutral-400 hidden sm:block" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
