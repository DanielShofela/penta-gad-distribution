import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item, Order, PaymentPlan, UserProfile, Payment } from '../types';
import { CATEGORY_GROUPS } from '../constants';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, Plus, Trash2, Edit2, CheckCircle, Clock, AlertCircle, ChevronRight, Search, TrendingUp, DollarSign, PackageCheck, Settings as SettingsIcon, Eye, Mail, Phone, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("Accès refusé. Réservé aux administrateurs.");
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div></div>;
  if (!isAdmin) return null;

  const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Vue d'ensemble", end: true },
    { to: "/admin/items", icon: Package, label: "Catalogue" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
    { to: "/admin/payments", icon: CreditCard, label: "Paiements" },
    { to: "/admin/users", icon: Users, label: "Utilisateurs" },
    { to: "/admin/settings", icon: SettingsIcon, label: "Paramètres" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-blue-900 mb-8 px-2">Admin Panel</h2>
            <nav className="space-y-2">
              {sidebarLinks.map((link) => {
                const isActive = link.end ? location.pathname === link.to : location.pathname.startsWith(link.to);
                return (
                  <Link 
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                      isActive ? "bg-blue-900 text-white shadow-lg" : "text-gray-400 hover:text-blue-900 hover:bg-gray-50"
                    )}
                  >
                    <link.icon size={20} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// --- Sub-pages ---

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    itemsCount: 0,
    usersCount: 0
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const total = snap.docs.reduce((sum, doc) => sum + doc.data().totalAmount, 0);
      setStats(prev => ({ ...prev, totalSales: total, ordersCount: snap.size }));
      
      const sorted = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 5);
      setRecentOrders(sorted);
    });
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      setStats(prev => ({ ...prev, itemsCount: snap.size }));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, usersCount: snap.size }));
    });
    return () => { unsubOrders(); unsubItems(); unsubUsers(); };
  }, []);

  const statCards = [
    { label: "Ventes Totales", value: formatCurrency(stats.totalSales), icon: DollarSign, color: "bg-green-500" },
    { label: "Commandes", value: stats.ordersCount, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Articles", value: stats.itemsCount, icon: Package, color: "bg-yellow-500" },
    { label: "Clients", value: stats.usersCount, icon: Users, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-green-500" />
          Dernières Commandes
        </h3>
        <div className="space-y-4">
          {recentOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-900 shadow-sm">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <p className="font-bold text-blue-900">{order.clientName}</p>
                  <p className="text-xs text-gray-400">#{order.id.slice(0, 8)} • {format(order.createdAt.toDate(), 'd MMM HH:mm', { locale: fr })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-900">{formatCurrency(order.totalAmount)}</p>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block",
                  order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                  order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                  order.status === 'delivered' ? "bg-green-100 text-green-700" : 
                  order.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                )}>
                  {order.status}
                </p>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-gray-500 italic text-center py-4">Aucune commande récente.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
    });
  }, []);

  useEffect(() => {
    if (editingItem) {
      setItemImagePreview(editingItem.imageUrl);
      setFormPrice(editingItem.price);
    } else {
      setItemImagePreview(null);
      setFormPrice(0);
    }
  }, [editingItem, isAdding]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
        toast.error("L'image est trop volumineuse (max 5Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setItemImagePreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      category: formData.get('category') as string,
      allowInstallments: formData.get('allowInstallments') === 'on',
      allowTontine: formData.get('allowTontine') === 'on',
      imageUrl: itemImagePreview || `https://picsum.photos/seed/${Math.random()}/800/600`
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), itemData);
        toast.success("Article mis à jour");
      } else {
        await addDoc(collection(db, 'items'), itemData);
        toast.success("Article ajouté");
      }
      setIsAdding(false);
      setEditingItem(null);
      setItemImagePreview(null);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cet article ?")) {
      try {
        await deleteDoc(doc(db, 'items', id));
        toast.success("Article supprimé");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-900">Gestion du Catalogue</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus size={20} />
          Ajouter
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || editingItem) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl"
          >
            <h3 className="text-xl font-bold text-blue-900 mb-6">{editingItem ? "Modifier l'article" : "Nouvel article"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Nom de l'appareil</label>
                  <input name="name" defaultValue={editingItem?.name} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Description</label>
                  <textarea name="description" defaultValue={editingItem?.description} required rows={3} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Prix (FCFA)</label>
                    <input 
                      name="price" 
                      type="number" 
                      defaultValue={editingItem?.price} 
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      required 
                      className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Stock</label>
                    <input name="stock" type="number" defaultValue={editingItem?.stock} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
                  </div>
                </div>
                
                {formPrice > 0 && (
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">Calculateur de Financement</p>
                      <div className="flex gap-4">
                        <div className="text-sm">
                          <p className="font-bold text-blue-900 leading-none">{formatCurrency(Math.round(formPrice / 4))}</p>
                          <p className="text-[10px] text-gray-400">Mensuel (4 mois)</p>
                        </div>
                        <div className="text-sm border-l border-blue-100 pl-4">
                          <p className="font-bold text-yellow-600 leading-none">{formatCurrency(Math.round(formPrice * 0.01))}</p>
                          <p className="text-[10px] text-gray-400">Quotidien (Tontine)</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <p className="text-xs font-bold text-blue-900">Total: {formatCurrency(formPrice)}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <input 
                      type="checkbox" 
                      name="allowInstallments" 
                      defaultChecked={editingItem?.allowInstallments}
                      className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900" 
                    />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Crédit 4 mois</p>
                      <p className="text-[10px] text-gray-500">Paiement libre sur 4 mois</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <input 
                      type="checkbox" 
                      name="allowTontine" 
                      defaultChecked={editingItem?.allowTontine}
                      className="w-5 h-5 rounded border-gray-300 text-blue-900 focus:ring-blue-900" 
                    />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Tontine 100j</p>
                      <p className="text-[10px] text-gray-500">1% / jour (livraison par tirage)</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Catégorie</label>
                  <select name="category" defaultValue={editingItem?.category} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900">
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORY_GROUPS.map((group) => (
                      <optgroup key={group.id} label={group.name}>
                        {group.categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Image de l'article</label>
                  <div className="space-y-4">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {itemImagePreview && (
                      <div className="relative group inline-block">
                        <img src={itemImagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-gray-100 p-1" />
                        <button 
                          type="button"
                          onClick={() => setItemImagePreview(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-grow bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition-all">Enregistrer</button>
                  <button type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50">Annuler</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 items-center">
            <img src={item.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-blue-900 truncate">{item.name}</h4>
              <p className="text-sm text-gray-400">{formatCurrency(item.price)} • Stock: {item.stock}</p>
              {item.category && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{item.category}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditingItem(item)} className="p-2 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success("Statut mis à jour");
    } catch (error) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Suivi des Commandes</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
              <div>
                <h4 className="font-bold text-blue-900">Commande #{order.id.slice(0, 8)}</h4>
                <p className="text-xs text-gray-400 mb-2">{format(order.createdAt.toDate(), 'Pp', { locale: fr })}</p>
                <div className="text-sm border-l-2 border-blue-100 pl-3 py-1 space-y-1">
                  <p className="font-bold text-blue-900">{order.clientName}</p>
                  <p className="text-gray-500">{order.clientEmail}</p>
                  <p className="text-gray-500"><span className="font-medium text-blue-800">Tél:</span> {order.clientPhone}</p>
                  <p className="text-gray-500"><span className="font-medium text-blue-800">Adresse:</span> {order.clientAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-blue-900">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-gray-400 uppercase">{order.paymentType}</p>
                </div>
                <select 
                  value={order.status || 'pending'}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.items.map((item, idx) => (
                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{item.quantity}x {item.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPayments = () => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'paymentPlans'), orderBy('status', 'asc'));
    return onSnapshot(q, (snap) => {
      setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentPlan)));
    });
  }, []);

  const handleAddPayment = async (plan: PaymentPlan, amount: number) => {
    try {
      await addDoc(collection(db, 'payments'), {
        paymentPlanId: plan.id,
        amount,
        date: Timestamp.now(),
        status: 'completed'
      });

      const newRemaining = plan.remainingAmount - amount;
      await updateDoc(doc(db, 'paymentPlans', plan.id), {
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? 'completed' : 'active'
      });

      toast.success("Versement enregistré");
      setIsAddingPayment(null);
    } catch (error) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Plans de Paiement</h2>
      <div className="space-y-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-blue-900">Plan #{plan.id.slice(0, 8)}</h4>
                <p className="text-sm font-bold text-blue-700">{plan.clientName}</p>
                <p className="text-xs text-gray-400">Commande #{plan.orderId.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-900">Restant: {formatCurrency(plan.remainingAmount)} / {formatCurrency(plan.totalAmount)}</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all" 
                    style={{ width: `${((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-bold text-blue-900 text-sm uppercase tracking-wider">Versements</h5>
                {plan.status === 'active' && (
                  <button 
                    onClick={() => setIsAddingPayment(plan.id)}
                    className="text-blue-900 font-bold text-sm flex items-center gap-1 hover:underline"
                  >
                    <Plus size={16} /> Enregistrer un versement
                  </button>
                )}
              </div>
              
              <AnimatePresence>
                {isAddingPayment === plan.id && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const amount = Number(new FormData(e.currentTarget).get('amount'));
                      handleAddPayment(plan, amount);
                    }}
                    className="mb-6 p-4 bg-blue-50 rounded-2xl flex gap-4 items-end"
                  >
                    <div className="flex-grow">
                      <label className="block text-xs font-bold text-blue-900 mb-1">Montant du versement (FCFA)</label>
                      <input name="amount" type="number" defaultValue={plan.totalAmount / plan.installmentsCount} required className="w-full p-2 rounded-lg border border-blue-200 outline-none" />
                    </div>
                    <button type="submit" className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold">Valider</button>
                    <button type="button" onClick={() => setIsAddingPayment(null)} className="px-4 py-2 text-gray-400 font-bold">Annuler</button>
                  </motion.form>
                )}
              </AnimatePresence>

              <PaymentList planId={plan.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('role'));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Utilisateurs</h2>
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-gray-100 object-cover" />
                    <span className="font-bold text-blue-900">{user.displayName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="p-2 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-900 p-8 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <img 
                      src={selectedUser.photoURL} 
                      alt="" 
                      className="w-20 h-20 rounded-2xl border-2 border-white/20 shadow-lg object-cover" 
                    />
                    <div>
                      <h3 className="text-2xl font-bold">{selectedUser.displayName}</h3>
                      <p className="text-blue-200">{selectedUser.email}</p>
                      <span className="mt-2 inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Rôle: {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Informations de Contact</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-900">
                          <Mail size={16} />
                        </div>
                        <span className="text-gray-600">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
                          <Phone size={16} />
                        </div>
                        <span className="text-gray-600">{selectedUser.phone || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Adresse de Livraison</h4>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-700 mt-1">
                        <MapPin size={16} />
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedUser.address || 'Aucune adresse enregistrée.'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedUser.nameHistory && selectedUser.nameHistory.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2">
                       <Clock size={14} className="text-blue-900" /> Historique des Noms
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.nameHistory.map((oldName, i) => (
                        <span key={i} className="text-xs bg-gray-50 text-gray-400 px-3 py-1 rounded-full border border-gray-100 italic">
                          {oldName}
                        </span>
                      ))}
                      <span className="text-xs bg-blue-50 text-blue-900 px-3 py-1 rounded-full border border-blue-100 font-bold">
                        {selectedUser.displayName} (Actuel)
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic mt-2">
                      * Les anciens noms sont conservés pour prévenir toute tentative de fraude ou d'usurpation d'identité.
                    </p>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 text-center">Historique Commandes & Paiements</h4>
                  <div className="bg-gray-50 rounded-2xl p-6 text-center italic text-gray-400 text-sm">
                    Accédez au menu principal de gestion des commandes ou des paiements pour filtrer par ce client via son nom ou ID 
                    <span className="block mt-1 font-mono text-[10px] opacity-60">ID: {selectedUser.uid}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex justify-end px-8">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminSettings = () => {
  const { settings } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logoUrl || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings?.faviconUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
        toast.error("L'image est trop volumineuse (max 5Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, type === 'favicon' ? 128 : 800, type === 'favicon' ? 128 : 800);
        if (type === 'logo') setLogoPreview(compressed);
        else setFaviconPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const newSettings = {
      logoUrl: logoPreview || "",
      faviconUrl: faviconPreview || "",
      siteName: formData.get('siteName') as string,
    };

    try {
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      toast.success("Paramètres mis à jour");
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Paramètres du Site</h2>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Nom du Site</label>
            <input 
              name="siteName" 
              defaultValue={settings?.siteName || "PENTA GAD"} 
              required 
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Logo du Site (Header/Footer)</label>
              <div className="space-y-4">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoPreview && (
                  <div className="relative group inline-block">
                    <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-contain rounded-lg border border-gray-100 p-1" />
                    <button 
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Icône du Navigateur (Favicon)</label>
              <div className="space-y-4">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'favicon')}
                  className="w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {faviconPreview && (
                  <div className="relative group inline-block">
                    <img src={faviconPreview} alt="Favicon Preview" className="h-10 w-10 object-contain rounded-lg border border-gray-100 p-1" />
                    <button 
                      type="button"
                      onClick={() => setFaviconPreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-all disabled:bg-gray-300"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusing the PaymentList component from ClientDashboard
const PaymentList = ({ planId }: { planId: string }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'payments'),
      where('paymentPlanId', '==', planId),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));
  }, [planId]);

  if (loading) return <div className="animate-pulse h-10 bg-gray-50 rounded-xl"></div>;

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className="text-green-500" />
            <span className="font-bold text-blue-900">{formatCurrency(payment.amount)}</span>
            <span className="text-gray-400">{format(payment.date.toDate(), 'd MMM yyyy', { locale: fr })}</span>
          </div>
          <span className="text-xs font-bold text-green-600 uppercase">Effectué</span>
        </div>
      ))}
      {payments.length === 0 && <p className="text-gray-400 text-sm italic">Aucun versement.</p>}
    </div>
  );
};

// Utility for tailwind classes
// function cn(...inputs: any[]) {
//   return inputs.filter(Boolean).join(' ');
// }

export default AdminDashboard;
