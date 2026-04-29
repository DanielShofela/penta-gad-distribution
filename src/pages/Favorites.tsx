import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types';
import { Heart, Package, ShoppingCart, Star, Plus, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../lib/utils';
import { useCart } from '../CartContext';
import { useFavorites } from '../FavoritesContext';

const Favorites = () => {
  const { addToCart } = useCart();
  const { favoriteIds } = useFavorites();
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteDetails = async () => {
      setLoading(true);
      const ids = Array.from(favoriteIds) as string[];
      
      if (ids.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const itemsData: Item[] = [];
        for (const id of ids) {
          const itemDoc = await getDoc(doc(db, 'items', id));
          if (itemDoc.exists()) {
            itemsData.push({ id: itemDoc.id, ...itemDoc.data() } as Item);
          }
        }
        setFavorites(itemsData);
      } catch (error) {
        console.error("Error fetching favorite items:", error);
        toast.error("Erreur lors du chargement des favoris");
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteDetails();
  }, [favoriteIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
          <Heart size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">Mes Coups de Cœur</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{favorites.length} articles sauvegardés</p>
        </div>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favorites.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Link to={`/item/${item.id}`}>
                  <img 
                    src={item.imageUrls?.[0] || item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-blue-900 font-black text-xs shadow-lg">
                  {formatCurrency(item.price)}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-blue-900 mb-1 group-hover:text-blue-700 transition-colors uppercase tracking-tight line-clamp-1">{item.name}</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={12} 
                          fill={star <= Math.round(item.averageRating || 0) ? "#facc15" : "transparent"} 
                          className={star <= Math.round(item.averageRating || 0) ? "text-yellow-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">({item.reviewCount || 0})</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-md">
                    <Heart size={10} fill="#ef4444" className="text-red-500" />
                    <span className="text-[10px] font-black text-red-600">{item.favoriteCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">
                    {item.stock > 0 ? "En Stock" : "Rupture"}
                  </span>
                  <button 
                    onClick={() => {
                      addToCart(item);
                      toast.success(`${item.name} ajouté au panier`);
                    }}
                    disabled={item.stock <= 0}
                    className="p-2.5 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm max-w-xl mx-auto">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Heart size={40} />
          </div>
          <h3 className="text-2xl font-black text-blue-900 mb-3 uppercase tracking-tight">Liste Vide</h3>
          <p className="text-gray-500 mb-8 font-medium">Vous n'avez pas encore d'articles favoris. Parcourez notre catalogue et cliquez sur le cœur !</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all">
            Explorer le catalogue <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
