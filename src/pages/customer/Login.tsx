import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sprout, Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, showToast, platformSettings } = useApp();

  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Customer: Google Sign-In ─────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      if (!fbUser) throw new Error('Google sign-in did not return a user.');

      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      let displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Customer';

      if (userSnap.exists()) {
        const data = userSnap.data();
        // Prevent a seller/admin account from logging in as customer here
        if (data.role === 'admin' || data.role === 'seller') {
          await signOut(auth);
          showToast(
            `This account is registered as a ${data.role}. Please use the correct login.`,
            'error'
          );
          setGoogleLoading(false);
          return;
        }
        displayName = data.name || displayName;
        // Refresh profile in Firestore (update name/avatar if changed in Google)
        await setDoc(userRef, {
          lastLoginAt: new Date().toISOString(),
          avatar: fbUser.photoURL || undefined,
        }, { merge: true });
      } else {
        // New customer — create Firestore profile
        await setDoc(userRef, {
          id: fbUser.uid,
          name: displayName,
          email: fbUser.email,
          role: 'customer',
          avatar: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }

      // Sign out from Firebase Auth session (session managed by AppContext)
      await signOut(auth);

      login(fbUser.email || '', 'customer', fbUser.uid, displayName);
      showToast(`Welcome, ${displayName}!`, 'success');
      navigate('/customer');
    } catch (error: any) {
      console.error('🔴 Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Sign-in cancelled.', 'info');
      } else if (error.code === 'auth/popup-blocked') {
        showToast('Popup was blocked. Please allow popups for this site.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        showToast('Network error. Check your internet connection.', 'error');
      } else {
        showToast(error.message || 'Google sign-in failed. Please try again.', 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };



  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-primary-50 to-neutral-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-md">
              <Sprout size={26} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome to {platformSettings.siteName}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-6">
          {/* Note for sellers */}
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-green-700 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">
              <strong>Seller?</strong> Use the{' '}
              <Link to="/seller-auth" className="underline font-semibold text-green-700 hover:text-green-900">
                Seller Portal
              </Link>{' '}
              to register or sign in to your nursery account.
            </p>
          </div>

          {/* ── Customer: Google Sign-In ── */}
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-300 text-neutral-700 font-semibold py-3 px-4 rounded-xl hover:bg-neutral-50 transition-colors mb-4 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin text-primary-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Your cart, orders, and complaints are saved automatically across sessions.
          </p>
        </div>

        <p className="text-center text-sm text-neutral-400 mt-5">
          <Link to="/" className="hover:text-primary-700 transition-colors">← Back to NurseryHub</Link>
        </p>
      </div>
    </div>
  );
}
