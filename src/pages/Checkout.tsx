import React, { useState } from 'react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { collection, addDoc, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PaymentType, OrderStatus, Order } from '../types';
import { CreditCard, Banknote, ShieldCheck, ChevronRight, CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const Checkout = () => {
  const { cart, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (!user || cart.length === 0) return;
    setIsProcessing(true);

    try {
      const orderData = {
        clientId: user.uid,
        items: cart.map(item => ({
          itemId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        paymentType,
        status: 'pending' as OrderStatus,
        createdAt: Timestamp.now()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // If installment, create a payment plan
      if (paymentType === 'installment') {
        const planData = {
          orderId: orderRef.id,
          clientId: user.uid,
          totalAmount: total,
          remainingAmount: total,
          installmentsCount: 10, // Default 10 installments
          status: 'active'
        };
        await addDoc(collection(db, 'paymentPlans'), planData);
      }

      // Update stock (simplified)
      for (const item of cart) {
        const itemRef = doc(db, 'items', item.id);
        await updateDoc(itemRef, {
          stock: increment(-item.quantity)
        });
      }

      clearCart();
      setIsSuccess(true);
      toast.success("Commande passée avec succès !");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
      toast.error("Erreur lors de la commande");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Merci pour votre confiance !</h2>
          <p className="text-gray-500 mb-8 text-lg">
            Votre commande a été enregistrée avec succès. Notre équipe va procéder à sa validation et à l'organisation de la livraison premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/dashboard" 
              className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-800 transition-all"
            >
              Suivre ma commande
            </Link>
            <Link 
              to="/" 
              className="bg-gray-100 text-gray-600 px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all"
            >
              Retour au catalogue
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* User Info */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <CheckCircle size={24} className="text-green-500" />
              Informations de livraison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nom complet</label>
                <div className="p-3 bg-gray-50 rounded-xl text-blue-900 font-medium border border-gray-100">
                  {profile?.displayName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <div className="p-3 bg-gray-50 rounded-xl text-blue-900 font-medium border border-gray-100">
                  {profile?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-yellow-500" />
              Mode de paiement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setPaymentType('cash')}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                  paymentType === 'cash' ? "border-blue-900 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className={cn("p-3 rounded-xl", paymentType === 'cash' ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-400")}>
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Paiement Cash</h3>
                  <p className="text-sm text-gray-500">Paiement intégral à la commande</p>
                </div>
              </button>

              <button 
                onClick={() => setPaymentType('installment')}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                  paymentType === 'installment' ? "border-blue-900 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className={cn("p-3 rounded-xl", paymentType === 'installment' ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-400")}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Paiement Échelonné</h3>
                  <p className="text-sm text-gray-500">Réglez en 10 mensualités sans frais</p>
                </div>
              </button>
            </div>

            {paymentType === 'installment' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm"
              >
                <p className="font-bold mb-1">Détails du plan :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Montant mensuel : {(total / 10).toLocaleString()} €</li>
                  <li>Durée : 10 mois</li>
                  <li>Frais de dossier : 0 €</li>
                </ul>
              </motion.div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-blue-900 mb-6">Résumé de la commande</h2>
            <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-900">{item.quantity}x</span>
                    <span className="text-gray-600 line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-bold text-blue-900">{(item.price * item.quantity).toLocaleString()} €</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2 mb-8">
              <div className="flex justify-between text-gray-400">
                <span>Sous-total</span>
                <span>{total.toLocaleString()} €</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Livraison</span>
                <span className="text-green-500 font-medium">Gratuit</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-blue-900 pt-2">
                <span>Total</span>
                <span>{total.toLocaleString()} €</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:bg-gray-300"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  Confirmer la commande
                  <ChevronRight size={20} />
                </>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={16} className="text-blue-900" />
              Paiement 100% sécurisé par LuxAppliance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
