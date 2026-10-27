import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sprout, Store, Shield, ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useApp } from '@/store/AppContext';

type AuthMode = 'role-select' | 'login' | 'register' | 'admin-login';
type UserRole = 'seller' | 'admin';

const AUTHORIZED_ADMIN_EMAIL = 'pallavigaikwad1506@gmail.com';

export function SellerAuthPage() {
  const navigate = useNavigate();
  const { login, showToast, nurseries } = useApp();

  const [mode, setMode] = useState<AuthMode>('role-select');
  const [userRole, setUserRole] = useState<UserRole>('seller');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Please enter your full name', 'error'); return; }
    if (!email.trim()) { showToast('Please enter your email address', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }

    setLoading(true);
    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Update display name
      await updateProfile(fbUser, { displayName: name });

      // Save seller profile to Firestore users collection
      const userProfile = {
        id: fbUser.uid,
        name: name.trim(),
        email: fbUser.email || email,
        role: 'seller',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', fbUser.uid), userProfile);

      // Sign out from Firebase Auth (we manage session via AppContext)
      await signOut(auth);

      // Log the user in locally
      login(fbUser.email || email, 'seller', fbUser.uid, name.trim());

      showToast('Seller account created! You can now register your nursery.', 'success');
      navigate('/seller/my-nursery');
    } catch (error: any) {
      console.error('🔴 Seller registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        showToast('An account with this email already exists. Please sign in instead.', 'error');
        setMode('login');
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'error');
      } else if (error.code === 'auth/weak-password') {
        showToast('Password is too weak. Use at least 6 characters.', 'error');
      } else {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { showToast('Please enter your email and password', 'error'); return; }

    setLoading(true);
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Fetch seller profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

      let sellerName = fbUser.displayName || email.split('@')[0];
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Ensure this is actually a seller account
        if (data.role !== 'seller') {
          await signOut(auth);
          showToast('This account is not a seller account. Please use the correct login page.', 'error');
          setLoading(false);
          return;
        }
        sellerName = data.name || sellerName;
      } else {
        // Profile doesn't exist yet — create it (migration path)
        const userProfile = {
          id: fbUser.uid,
          name: sellerName,
          email: fbUser.email || email,
          role: 'seller',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      }

      // Sign out from Firebase Auth (we manage session via AppContext)
      await signOut(auth);

      // Log the user in locally
      login(fbUser.email || email, 'seller', fbUser.uid, sellerName);

      showToast(`Welcome back, ${sellerName}!`, 'success');

      // Check if this seller already has a nursery
      const sellerNursery = nurseries.find(n => n.sellerUID === fbUser.uid);
      if (sellerNursery) {
        if (sellerNursery.status === 'approved') {
          navigate('/seller');
        } else {
          // Pending or rejected — go to My Nursery page to see status
          navigate('/seller/my-nursery');
        }
      } else {
        // No nursery yet — go to My Nursery to register one
        navigate('/seller/my-nursery');
      }
    } catch (error: any) {
      console.error('🔴 Seller login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        showToast('No seller account found with this email. Please register first.', 'error');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showToast('Incorrect password. Please try again.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        showToast('Network error. Please check your connection and try again.', 'error');
      } else {
        showToast(error.message || 'Login failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { 
      showToast('Please enter your email and password', 'error'); 
      return; 
    }

    // Step 1: Client-side email guard (NOT the security boundary — Firestore rules enforce it)
    if (email.trim().toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      showToast(
        'Unauthorized: This email is not permitted Admin access.',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // Step 2: Authenticate via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // Step 3: Verify in Firestore that this user has the 'admin' role
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || userSnap.data().role !== 'admin') {
        await signOut(auth);
        showToast('Admin access denied. Your account does not have admin privileges.', 'error');
        setLoading(false);
        return;
      }

      const adminName = userSnap.data().name || 'Admin';

      // Sign out from Firebase Auth session (session managed by AppContext)
      await signOut(auth);

      login(fbUser.email || email, 'admin', fbUser.uid, adminName);
      showToast('Welcome, Admin!', 'success');
      navigate('/admin');
    } catch (error: any) {
      console.error('🔴 Admin login error:', error);
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showToast('Invalid email or password.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
      } else {
        showToast(error.message || 'Admin sign-in failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-primary-50 via-white to-green-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-md">
              <Sprout size={26} className="text-white" />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            {userRole === 'seller' ? (
              <>
                <Store size={20} className="text-primary-600" />
                <h1 className="text-2xl font-bold text-neutral-900">Seller Portal</h1>
              </>
            ) : (
              <>
                <Shield size={20} className="text-neutral-900" />
                <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
              </>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            {mode === 'role-select'
              ? 'Select your role to continue'
              : userRole === 'seller'
              ? mode === 'login'
                ? 'Sign in to your seller account to manage your nursery'
                : 'Create a seller account to start selling plants'
              : 'Sign in to admin account to manage the platform'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-7">
          {/* Role Selection Screen */}
          {mode === 'role-select' && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 mb-4">Choose your role:</p>
              
              {/* Seller Option */}
              <button
                onClick={() => {
                  setUserRole('seller');
                  setMode('login');
                  setEmail('');
                  setPassword('');
                  setName('');
                  setConfirmPassword('');
                }}
                className="w-full p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Store size={20} className="text-primary-600" />
                  <div>
                    <p className="font-semibold text-neutral-900">Seller</p>
                    <p className="text-xs text-neutral-500">Manage your nursery and sell plants</p>
                  </div>
                </div>
              </button>

              {/* Admin Option */}
              <button
                onClick={() => {
                  setUserRole('admin');
                  setMode('admin-login');
                  setEmail('');
                  setPassword('');
                  setName('');
                  setConfirmPassword('');
                }}
                className="w-full p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-neutral-600" />
                  <div>
                    <p className="font-semibold text-neutral-900">Admin</p>
                    <p className="text-xs text-neutral-500">Manage the platform and users</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Seller Mode: Mode Toggle & Forms */}
          {userRole === 'seller' && mode !== 'role-select' && (
            <>
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-neutral-100 p-1 mb-6">
                <button
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'login' ? 'bg-white shadow text-primary-700' : 'text-neutral-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'register' ? 'bg-white shadow text-primary-700' : 'text-neutral-500'
                  }`}
                >
                  Register
                </button>
              </div>

              {mode === 'login' ? (
                /* ----- LOGIN FORM ----- */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    {loading ? 'Signing In...' : 'Sign In as Seller'}
                  </button>

                  <p className="text-center text-sm text-neutral-500 pt-1">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-primary-700 font-semibold hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                </form>
              ) : (
                /* ----- REGISTER FORM ----- */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Password <span className="text-neutral-400 text-xs">(min 6 chars)</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        minLength={6}
                        className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-neutral-300 focus:border-primary-500'
                        }`}
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Passwords do not match
                      </p>
                    )}
                  </div>

                  {/* Info box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      After registration, you'll need to register your nursery and wait for <strong>Admin approval</strong> before you can start selling.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!!confirmPassword && password !== confirmPassword)}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
                    {loading ? 'Creating Account...' : 'Create Seller Account'}
                  </button>

                  <p className="text-center text-sm text-neutral-500 pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-primary-700 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}

              {/* Back to Role Selection */}
              <button
                onClick={() => setMode('role-select')}
                className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-4 py-2"
              >
                ← Choose a different role
              </button>
            </>
          )}

          {/* Admin Login Form */}
          {userRole === 'admin' && mode === 'admin-login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-start gap-2 mb-4">
                <Shield size={16} className="text-neutral-600 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-700">
                  Admin access is restricted to authorized personnel only.
                  Unauthorized attempts are logged.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="admin-signin-btn"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Shield size={18} />
                )}
                {loading ? 'Verifying...' : 'Sign In as Admin'}
              </button>

              {/* Back to Role Selection */}
              <button
                onClick={() => setMode('role-select')}
                className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-4 py-2"
              >
                ← Choose a different role
              </button>
            </form>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center text-sm text-neutral-400 mt-5">
          <Link to="/" className="hover:text-primary-700 transition-colors">← Back to NurseryHub</Link>
        </p>
      </div>
    </div>
  );
}
