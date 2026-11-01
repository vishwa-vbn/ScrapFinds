import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

export interface AdminAuthState {
  user: User | { uid: string; email: string | null; displayName: string | null } | null;
  loading: boolean;
  isAllowed: boolean;
  errorMessage: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

  const [user, setUser] = useState<AdminAuthState['user']>(() => {
    if (isMock) {
      const mockSaved = localStorage.getItem('sh:mock_admin_logged_in');
      return mockSaved === 'true'
        ? { uid: 'mock-admin-uid', email: 'owner@scrapfinds.local', displayName: 'Owner (Mock)' }
        : null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!isMock);
  const [isAllowed, setIsAllowed] = useState<boolean>(() => isMock && !!user);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) {
      setLoading(false);
      return;
    }

    // Capture redirect auth result if redirected on mobile
    getRedirectResult(auth).catch(err => {
      console.warn('[Admin Auth] getRedirectResult:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        setUser(null);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      console.info(`[Admin Auth] Signed in as ${currentUser.email} (UID: ${currentUser.uid})`);

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch('/api/whoami', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setUser(currentUser);
          setIsAllowed(true);
          setErrorMessage(null);
        } else if (
          currentUser.uid === 'hgSPBxuZM7PNGsfJKMz5Syd66dJ3' ||
          currentUser.email === 'vishwabnaik12@gmail.com'
        ) {
          console.info('[Admin Auth] Verified owner via credentials; Firestore rules enforce operations.');
          setUser(currentUser);
          setIsAllowed(true);
          setErrorMessage(null);
        } else {
          await signOut(auth);
          setUser(null);
          setIsAllowed(false);
          setErrorMessage(
            `Account (${currentUser.email}) is not authorized. Set ADMIN_UID=${currentUser.uid} in Vercel and update firestore.rules.`
          );
        }
      } catch (err) {
        console.error('Admin verification probe error:', err);
        // Fall back to trusting signed-in state (Firestore rules enforce operations)
        setUser(currentUser);
        setIsAllowed(true);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isMock]);

  const signIn = useCallback(async () => {
    setErrorMessage(null);
    if (isMock) {
      const mockUser = {
        uid: 'mock-admin-uid',
        email: 'owner@scrapfinds.local',
        displayName: 'Owner (Mock)',
      };
      localStorage.setItem('sh:mock_admin_logged_in', 'true');
      setUser(mockUser);
      setIsAllowed(true);
      navigate('/admin/items', { replace: true });
      return;
    }

    try {
      setLoading(true);
      // Direct call preserves browser user-gesture stack, preventing popup blockers
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Sign-in error:', error);
      if (error?.code === 'auth/popup-blocked') {
        console.warn('Popup was blocked by browser, falling back to signInWithRedirect');
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setErrorMessage((redirectErr as Error).message);
        }
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(error?.message || 'Failed to sign in with Google');
      }
      setLoading(false);
    }
  }, [isMock, navigate]);

  const signOutUser = useCallback(async () => {
    setLoading(true);
    if (isMock) {
      localStorage.removeItem('sh:mock_admin_logged_in');
      setUser(null);
      setIsAllowed(false);
      setLoading(false);
      navigate('/admin', { replace: true });
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      setIsAllowed(false);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
      // Immediately navigate without requiring a page refresh
      navigate('/admin', { replace: true });
    }
  }, [isMock, navigate]);

  const getIdToken = useCallback(async (): Promise<string> => {
    if (isMock) return 'mock-token';
    if (!user || !('getIdToken' in user)) return '';
    return await user.getIdToken();
  }, [isMock, user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAllowed,
      errorMessage,
      signIn,
      signOutUser,
      getIdToken,
    }),
    [user, loading, isAllowed, errorMessage, signIn, signOutUser, getIdToken]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children || <Outlet />}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}

