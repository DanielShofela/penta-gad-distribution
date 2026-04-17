import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, Timestamp, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, PaymentPlan, Payment } from '../types';
import { Package, CreditCard, Clock, CheckCircle, ChevronRight, AlertCircle, Calendar, ArrowRight, Trash2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get('tab') as 'orders' | 'payments') || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'orders' || tabFromUrl === 'payments') {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'orders' | 'payments') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const plansQuery = query(
      collection(db, 'paymentPlans'),
      where('clientId', '==', user.uid)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubPlans = onSnapshot(plansQuery, (snapshot) => {
      setPaymentPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentPlan)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'paymentPlans'));

    return () => {
      unsubOrders();
      unsubPlans();
    };
  }, [user]);

  const cancelOrder = async (orderId: string) => {
    if (!window.confirm("Voulez-vous vraiment annuler cette commande ?")) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
      toast.success("Commande annulée avec succès");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette commande ? Cette action est irréversible.")) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast.success("Commande supprimée");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <img 
            src={profile?.photoURL} 
            alt={profile?.displayName} 
            className="w-20 h-20 rounded-3xl border-4 border-white shadow-xl"
          />
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Bonjour, {profile?.displayName}</h1>
            <p className="text-gray-500">Bienvenue sur votre espace personnel PENTA GAD.</p>
          </div>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm self-start">
          <button 
            onClick={() => handleTabChange('orders')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              activeTab === 'orders' ? "bg-blue-900 text-white shadow-lg" : "text-gray-400 hover:text-blue-900"
            )}
          >
            <Package size={20} />
            Commandes
          </button>
          <button 
            onClick={() => handleTabChange('payments')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              activeTab === 'payments' ? "bg-blue-900 text-white shadow-lg" : "text-gray-400 hover:text-blue-900"
            )}
          >
            <CreditCard size={20} />
            Paiements
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <Package size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-blue-900 mb-2">Aucune commande</h3>
                <p className="text-gray-500">Vous n'avez pas encore passé de commande.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-900">
                        <Package size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900">Commande #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-400">
                          Passée le {format(order.createdAt.toDate(), 'd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="font-bold text-blue-900">{formatCurrency(order.totalAmount)}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">{order.paymentType === 'cash' ? 'Paiement Cash' : 'Paiement Échelonné'}</div>
                      </div>
                      <div className={cn(
                        "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider h-fit",
                        order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                        order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                        order.status === 'delivered' ? "bg-green-100 text-green-700" : 
                        order.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg text-sm text-gray-600">
                          <span className="font-bold text-blue-900">{item.quantity}x</span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button 
                          onClick={() => cancelOrder(order.id)}
                          className="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                        >
                          <XCircle size={14} />
                          Annuler
                        </button>
                      )}
                      
                      {order.status === 'cancelled' && (
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-100"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="payments"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {paymentPlans.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <CreditCard size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-blue-900 mb-2">Aucun plan de paiement</h3>
                <p className="text-gray-500">Vous n'avez pas de paiement échelonné en cours.</p>
              </div>
            ) : (
              paymentPlans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className="bg-blue-900 p-8 text-white">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-yellow-500 mb-1">Plan de Paiement Échelonné</h3>
                        <p className="text-blue-200 text-sm">Commande #{plan.orderId.slice(0, 8)}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold">
                        {plan.status === 'active' ? 'EN COURS' : 'TERMINÉ'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Total à payer</p>
                        <p className="text-2xl font-bold">{formatCurrency(plan.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Déjà payé</p>
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(plan.totalAmount - plan.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Solde Restant</p>
                        <p className="text-2xl font-bold text-yellow-500">{formatCurrency(plan.remainingAmount)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Progression du paiement</p>
                        <p className="text-xl font-black text-white">
                          {Math.round(((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100)}%
                        </p>
                      </div>
                      <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 p-1 backdrop-blur-sm">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((plan.totalAmount - plan.remainingAmount) / plan.totalAmount) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h4 className="font-bold text-blue-900 mb-6 flex items-center gap-2">
                      <Clock size={20} className="text-yellow-500" />
                      Historique des versements
                    </h4>
                    <PaymentList planId={plan.id} />
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PaymentList = ({ planId }: { planId: string }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'payments'),
      where('paymentPlanId', '==', planId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'payments'));

    return () => unsubscribe();
  }, [planId]);

  if (loading) return <div className="animate-pulse h-20 bg-gray-50 rounded-xl"></div>;

  if (payments.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-gray-500 italic text-sm">
        <AlertCircle size={18} />
        Aucun versement enregistré pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              payment.status === 'completed' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
            )}>
              {payment.status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <p className="font-bold text-blue-900">{formatCurrency(payment.amount)}</p>
              <p className="text-xs text-gray-400">{format(payment.date.toDate(), 'd MMMM yyyy', { locale: fr })}</p>
            </div>
          </div>
          <div className={cn(
            "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full",
            payment.status === 'completed' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          )}>
            {payment.status === 'completed' ? 'Effectué' : 'En attente'}
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility for tailwind classes
// function cn(...inputs: any[]) {
//   return inputs.filter(Boolean).join(' ');
// }

export default ClientDashboard;
