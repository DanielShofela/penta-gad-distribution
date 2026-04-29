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

  // Remove local favorites logic
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    // Subscribe to Firestore favorites
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'favorites'), (snap) => {
      const ids = snap.docs.map(d => d.id);
      setFavoriteIds(new Set(ids));
    });

    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = async (itemId: string, itemName: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour enregistrer cet article");
      return;
    }

    const isFav = favoriteIds.has(itemId);
    const itemRef = doc(db, 'items', itemId);
    const favRef = doc(db, 'users', user.uid, 'favorites', itemId);

    try {
      if (isFav) {
        await deleteDoc(favRef);
        await updateDoc(itemRef, { favoriteCount: increment(-1) });
        toast.info(`${itemName} retiré`);
      } else {
        await setDoc(favRef, { addedAt: serverTimestamp() });
        await updateDoc(itemRef, { favoriteCount: increment(1) });
        toast.success(`${itemName} enregistré`);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erreur lors de la mise à jour");
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
