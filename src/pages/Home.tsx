import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item } from '../types';
import { useCart } from '../CartContext';
import { ShoppingCart, Plus, Search, Filter, ChevronRight, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Home = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();

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

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const seedData = async () => {
    const initialItems = [
      {
        name: "Réfrigérateur Sub-Zero Pro 48",
        description: "Le summum de la conservation alimentaire avec un design industriel en acier inoxydable.",
        price: 12500,
        imageUrl: "https://picsum.photos/seed/fridge/800/600",
        stock: 5
      },
      {
        name: "Piano de Cuisson La Cornue Château 150",
        description: "Fabriqué à la main sur commande, une pièce maîtresse pour toute cuisine de luxe.",
        price: 45000,
        imageUrl: "https://picsum.photos/seed/stove/800/600",
        stock: 2
      },
      {
        name: "Lave-vaisselle Miele Diamond Series",
        description: "Silence absolu et performance de nettoyage inégalée pour vos cristaux les plus précieux.",
        price: 3200,
        imageUrl: "https://picsum.photos/seed/dishwasher/800/600",
        stock: 10
      },
      {
        name: "Machine à Café Intégrée Gaggenau 400",
        description: "L'art de l'espresso parfait, intégré harmonieusement dans votre cuisine.",
        price: 4800,
        imageUrl: "https://picsum.photos/seed/coffee/800/600",
        stock: 8
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden mb-12 bg-blue-900 h-[400px] flex items-center">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://picsum.photos/seed/luxury-kitchen/1920/1080" 
            alt="Luxury Kitchen" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 px-8 md:px-16 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            L'Excellence dans votre <span className="text-yellow-500 italic">Cuisine</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-lg mb-8"
          >
            Découvrez notre sélection exclusive d'appareils haut de gamme pour une expérience culinaire inégalée.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-yellow-500 text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2"
          >
            Explorer la Collection <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un appareil..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <button 
              onClick={seedData}
              className="text-sm text-blue-600 hover:underline"
            >
              (Initialiser le catalogue)
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
            <Filter size={20} />
            <span>Filtres</span>
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group"
          >
            <Link to={`/item/${item.id}`} className="block relative aspect-[4/3] overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-blue-900 font-bold text-sm">
                {item.price.toLocaleString()} €
              </div>
            </Link>
            <div className="p-6">
              <Link to={`/item/${item.id}`}>
                <h3 className="text-xl font-bold text-blue-900 mb-2 hover:text-blue-700 transition-colors">{item.name}</h3>
              </Link>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className={item.stock > 0 ? "text-green-600 text-xs font-medium" : "text-red-600 text-xs font-medium"}>
                  {item.stock > 0 ? `${item.stock} en stock` : "Rupture de stock"}
                </span>
                <button 
                  onClick={() => {
                    addToCart(item);
                    toast.success(`${item.name} ajouté au panier`);
                  }}
                  disabled={item.stock <= 0}
                  className="bg-blue-900 text-white p-3 rounded-xl hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-600">Aucun article trouvé</h3>
          <p className="text-gray-400">Essayez une autre recherche ou revenez plus tard.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
