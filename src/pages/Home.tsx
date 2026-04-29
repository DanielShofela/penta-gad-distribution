import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, getDocs, updateDoc, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item } from '../types';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useFavorites } from '../FavoritesContext';
import { ShoppingCart, Plus, Search, Filter, ChevronRight, Package, ArrowLeft, Star, Bookmark, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../lib/utils';
import { getCategoryName, CATEGORY_GROUPS } from '../constants';

const Home = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const { toggleFavorite, favoriteIds } = useFavorites();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get('category');

  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(itemsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'items');
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Group items by category group for the home view
  const groupedItems = CATEGORY_GROUPS.map(group => ({
    ...group,
    items: items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const isInGroup = group.categories.some(cat => cat.id === item.category);
      return matchesSearch && isInGroup;
    })
  })).filter(group => group.items.length > 0);

  const seedData = async () => {
    const initialItems = [
      {
        name: "Réfrigérateur Sub-Zero Pro 48",
        description: "Le summum de la conservation alimentaire avec un design industriel en acier inoxydable.",
        price: 8200000,
        imageUrls: ["https://picsum.photos/seed/fridge/800/600", "https://picsum.photos/seed/fridge2/800/600"],
        stock: 5,
        category: "refrigerateurs",
        allowInstallments: true,
        allowTontine: true,
        averageRating: 4.8,
        reviewCount: 12
      },
      {
        name: "Piano de Cuisson La Cornue Château 150",
        description: "Fabriqué à la main sur commande, une pièce maîtresse pour toute cuisine de luxe.",
        price: 29500000,
        imageUrls: ["https://picsum.photos/seed/stove/800/600", "https://picsum.photos/seed/stove2/800/600"],
        stock: 2,
        category: "fours",
        allowInstallments: true,
        allowTontine: false,
        averageRating: 5.0,
        reviewCount: 3
      },
      {
        name: "Lave-vaisselle Miele Diamond Series",
        description: "Silence absolu et performance de nettoyage inégalée pour vos cristaux les plus précieux.",
        price: 2100000,
        imageUrls: ["https://picsum.photos/seed/dishwasher/800/600", "https://picsum.photos/seed/dishwasher2/800/600"],
        stock: 10,
        category: "lave-vaisselle",
        allowTontine: true,
        averageRating: 4.5,
        reviewCount: 28
      },
      {
        name: "Machine à Café Intégrée Gaggenau 400",
        description: "L'art de l'espresso parfait, intégré harmonieusement dans votre cuisine.",
        price: 3150000,
        imageUrls: ["https://picsum.photos/seed/coffee/800/600"],
        stock: 8,
        category: "petit-electromenager",
        allowInstallments: true,
        averageRating: 4.7,
        reviewCount: 15
      }
    ];

    try {
      for (const item of initialItems) {
        await addDoc(collection(db, 'items'), item);
      }
      toast.success("Données initiales ajoutées !");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'items');
    }
  };

  const getCategoryTitle = () => {
    if (!categoryFilter) return 'Tout le catalogue';
    return getCategoryName(categoryFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const ItemCard = ({ item, index }: { item: Item, index: number, key?: string }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group flex-shrink-0 w-[280px] sm:w-[320px]"
    >
      <div className="relative group/card aspect-[4/3] overflow-hidden">
        <Link to={`/item/${item.id}`} className="block w-full h-full">
          <img 
            src={item.imageUrls?.[0] || item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </Link>
        
        {/* Hover Overlay Buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/5 backdrop-blur-[2px] pointer-events-none">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (item.stock > 0) {
                addToCart(item);
                toast.success(`${item.name} ajouté au panier`);
              }
            }}
            disabled={item.stock <= 0}
            className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group/btn pointer-events-auto"
            title="Ajouter au panier"
          >
            <ShoppingCart size={20} strokeWidth={2.5} />
          </button>
           <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(item.id, item.name);
            }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90 pointer-events-auto",
              favoriteIds.has(item.id) ? "bg-blue-600 text-white" : "bg-green-500 text-white"
            )}
            title={favoriteIds.has(item.id) ? "Retirer" : "Enregistrer"}
          >
            <Bookmark size={20} strokeWidth={2.5} fill={favoriteIds.has(item.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10 pointer-events-none">
          <div className="bg-white px-3 py-1.5 rounded-full text-blue-900 font-black text-xs shadow-xl ring-1 ring-black/5">
            {formatCurrency(item.price)}
          </div>
        </div>
      </div>
      <div className="p-5">
        <Link to={`/item/${item.id}`}>
          <h3 className="text-lg font-bold text-blue-900 mb-1 hover:text-blue-700 transition-colors line-clamp-1 uppercase tracking-tight">{item.name}</h3>
        </Link>

        {/* Improved Rating Display - Much more prominent */}
        <div className="flex flex-col gap-2 mb-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={12} 
                    fill={star <= Math.round(item.averageRating || 0) ? "#facc15" : "transparent"} 
                    className={star <= Math.round(item.averageRating || 0) ? "text-yellow-400" : "text-gray-200"}
                    strokeWidth={2.5}
                  />
                ))}
              </div>
              <span className="text-[11px] font-black text-blue-900 ml-1">
                {item.reviewCount && item.reviewCount > 0 ? (item.averageRating || 0).toFixed(1) : "—"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm border transition-colors",
                item.reviewCount && item.reviewCount > 0 
                  ? "text-blue-600 bg-white border-blue-50" 
                  : "text-gray-400 bg-gray-50 border-gray-100"
              )}>
                {item.reviewCount && item.reviewCount > 0 ? `${item.reviewCount} AVIS` : "SANS AVIS"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
        </div>

        <p className="text-gray-500 text-xs line-clamp-1 mb-3">
          {item.description}
        </p>
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          <span className={item.stock > 0 ? "text-green-600 text-[10px] font-black uppercase tracking-wider" : "text-red-600 text-[10px] font-black uppercase tracking-wider"}>
            {item.stock > 0 ? `${item.stock} en stock` : "Épuisé"}
          </span>
          
          {!isAdmin && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.stock > 0) {
                  addToCart(item);
                  toast.success(`${item.name} ajouté au panier`);
                }
              }}
              disabled={item.stock <= 0}
              className="bg-blue-900 text-white px-3 py-2 rounded-xl hover:bg-blue-800 transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 border border-blue-900/5 group/btn"
              title="Ajouter au panier"
            >
              <Plus size={14} strokeWidth={3} className="transition-transform group-hover/btn:rotate-90" />
              <span className="text-[10px] font-black uppercase tracking-widest">Ajouter</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section (Only show on main landing) */}
      {!categoryFilter && searchTerm === '' && (
        <div className="relative rounded-3xl overflow-hidden mb-12 bg-blue-900 h-[300px] sm:h-[400px] flex items-center">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1920" 
              alt="Luxury Kitchen" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 px-6 md:px-16 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
            >
              L'Excellence dans votre <span className="text-yellow-500 italic">Maison</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-blue-100 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md"
            >
              Électroménager, Mobilier et High-Tech de luxe avec options de financement flexibles.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-yellow-500 text-blue-900 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold hover:bg-yellow-400 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-yellow-500/20 text-sm sm:text-base"
            >
              Explorer les Nouveautés <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Header, Search and Filter */}
      <div id="articles-section" className="flex flex-col md:flex-row gap-4 mb-10 items-start md:items-center justify-between">
        <div className="w-full md:w-auto">
          <h2 className="text-2xl md:text-3xl font-black text-blue-900 uppercase tracking-tight">{getCategoryTitle()}</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Chercher un article..." 
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span className="text-sm font-bold">Filtres</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering: Grouped by Category vs Single List */}
      {!categoryFilter && searchTerm === '' ? (
        <div className="space-y-16">
          {groupedItems.map((group) => (
            <div key={group.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 uppercase tracking-tight">{group.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{group.description}</p>
                  </div>
                </div>
                <Link 
                  to={`/?category=${group.categories[0].id}`} 
                  className="text-xs font-black text-blue-600 hover:text-blue-900 flex items-center gap-1 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full"
                >
                  Voir tout <ChevronRight size={14} />
                </Link>
              </div>

              {/* Horizontal Scrolling Wrapper */}
              <div className="relative group/scroll-container">
                <div 
                  id={`scroll-${group.id}`}
                  className="flex overflow-x-auto gap-6 pb-6 pt-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
                >
                  {group.items.map((item, idx) => (
                    <div key={item.id} className="snap-start">
                      <ItemCard item={item} index={idx} />
                    </div>
                  ))}
                  <div className="flex-shrink-0 w-4" />
                </div>
                
                {/* Scroll Buttons */}
                <button 
                  onClick={() => {
                    const el = document.getElementById(`scroll-${group.id}`);
                    if (el) el.scrollBy({ left: -350, behavior: 'smooth' });
                  }}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-full -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-blue-900 opacity-0 group-hover/scroll-container:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                >
                  <ArrowLeft size={18} />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById(`scroll-${group.id}`);
                    if (el) el.scrollBy({ left: 350, behavior: 'smooth' });
                  }}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-full translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-blue-900 opacity-0 group-hover/scroll-container:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Regular Grid View for Filtered Results */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map((item, index) => (
            <ItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}

      {(filteredItems.length === 0 || (searchTerm === '' && groupedItems.length === 0)) && !loading && (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-6 max-w-2xl mx-auto mt-12">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-300">
            <Package size={40} />
          </div>
          <h3 className="text-2xl font-black text-blue-900 mb-3 uppercase tracking-tight">Catalogue Vide</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Nous n'avons trouvé aucun article correspondant à vos critères. Essayez de réinitialiser vos filtres.</p>
          
          {items.length === 0 && (
            <button 
              onClick={seedData} 
              className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
            >
              Initialiser le catalogue de démo
            </button>
          )}
          
          {items.length > 0 && (
            <button 
              onClick={() => { setSearchTerm(''); navigate('/'); }} 
              className="text-blue-600 font-bold hover:underline"
            >
              Voir tous les articles
            </button>
          )}
        </div>
      )}
    </div>
  );
};


export default Home;
