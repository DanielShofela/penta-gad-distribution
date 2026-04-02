import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, PaymentPlan, Payment } from '../types';
import { Package, CreditCard, Clock, CheckCircle, ChevronRight, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');

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
            onClick={() => setActiveTab('orders')}
            className={cn(
              "px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2",
              activeTab === 'orders' ? "bg-blue-900 text-white shadow-lg" : "text-gray-400 hover:text-blue-900"
            )}
          >
            <Package size={20} />
            Commandes
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
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
                        <div className="font-bold text-blue-900">{order.totalAmount.toLocaleString()} €</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">{order.paymentType === 'cash' ? 'Paiement Cash' : 'Paiement Échelonné'}</div>
                      </div>
                      <div className={cn(
                        "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        order.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                        order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                        order.status === 'delivered' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-4 flex flex-wrap gap-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg text-sm text-gray-600">
                        <span className="font-bold text-blue-900">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-bold">{plan.totalAmount.toLocaleString()} €</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Restant</p>
                        <p className="text-2xl font-bold text-yellow-500">{plan.remainingAmount.toLocaleString()} €</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Mensualités</p>
                        <p className="text-2xl font-bold">{plan.installmentsCount} mois</p>
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
              <p className="font-bold text-blue-900">{payment.amount.toLocaleString()} €</p>
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
