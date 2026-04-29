import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot, collection, serverTimestamp, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  toggleFavorite: (itemId: string, itemName: string) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);

  // Load local favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('guest_favorites');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setLocalFavorites(ids);
        if (!user) {
          setFavoriteIds(new Set(ids));
        }
      } catch (e) {
        console.error("Failed to parse local favorites", e);
      }
    }
  }, []);

  // Synchronize with Firestore when user is logged in
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set(localFavorites));
      return;
    }

    // Subscribe to Firestore favorites
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'favorites'), (snap) => {
      const ids = snap.docs.map(d => d.id);
      setFavoriteIds(new Set(ids));
    });

    // Merge local favorites to Firestore on login
    const syncLocalToFirestore = async () => {
      if (localFavorites.length > 0) {
        console.log("Merging local favorites to account...");
        for (const id of localFavorites) {
          const favRef = doc(db, 'users', user.uid, 'favorites', id);
          const snap = await getDoc(favRef);
          if (!snap.exists()) {
            try {
              await setDoc(favRef, { addedAt: serverTimestamp() });
              // Also update global count
              const itemRef = doc(db, 'items', id);
              await updateDoc(itemRef, { favoriteCount: increment(1) });
            } catch (err) {
              console.error("Error syncing local favorite", id, err);
            }
          }
        }
        // Clear local storage after sync
        localStorage.removeItem('guest_favorites');
        setLocalFavorites([]);
      }
    };

    syncLocalToFirestore();

    return () => unsubscribe();
  }, [user, localFavorites.length]);

  const toggleFavorite = async (itemId: string, itemName: string) => {
    const isFav = favoriteIds.has(itemId);
    const itemRef = doc(db, 'items', itemId);

    if (user) {
      const favRef = doc(db, 'users', user.uid, 'favorites', itemId);
      try {
        if (isFav) {
          await deleteDoc(favRef);
          await updateDoc(itemRef, { favoriteCount: increment(-1) });
          toast.info(`${itemName} retiré des favoris`);
        } else {
          await setDoc(favRef, { addedAt: serverTimestamp() });
          await updateDoc(itemRef, { favoriteCount: increment(1) });
          toast.success(`${itemName} ajouté aux favoris`);
        }
      } catch (error) {
        console.error("Error toggling favorite in Firestore:", error);
        toast.error("Erreur lors de la mise à jour des favoris");
      }
    } else {
      // Handle local favorites
      let newLocal: string[];
      if (isFav) {
        newLocal = localFavorites.filter(id => id !== itemId);
        toast.info(`${itemName} retiré (local)`);
      } else {
        newLocal = [...localFavorites, itemId];
        toast.success(`${itemName} ajouté (local)`);
      }
      
      setLocalFavorites(newLocal);
      localStorage.setItem('guest_favorites', JSON.stringify(newLocal));
      setFavoriteIds(new Set(newLocal));
      // Note: We don't update global favoriteCount for guests to prevent spam/abuse
      // as our rules require isSignedIn() for updating items metadata.
    }
  };

  const isFavorite = (itemId: string) => favoriteIds.has(itemId);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
