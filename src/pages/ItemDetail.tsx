import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item, Review } from '../types';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { ShoppingCart, ArrowLeft, Plus, Minus, CheckCircle, Package, ShieldCheck, Truck, DollarSign, Heart, Share2, Star, ChevronRight, User, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn } from '../lib/utils';
import { getCategoryName, CATEGORY_GROUPS } from '../constants';

const FormattedAttributes = ({ content, emptyMessage }: { content?: string, emptyMessage: string }) => {
  if (!content) return <p className="text-gray-400 italic text-sm text-center py-8">{emptyMessage}</p>;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="col-span-full h-4" />;
        
        // Header detection: all caps or specifically formatted
        const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 3;
        
        if (isHeader) {
          return (
            <h4 key={i} className="col-span-full font-black text-blue-900 text-[10px] mt-6 mb-3 uppercase tracking-[0.2em] border-l-4 border-blue-900 pl-3">
              {trimmed}
            </h4>
          );
        }

        if (trimmed.includes(':')) {
          const [key, ...val] = trimmed.split(':');
          return (
            <div key={i} className="flex flex-col py-3 border-b border-gray-50 group">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">{key.trim()}</span>
              <span className="text-sm font-black text-blue-900 leading-tight">{val.join(':').trim()}</span>
            </div>
          );
        }

        return (
          <div key={i} className="flex items-center gap-3 text-sm text-gray-600 py-3 border-b border-gray-50 col-span-full">
            <CheckCircle size={14} className="text-blue-900/20 flex-shrink-0" />
            <span className="font-bold">{trimmed}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewForm = ({ 
  user, 
  newReview, 
  setNewReview, 
  onSubmit, 
  submitting,
  isMobile = false 
}: { 
  user: any, 
  newReview: any, 
  setNewReview: any, 
  onSubmit: (e: React.FormEvent) => void,
  submitting: boolean,
  isMobile?: boolean
}) => {
  const containerClass = isMobile 
    ? "bg-white rounded-2xl border border-blue-100 p-6 shadow-sm scroll-mt-20"
    : "bg-white rounded-3xl border border-blue-100 p-8 shadow-sm";
  
  const titleClass = isMobile
    ? "text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
    : "text-sm font-black text-blue-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2";

  const labelClass = isMobile
    ? "block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5"
    : "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2";

  const inputClass = isMobile
    ? "w-full p-3 rounded-xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-900 transition-all text-xs"
    : "w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-blue-900 transition-all text-sm";

  return (
    <div id={isMobile ? "mobile-review-form" : "review-form"} className={containerClass}>
      <h3 className={titleClass}>
        <Send size={isMobile ? 14 : 16} /> Laisser votre avis
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        {!user && (
          <div>
            <label className={labelClass}>Votre Nom</label>
            <input 
              type="text" 
              required 
              className={inputClass}
              placeholder="ex: Jean Koffi"
              value={newReview.userName ?? ""}
              onChange={e => setNewReview({...newReview, userName: e.target.value})}
            />
          </div>
        )}
        <div>
          <label className={labelClass}>Votre Note</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setNewReview({...newReview, rating: star})}
                className={cn(
                  isMobile ? "w-10 h-10 rounded-xl" : "w-12 h-12 rounded-2xl",
                  "flex items-center justify-center transition-all border",
                  newReview.rating >= star ? "bg-yellow-50 border-yellow-200 text-yellow-400" : "bg-gray-50 border-gray-100 text-gray-300"
                )}
              >
                <Star size={isMobile ? 20 : 24} fill={newReview.rating >= star ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Votre Commentaire</label>
          <textarea 
            required 
            rows={isMobile ? 3 : 4}
            className={inputClass}
            placeholder={isMobile ? "Partagez votre expérience..." : "Partagez votre expérience avec cet article..."}
            value={newReview.comment ?? ""}
            onChange={e => setNewReview({...newReview, comment: e.target.value})}
          />
        </div>
        <button 
          disabled={submitting}
          className={cn(
            "w-full py-4 bg-blue-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50",
            isMobile && "py-3 rounded-xl text-[10px] shadow-lg"
          )}
        >
          {submitting ? "Envoi..." : isMobile ? "Publier" : "Publier mon avis"}
        </button>
      </form>
    </div>
  );
};

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'config' | 'desc' | 'reviews'>('desc');
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const { addToCart } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    // Fetch Item
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

    // Fetch Reviews
    const reviewsQuery = query(
      collection(db, 'items', id, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(reviewsData);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    fetchItem();
    return () => unsubscribeReviews();
  }, [id, navigate]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newReview.comment) return;
    if (!user && !newReview.userName) {
      toast.error("Veuillez entrer votre nom pour laisser un avis");
      return;
    }

    setSubmittingReview(true);
    try {
      const reviewData = {
        itemId: id,
        userId: user?.uid || null,
        userName: user?.displayName || newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'items', id, 'reviews'), reviewData);
      
      // Update Item average rating and review count
      const updatedReviews = [...reviews, { id: 'temp', ...reviewData } as Review];
      const newAverageRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
      
      await updateDoc(doc(db, 'items', id), {
        averageRating: newAverageRating,
        reviewCount: updatedReviews.length
      });

      setNewReview({ rating: 5, comment: '', userName: '' });
      toast.success("Merci ! Votre avis a été publié.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `items/${id}/reviews`);
    } finally {
      setSubmittingReview(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!item) return null;

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

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
          <div className="space-y-4">
            <motion.div 
              key={activeImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white aspect-square border border-gray-50"
            >
              <img 
                src={(item.imageUrls && item.imageUrls[activeImageIndex]) || item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} 
                alt={item.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Product Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {item.allowTontine && (
                  <div className="bg-yellow-500 text-blue-900 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl border border-yellow-400">
                    Tontine Disponible
                  </div>
                )}
                {item.allowInstallments && (
                  <div className="bg-blue-900 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl border border-blue-800">
                    Paiement Échelonné
                  </div>
                )}
              </div>

              {/* Rating Overlay */}
              {reviews.length > 0 && (
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/50">
                  <div className="flex bg-yellow-400/10 p-1 rounded-lg">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-blue-900 text-sm tracking-tight">{averageRating.toFixed(1)}</span>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{reviews.length} Avis</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Thumbnails */}
            {item.imageUrls && item.imageUrls.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {item.imageUrls.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0",
                      activeImageIndex === idx ? "border-blue-900 scale-105 shadow-md" : "border-gray-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
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
                  <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {item.fullDescription || item.description}
                  </motion.div>
                )}
                {activeTab === 'specs' && (
                  <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FormattedAttributes content={item.specifications} emptyMessage="Aucune spécification technique détaillée." />
                  </motion.div>
                )}
                {activeTab === 'config' && (
                  <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <FormattedAttributes content={item.configurations} emptyMessage="Pas de configuration particulière renseignée." />
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                    {/* Review Stats */}
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                      <div className="text-center">
                        <div className="text-5xl font-black text-blue-900 mb-2">
                          {reviews.length > 0 
                            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                            : "0.0"}
                        </div>
                        <div className="flex justify-center mb-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={16} 
                              className={star <= (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{reviews.length} Avis Clients</p>
                      </div>
                      
                      <div className="flex-1 space-y-2 w-full">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = reviews.filter(r => r.rating === rating).length;
                          const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center gap-4">
                              <span className="text-xs font-bold text-gray-400 w-4">{rating}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-900 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="text-xs font-bold text-gray-400 w-8">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review List */}
                    <div className="space-y-6">
                      {reviews.length > 0 ? (
                        reviews.map(review => (
                          <div key={review.id} className="border-b border-gray-50 pb-6 last:border-0 group">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-900 border border-blue-100">
                                  <User size={20} />
                                </div>
                                <div>
                                  <h4 className="font-black text-sm text-blue-900">{review.userName}</h4>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} size={10} className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'dd MMM yyyy', { locale: fr }) : 'A l\'instant'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-13 italic">
                              "{review.comment}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Star size={32} className="mx-auto text-yellow-400 mb-2 opacity-50" />
                          <p className="text-gray-500 text-sm">Aucun avis pour le moment. Soyez le premier !</p>
                        </div>
                      )}
                    </div>

                    <ReviewForm 
                      user={user} 
                      newReview={newReview} 
                      setNewReview={setNewReview} 
                      onSubmit={handleSubmitReview} 
                      submitting={submittingReview} 
                    />
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
                <h1 className="text-3xl lg:text-4xl font-black text-blue-900 leading-tight">
                  {item.name} {item.warranty && <span className="text-blue-600/50 block sm:inline">GARANTIE : {item.warranty}</span>}
                </h1>
                {item.reference && <p className="text-gray-400 text-sm mt-2 font-mono uppercase tracking-widest">Référence : {item.reference}</p>}
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
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 w-fit min-w-[160px]">
              <Truck className="text-blue-900" size={18} />
              <div>
                <h4 className="font-bold text-blue-900 text-xs">
                  {item.deliveryPrice === 0 ? "Livraison Gratuite" : "Livraison Standard"}
                </h4>
                <p className="text-blue-700 text-[10px]">
                  {item.deliveryPrice === 0 ? "Installation incluse" : `Frais: ${formatCurrency(item.deliveryPrice || 0)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-100 w-fit min-w-[160px]">
              <ShieldCheck className="text-yellow-600" size={18} />
              <div>
                <h4 className="font-bold text-yellow-700 text-xs">
                  {item.warranty ? `Garantie ${item.warranty}` : "Garantie Constructeur"}
                </h4>
                <p className="text-yellow-600 text-[10px]">Service après-vente VIP</p>
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
                      key={`tab-content-${tab.id}`}
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/30"
                    >
                      <div className="px-6 py-4 text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                        {tab.id === 'desc' && (item.fullDescription || item.description)}
                        {tab.id === 'specs' && <FormattedAttributes content={item.specifications} emptyMessage="N/A" />}
                        {tab.id === 'config' && <FormattedAttributes content={item.configurations} emptyMessage="N/A" />}
                        {tab.id === 'reviews' && (
                          <div className="p-4 space-y-8">
                            {/* Review Stats */}
                            <div className="flex flex-col items-center gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                              <div className="text-center">
                                <div className="text-4xl font-black text-blue-900 mb-1">
                                  {reviews.length > 0 
                                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                                    : "0.0"}
                                </div>
                                <div className="flex justify-center mb-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      size={12} 
                                      className={star <= (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                                    />
                                  ))}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{reviews.length} Avis</p>
                              </div>
                              
                              <div className="w-full space-y-1.5">
                                {[5, 4, 3, 2, 1].map(rating => {
                                  const count = reviews.filter(r => r.rating === rating).length;
                                  const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                  return (
                                    <div key={rating} className="flex items-center gap-3">
                                      <span className="text-[10px] font-bold text-gray-400 w-3">{rating}</span>
                                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-900 rounded-full" style={{ width: `${percent}%` }} />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 w-6">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <button 
                              onClick={() => document.getElementById('mobile-review-form')?.scrollIntoView({ behavior: 'smooth' })}
                              className="w-full py-3 bg-blue-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                            >
                              Laisser un avis
                            </button>

                            {/* Review List */}
                            <div className="space-y-4">
                              {reviews.length > 0 ? (
                                reviews.map(review => (
                                  <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900 border border-blue-100">
                                          <User size={16} />
                                        </div>
                                        <div>
                                          <h4 className="font-black text-[11px] text-blue-900 leading-tight">{review.userName}</h4>
                                          <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                              <Star key={star} size={8} className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                        {review.createdAt?.toDate ? format(review.createdAt.toDate(), 'dd MMM', { locale: fr }) : 'Maintenant'}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 text-xs italic leading-relaxed">
                                      "{review.comment}"
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-400 text-xs py-4 italic">Soyez le premier à donner votre avis !</p>
                              )}
                            </div>

                            <ReviewForm 
                              user={user} 
                              newReview={newReview} 
                              setNewReview={setNewReview} 
                              onSubmit={handleSubmitReview} 
                              submitting={submittingReview} 
                              isMobile={true}
                            />
                          </div>
                        )}
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
