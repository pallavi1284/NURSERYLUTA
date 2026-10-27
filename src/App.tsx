import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/store/AppContext';
import { ToastContainer } from '@/components/ui/Toast';
import { CustomerNavbar } from '@/components/layout/CustomerNavbar';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CustomerDashboardLayout } from '@/components/layout/CustomerDashboardLayout';
import { useApp } from '@/store/AppContext';

// Customer pages
import { HomePage } from '@/pages/customer/Home';
import { PlantListingPage } from '@/pages/customer/PlantListing';
import { PlantDetailsPage } from '@/pages/customer/PlantDetails';
import { NurseryListingPage } from '@/pages/customer/NurseryListing';
import { NurseryDetailsPage } from '@/pages/customer/NurseryDetails';
import { CartPage } from '@/pages/customer/Cart';
import { CheckoutPage } from '@/pages/customer/Checkout';
import { OrderConfirmationPage } from '@/pages/customer/OrderConfirmation';
import { OrdersPage } from '@/pages/customer/Orders';
import { OrderTrackingPage } from '@/pages/customer/OrderTracking';
import { ProfilePage } from '@/pages/customer/Profile';
import { LoginPage } from '@/pages/customer/Login';
import { ComplaintsPage } from '@/pages/customer/Complaints';
import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboard';

// Seller pages
import { SellerDashboardPage } from '@/pages/seller/SellerDashboard';
import { MyNurseryPage } from '@/pages/seller/MyNursery';
import { InventoryPage } from '@/pages/seller/Inventory';
import { AddEditPlantPage } from '@/pages/seller/AddEditPlant';
import { SellerOrdersPage } from '@/pages/seller/SellerOrders';
import { SalesPage } from '@/pages/seller/Sales';
import { SellerComplaintsPage } from '@/pages/seller/SellerComplaints';
import { SellerAuthPage } from '@/pages/seller/SellerAuth';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminNurseriesPage } from '@/pages/admin/AdminNurseries';
import { AdminCustomersPage } from '@/pages/admin/AdminCustomers';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategories';
import { AdminOrdersPage } from '@/pages/admin/AdminOrders';
import { AdminPaymentsPage } from '@/pages/admin/AdminPayments';
import { AdminReportsPage } from '@/pages/admin/AdminReports';
import { AdminSettingsPage } from '@/pages/admin/AdminSettings';
import { AdminReviewsPage } from '@/pages/admin/AdminReviews';
import { AdminComplaintsPage } from '@/pages/admin/AdminComplaints';

// Icons
import { LayoutDashboard, Store, Package, PlusCircle, ClipboardList, BarChart3, User, Star, MessageSquare, Leaf, ShoppingCart, AlertCircle } from 'lucide-react';

// ─── Route Guards ─────────────────────────────────────────────────────────────

/** Protects routes that require authentication as a specific role */
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) {
    // Not logged in: redirect to appropriate auth page
    if (role === 'seller') return <Navigate to="/seller-auth" replace />;
    if (role === 'admin') return <Navigate to="/seller-auth" replace />;
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    // Wrong role: send them to their own dashboard or home
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/customer" replace />;
  }
  return <>{children}</>;
}

// ─── Nav definitions ──────────────────────────────────────────────────────────

const customerNav = [
  { to: '/customer', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/browse-plants', label: 'Browse Plants', icon: Leaf },
  { to: '/customer/browse-nurseries', label: 'Browse Nurseries', icon: Store },
  { to: '/customer/categories', label: 'Categories', icon: Package },
  { to: '/customer/my-cart', label: 'My Cart', icon: ShoppingCart },
  { to: '/customer/my-orders', label: 'My Orders', icon: ClipboardList },
  { to: '/customer/my-complaints', label: 'My Complaints', icon: AlertCircle },
  { to: '/customer/my-profile', label: 'My Profile', icon: User },
];

const sellerNav = [
  { to: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/seller/my-nursery', label: 'My Nursery', icon: Store },
  { to: '/seller/inventory', label: 'Inventory', icon: Package },
  { to: '/seller/inventory/add', label: 'Add Plant', icon: PlusCircle },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { to: '/seller/sales', label: 'Sales', icon: BarChart3 },
  { to: '/seller/complaints', label: 'Complaints', icon: MessageSquare },
];

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/nurseries', label: 'Nurseries', icon: Store },
  { to: '/admin/customers', label: 'Customers', icon: User },
  { to: '/admin/categories', label: 'Categories', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/payments', label: 'Payments', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: LayoutDashboard },
];

// ─── Layouts ──────────────────────────────────────────────────────────────────

function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <CustomerNavbar />
      <main className="flex-1">{children}</main>
      <CustomerFooter />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
      <Route path="/login" element={<CustomerLayout><LoginPage /></CustomerLayout>} />
      <Route path="/seller-auth" element={<SellerAuthPage />} />
      <Route path="/plants" element={<CustomerLayout><PlantListingPage /></CustomerLayout>} />
      <Route path="/plants/:id" element={<CustomerLayout><PlantDetailsPage /></CustomerLayout>} />
      <Route path="/nurseries" element={<CustomerLayout><NurseryListingPage /></CustomerLayout>} />
      <Route path="/nurseries/:id" element={<CustomerLayout><NurseryDetailsPage /></CustomerLayout>} />

      {/* Customer dashboard routes — require 'customer' role */}
      <Route
        path="/customer"
        element={
          <RequireRole role="customer">
            <CustomerDashboardLayout navItems={customerNav} title="Customer Dashboard" subtitle="Customer" badgeColor="bg-blue-100 text-blue-700" />
          </RequireRole>
        }
      >
        <Route index element={<CustomerDashboardPage />} />
        <Route path="browse-plants" element={<PlantListingPage />} />
        <Route path="browse-nurseries" element={<NurseryListingPage />} />
        <Route path="categories" element={<PlantListingPage />} />
        <Route path="my-cart" element={<CartPage />} />
        <Route path="my-orders" element={<OrdersPage />} />
        <Route path="my-orders/:id" element={<OrderTrackingPage />} />
        <Route path="my-complaints" element={<ComplaintsPage />} />
        <Route path="my-profile" element={<ProfilePage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirmation" element={<OrderConfirmationPage />} />
      </Route>

      {/* Seller routes — require 'seller' role */}
      <Route
        path="/seller"
        element={
          <RequireRole role="seller">
            <DashboardLayout navItems={sellerNav} title="Seller Dashboard" subtitle="Seller" badgeColor="bg-primary-100 text-primary-700" />
          </RequireRole>
        }
      >
        <Route index element={<SellerDashboardPage />} />
        <Route path="nursery" element={<MyNurseryPage />} />
        <Route path="my-nursery" element={<MyNurseryPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/add" element={<AddEditPlantPage />} />
        <Route path="inventory/:id" element={<AddEditPlantPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="complaints" element={<SellerComplaintsPage />} />
      </Route>

      {/* Admin routes — require 'admin' role */}
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <DashboardLayout navItems={adminNav} title="Admin Dashboard" subtitle="Admin" badgeColor="bg-purple-100 text-purple-700" />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="nurseries" element={<AdminNurseriesPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ToastContainer />
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
