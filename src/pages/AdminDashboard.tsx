import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Item, Order, PaymentPlan, UserProfile, Payment } from '../types';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, Plus, Trash2, Edit2, CheckCircle, Clock, AlertCircle, ChevronRight, Search, TrendingUp, DollarSign, PackageCheck, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';

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

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const total = snap.docs.reduce((sum, doc) => sum + doc.data().totalAmount, 0);
      setStats(prev => ({ ...prev, totalSales: total, ordersCount: snap.size }));
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
          Activité Récente
        </h3>
        <p className="text-gray-500 italic">Le tableau de bord analytique détaillé sera disponible prochainement.</p>
      </div>
    </div>
  );
};

const AdminItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('name'));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      imageUrl: formData.get('imageUrl') as string || `https://picsum.photos/seed/${Math.random()}/800/600`
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
                    <input name="price" type="number" defaultValue={editingItem?.price} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Stock</label>
                    <input name="stock" type="number" defaultValue={editingItem?.stock} required className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">URL de l'image (optionnel)</label>
                  <input name="imageUrl" defaultValue={editingItem?.imageUrl} className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-900" />
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
                <p className="text-xs text-gray-400">{format(order.createdAt.toDate(), 'Pp', { locale: fr })}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-blue-900">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-gray-400 uppercase">{order.paymentType}</p>
                </div>
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
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

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('role'));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">Utilisateurs</h2>
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rôle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { settings } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logoUrl || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // ~800KB limit for Firestore doc size safety
        toast.error("L'image est trop volumineuse (max 800KB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
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
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Logo du Site</label>
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-2 text-xs text-gray-400 italic">
                  Téléchargez une image (PNG, JPG) pour le logo.
                </p>
              </div>
              {logoPreview && (
                <div className="relative group">
                  <img src={logoPreview} alt="Preview" className="h-16 w-16 object-contain rounded-lg border border-gray-100 p-1" />
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
