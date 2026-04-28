import React from 'react';
import { useCart } from '../CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '../lib/utils';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 inline-block">
          <ShoppingCart size={64} className="mx-auto text-gray-200 mb-6" />
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Votre panier est vide</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            Il semble que vous n'ayez pas encore ajouté d'articles de luxe à votre sélection.
          </p>
          <Link 
            to="/" 
            className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-8 flex items-center gap-3">
        <ShoppingCart size={32} className="text-yellow-500" />
        Votre Sélection
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-center"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={item.imageUrls?.[0] || item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <h3 className="text-lg font-bold text-blue-900 mb-1">{item.name}</h3>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-1">{item.description}</p>
                  <div className="text-blue-900 font-bold">{formatCurrency(item.price)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-100 rounded-lg p-1 bg-gray-50">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-blue-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      removeFromCart(item.id);
                      toast.info(`${item.name} retiré du panier`);
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-blue-900 rounded-3xl p-8 text-white shadow-xl sticky top-24">
            <h2 className="text-xl font-bold mb-6 text-yellow-500">Récapitulatif</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between opacity-80">
                <span>Sous-total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between opacity-80">
                <span>Livraison Premium</span>
                <span className="text-green-400">Offert</span>
              </div>
              <div className="border-t border-blue-800 pt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-yellow-500">{formatCurrency(total)}</span>
              </div>
            </div>

            {user ? (
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-yellow-500 text-blue-900 py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
              >
                Passer la commande
                <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={login}
                className="w-full bg-white text-blue-900 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                Se connecter pour commander
              </button>
            )}
            
            <p className="text-center text-xs text-blue-300 mt-6 flex items-center justify-center gap-1">
              <Package size={14} />
              Expédition sous 48h par transporteur spécialisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
