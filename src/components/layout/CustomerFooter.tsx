import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { useApp } from '@/store/AppContext';

export function CustomerFooter() {
  const { plants, platformSettings } = useApp();

  // Build categories from actual plant data
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(plants.map(p => p.categoryId).filter(Boolean)));
    return uniqueCategories.slice(0, 6); // Show up to 6 categories
  }, [plants]);

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Sprout size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">{platformSettings.siteName}</span>
            </Link>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              India's multi-vendor marketplace for nursery plants and trees. Compare prices from multiple nurseries and get plants delivered to your door.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-primary-600 flex items-center justify-center transition-colors"><Facebook size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-primary-600 flex items-center justify-center transition-colors"><Instagram size={16} /></a>
              <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-primary-600 flex items-center justify-center transition-colors"><Twitter size={16} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat}>
                    <Link to={`/plants?category=${cat}`} className="text-sm text-neutral-400 hover:text-primary-400 transition-colors capitalize">
                      {cat}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-neutral-500">No categories yet</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/plants" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">All Plants</Link></li>
              <li><Link to="/nurseries" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">Nurseries</Link></li>
              <li><Link to="/customer/my-orders" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">Track Orders</Link></li>
              <li><Link to="/customer/my-cart" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">Cart</Link></li>
              <li><Link to="/login" className="text-sm text-neutral-400 hover:text-primary-400 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              {platformSettings.address && (
                <li className="flex items-start gap-3 text-sm text-neutral-400">
                  <MapPin size={16} className="shrink-0 mt-0.5" /> {platformSettings.address}
                </li>
              )}
              {platformSettings.contactPhone && (
                <li className="flex items-center gap-3 text-sm text-neutral-400">
                  <Phone size={16} className="shrink-0" /> {platformSettings.contactPhone}
                </li>
              )}
              {platformSettings.supportEmail && (
                <li className="flex items-center gap-3 text-sm text-neutral-400">
                  <Mail size={16} className="shrink-0" /> {platformSettings.supportEmail}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">© 2024 {platformSettings.siteName}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-300">Privacy Policy</a>
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-300">Terms of Service</a>
            <a href="#" className="text-xs text-neutral-500 hover:text-neutral-300">Seller Agreement</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
