import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole, Settings } from './types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: Settings | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as Settings);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Default role is client, except for the specific admin email
            const role: UserRole = firebaseUser.email === 'digitalsoutien@gmail.com' ? 'admin' : 'client';
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role,
              displayName: firebaseUser.displayName || 'User',
              photoURL: firebaseUser.photoURL || '',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubSettings();
    };
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.warn('Login popup request was cancelled by a newer request.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Login popup was closed by the user.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error("Erreur réseau : Vérifiez votre connexion ou assurez-vous que les domaines sont autorisés dans la console Firebase.");
        console.error('Network request failed. This often means the current domain is not allowlisted in Firebase Console > Authentication > Settings > Authorized domains.');
      } else {
        console.error('Login error:', error);
        toast.error("Erreur lors de la connexion. Veuillez réessayer.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Force refresh and redirect to home to clear all states
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (settings?.faviconUrl || settings?.logoUrl) {
      const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = settings.faviconUrl || settings.logoUrl || '';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings]);

  return (
    <AuthContext.Provider value={{ user, profile, settings, loading, isLoggingIn, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
