import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Search, ShoppingCart, User as UserIcon, Menu, X, Sun, Moon } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { useTheme } from '@/store/ThemeContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function CustomerNavbar() {
  const navigate = useNavigate();
  const { cartCount, user, logout, showToast, platformSettings } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/plants?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    showToast('Logged out successfully');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/plants', label: 'All Plants' },
    { to: '/nurseries', label: 'Nurseries' },
    { to: '/customer/my-orders', label: 'My Orders' },
    { to: '/customer/my-complaints', label: 'Complaints' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Sprout size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold font-display text-neutral-900 dark:text-neutral-100">{platformSettings.siteName}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for plants, trees, seeds..."
                className="w-full rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-11 pr-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-neutral-800 focus:border-primary-500 transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link
              to="/customer/my-cart"
              className="relative w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/customer/my-profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 px-2">Logout</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {/* Profile button — opens Seller portal */}
                <Link
                  to="/seller-auth"
                  id="profile-btn"
                  className="flex items-center gap-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                >
                  <UserIcon size={16} />
                  Profile
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-slide-up">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plants..."
                className="w-full rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-11 pr-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/customer/my-profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">Profile</Link>
                <button onClick={() => setShowLogoutConfirm(true)} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Logout</button>
              </>
            ) : (
              <>
                <Link to="/seller-auth" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-neutral-300 dark:border-neutral-600 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <UserIcon size={15} /> Profile
                </Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block bg-primary-600 text-white text-center px-4 py-2.5 rounded-lg text-sm font-semibold">Sign In</Link>
              </>
            )}
          </div>
        </div>
      )}

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
    </header>
  );
}
