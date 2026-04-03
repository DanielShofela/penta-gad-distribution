import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item } from '../types';
import { useCart } from '../CartContext';
import { ShoppingCart, ArrowLeft, Plus, Minus, CheckCircle, Package, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const docRef = doc(db, 'items', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as Item);
        } else {
          toast.error("Article introuvable");
          navigate('/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `items/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-900 mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Retour au catalogue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl bg-white aspect-square"
        >
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Content Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <span className="text-yellow-500 font-bold tracking-widest text-sm uppercase mb-2 block">Collection Exclusive</span>
            <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">{item.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-blue-900">{formatCurrency(item.price)}</span>
              <span className={item.stock > 0 ? "bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium" : "bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"}>
                {item.stock > 0 ? `${item.stock} en stock` : "Rupture de stock"}
              </span>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {item.description}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <Truck className="text-blue-900" size={24} />
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Livraison Premium</h4>
                <p className="text-blue-700 text-xs">Installation incluse</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
              <ShieldCheck className="text-yellow-600" size={24} />
              <div>
                <h4 className="font-bold text-yellow-700 text-sm">Garantie 5 ans</h4>
                <p className="text-yellow-600 text-xs">Service après-vente VIP</p>
              </div>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl p-1 bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="w-12 text-center font-bold text-blue-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <button 
                onClick={() => {
                  for(let i=0; i<quantity; i++) addToCart(item);
                  toast.success(`${quantity} ${item.name} ajouté(s) au panier`);
                }}
                disabled={item.stock <= 0}
                className="flex-grow bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 disabled:bg-gray-300 disabled:shadow-none"
              >
                <ShoppingCart size={24} />
                Ajouter au panier
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <CheckCircle size={16} className="text-green-500" />
              Paiement sécurisé et échelonné disponible
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ItemDetail;
