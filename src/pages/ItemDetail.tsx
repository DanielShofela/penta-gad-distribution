import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item } from '../types';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { ShoppingCart, ArrowLeft, Plus, Minus, CheckCircle, Package, ShieldCheck, Truck, DollarSign, Heart, Share2, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '../lib/utils';
import { getCategoryName, CATEGORY_GROUPS } from '../constants';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'config' | 'desc' | 'reviews'>('desc');
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    if (!item) return null;
    const group = CATEGORY_GROUPS.find(g => g.categories.some(c => c.id === item.category));
    const category = group?.categories.find(c => c.id === item.category);
    
    return (
      <nav className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 mb-6 font-medium overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
        <Link to="/" className="hover:text-blue-900 flex-shrink-0">Accueil</Link>
        <ChevronRight size={12} className="flex-shrink-0" />
        {group && (
          <>
            <span className="hover:text-blue-900 flex-shrink-0 cursor-default">{group.name}</span>
            <ChevronRight size={12} className="flex-shrink-0" />
          </>
        )}
        {item.brand && (
          <>
            <span className="text-blue-900 font-bold flex-shrink-0">{item.brand}</span>
            <ChevronRight size={12} className="flex-shrink-0" />
          </>
        )}
        <span className="text-gray-900 font-black flex-shrink-0 max-w-[200px] truncate">{item.name}</span>
      </nav>
    );
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-900 transition-all font-bold group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-all">
            <ArrowLeft size={20} />
          </div>
          <span>Retour</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-blue-900 transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {getBreadcrumbs()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Image Section */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white aspect-square border border-gray-50"
          >
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {item.allowTontine && (
              <div className="absolute top-6 left-6 bg-yellow-500 text-blue-900 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                Tontine Disponible
              </div>
            )}
          </motion.div>
          
          {/* Tabs for Desktop */}
          <div className="hidden lg:block bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              {[
                { id: 'desc', label: 'DESCRIPTION' },
                { id: 'specs', label: 'SPECIFICATIONS' },
                { id: 'config', label: 'CONFIGURATIONS' },
                { id: 'reviews', label: 'AVIS CLIENT' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab.id ? "bg-white text-blue-900 border-b-2 border-blue-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-8 min-h-[200px]">
              <AnimatePresence mode="wait">
                {activeTab === 'desc' && (
                  <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </motion.div>
                )}
                {activeTab === 'specs' && (
                  <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {item.specifications?.split('\n').map((spec, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-600 border-b border-gray-50 pb-2">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        <span>{spec}</span>
                      </div>
                    )) || <p className="text-gray-400 italic text-sm text-center py-4">Aucune spécification technique détaillée.</p>}
                  </motion.div>
                )}
                {activeTab === 'config' && (
                  <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-600 text-sm leading-relaxed">
                    {item.configurations || <p className="text-gray-400 italic text-sm text-center py-4">Pas de configuration particulière renseignée.</p>}
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                    <Star size={32} className="mx-auto text-yellow-400 mb-2 opacity-50" />
                    <p className="text-gray-500 text-sm">Soyez le premier à donner votre avis sur cet article !</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                {item.brand && <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2 block">{item.brand}</span>}
                <h1 className="text-3xl lg:text-4xl font-black text-blue-900 leading-tight">{item.name}</h1>
                {item.reference && <p className="text-gray-400 text-sm mt-2 font-mono">Référence : {item.reference}</p>}
              </div>
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "p-3 rounded-2xl border transition-all active:scale-90",
                  isFavorite ? "bg-red-50 border-red-100 text-red-500" : "bg-gray-50 border-gray-100 text-gray-400 hover:text-blue-900"
                )}
              >
                <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex flex-col gap-1 mb-8">
              <span className="text-3xl font-black text-blue-900">{formatCurrency(item.price)}</span>
              {item.allowInstallments && (
                <span className="text-sm font-bold text-blue-600">
                  ou à crédit à partir de <span className="text-blue-900">{formatCurrency(Math.round(item.price / 4))}</span> / mois
                </span>
              )}
            </div>

            {/* Availability Badge */}
            <div className="mb-8">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-sm",
                item.stock > 0 ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
              )}>
                <div className={cn("w-2 h-2 rounded-full", item.stock > 0 ? "bg-green-500" : "bg-red-500")}></div>
                {item.stock > 0 ? `${item.stock} unitées disponibles` : "Rupture de stock"}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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

          {/* Payment Options Details */}
          {(item.allowInstallments || item.allowTontine) && (
            <div className="bg-gray-50 rounded-3xl p-6 mb-12 border border-gray-100">
              <h4 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-yellow-500" />
                Options de Financement disponibles
              </h4>
              <div className="space-y-4">
                {item.allowInstallments && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100">
                    <div>
                      <p className="text-sm font-bold text-blue-900">Paiement Échelonné (4 mois)</p>
                      <p className="text-xs text-gray-500">Paiement à votre rythme sur une durée de 4 mois.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-900">{formatCurrency(Math.round(item.price / 4))}</p>
                      <p className="text-[10px] text-blue-600 uppercase font-bold">/ mois idéal</p>
                    </div>
                  </div>
                )}
                {item.allowTontine && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-yellow-100">
                    <div>
                      <p className="text-sm font-bold text-blue-900">Tontine Quotidienne (100 jours)</p>
                      <p className="text-xs text-gray-500">Tirage au sort tous les 10 jours. Recevez votre article avant 100 jours !</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-yellow-600">{formatCurrency(Math.round(item.price * 0.01))}</p>
                      <p className="text-[10px] text-yellow-600 uppercase font-bold">/ jour (1%)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="lg:hidden mb-8 space-y-4">
            {[
              { id: 'specs', label: 'SPECIFICATIONS TECHNIQUES' },
              { id: 'config', label: 'CONFIGURATIONS' },
              { id: 'desc', label: 'DESCRIPTION' },
              { id: 'reviews', label: 'AVIS CLIENT' }
            ].map(tab => (
              <div key={tab.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setActiveTab(activeTab === tab.id ? '' as any : tab.id as any)}
                  className="w-full px-6 py-4 flex items-center justify-between font-black text-[10px] text-blue-900 uppercase tracking-widest"
                >
                  {tab.label}
                  <Plus size={14} className={cn("transition-transform", activeTab === tab.id && "rotate-45")} />
                </button>
                <AnimatePresence>
                  {activeTab === tab.id && (
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: 'auto' }} 
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-gray-50/30"
                    >
                      <div className="px-6 py-4 text-sm text-gray-500 leading-relaxed">
                        {tab.id === 'desc' && item.description}
                        {tab.id === 'specs' && (
                          <div className="space-y-2">
                             {item.specifications?.split('\n').map((s, i) => <div key={i} className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-900 mt-1.5 flex-shrink-0" />{s}</div>) || "N/A"}
                          </div>
                        )}
                        {tab.id === 'config' && (item.configurations || "Fiche configuration non disponible.")}
                        {tab.id === 'reviews' && "Aucun avis pour le moment."}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {!isAdmin && (
            <div className="mt-auto space-y-6 pt-8 border-t border-gray-100 lg:border-none lg:pt-0">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
