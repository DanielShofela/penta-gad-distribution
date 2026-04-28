import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item } from '../types';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { ShoppingCart, Plus, Search, Filter, ChevronRight, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';
import { getCategoryName, CATEGORY_GROUPS } from '../constants';

const Home = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const location = useLocation();
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
        imageUrl: "https://picsum.photos/seed/fridge/800/600",
        stock: 5,
        category: "refrigerateurs",
        allowInstallments: true,
        allowTontine: true
      },
      {
        name: "Piano de Cuisson La Cornue Château 150",
        description: "Fabriqué à la main sur commande, une pièce maîtresse pour toute cuisine de luxe.",
        price: 29500000,
        imageUrl: "https://picsum.photos/seed/stove/800/600",
        stock: 2,
        category: "fours",
        allowInstallments: true,
        allowTontine: false
      },
      {
        name: "Lave-vaisselle Miele Diamond Series",
        description: "Silence absolu et performance de nettoyage inégalée pour vos cristaux les plus précieux.",
        price: 2100000,
        imageUrl: "https://picsum.photos/seed/dishwasher/800/600",
        stock: 10,
        category: "lave-vaisselle",
        allowTontine: true
      },
      {
        name: "Machine à Café Intégrée Gaggenau 400",
        description: "L'art de l'espresso parfait, intégré harmonieusement dans votre cuisine.",
        price: 3150000,
        imageUrl: "https://picsum.photos/seed/coffee/800/600",
        stock: 8,
        category: "petit-electromenager",
        allowInstallments: true
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

  const ItemCard = ({ item, index }: { item: Item, index: number }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group flex-shrink-0 w-[280px] sm:w-[320px]"
    >
      <Link to={`/item/${item.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-blue-900 font-bold text-sm">
          {formatCurrency(item.price)}
        </div>
      </Link>
      <div className="p-5">
        <Link to={`/item/${item.id}`}>
          <h3 className="text-lg font-bold text-blue-900 mb-1 hover:text-blue-700 transition-colors line-clamp-1">{item.name}</h3>
        </Link>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.allowInstallments && (
            <div className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-bold border border-blue-100 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
              Crédit: {formatCurrency(Math.round(item.price / 4))}/m
            </div>
          )}
          {item.allowTontine && (
            <div className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded-md text-[9px] font-bold border border-yellow-100 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"></span>
              Tontine: {formatCurrency(Math.round(item.price * 0.01))}/j
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs line-clamp-1 mb-3">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className={item.stock > 0 ? "text-green-600 text-[10px] font-bold uppercase" : "text-red-600 text-[10px] font-bold uppercase"}>
            {item.stock > 0 ? `${item.stock} dispo` : "Épuisé"}
          </span>
          {!isAdmin && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(item);
                toast.success(`${item.name} ajouté au panier`);
              }}
              disabled={item.stock <= 0}
              className="bg-blue-900 text-white p-2 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
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
          <h2 className="text-2xl md:text-3xl font-black text-blue-900 mb-4 md:mb-0 uppercase tracking-tight">{getCategoryTitle()}</h2>
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
              <div className="relative group/scroll">
                <div className="flex overflow-x-auto gap-6 pb-6 pt-2 scrollbar-hide snap-x snap-mandatory">
                  {group.items.map((item, idx) => (
                    <div key={item.id} className="snap-start">
                      <ItemCard item={item} index={idx} />
                    </div>
                  ))}
                  {/* Empty space at end to allow scrolling past last card */}
                  <div className="flex-shrink-0 w-4" />
                </div>
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
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-600">Aucun article trouvé</h3>
          <p className="text-gray-400 text-sm">Essayez une autre recherche ou explorez les catégories.</p>
          {items.length === 0 && (
            <button onClick={seedData} className="mt-6 text-blue-600 font-bold text-sm underline underline-offset-4">
              Réinitialiser le catalogue de démonstration
            </button>
          )}
        </div>
      )}
    </div>
  );
};


export default Home;
