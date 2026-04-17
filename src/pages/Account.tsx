import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { User, Package, LogOut, ChevronRight, Settings, Info, Bell, CreditCard, Save, X, Phone, MapPin, Mail, Camera, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { compressImage } from '../lib/imageUtils';

const Account = () => {
  const { profile, logout, isAdmin } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    photoURL: profile?.photoURL || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit check
        toast.error("L'image est trop lourde (max 5Mo)");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, photoURL: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), formData);
      toast.success("Profil mis à jour avec succès");
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    {
      title: 'Mon Profil',
      icon: <User className="text-blue-600" />,
      description: 'Gérer vos informations personnelles',
      onClick: () => setIsEditingProfile(true)
    },
    {
      title: 'Commandes & Paiements',
      icon: <ShoppingCart className="text-blue-900" />,
      description: 'Suivi de vos achats et versements',
      link: '/dashboard'
    },
    {
      title: 'Paramètres',
      icon: <Settings className="text-gray-600" />,
      description: 'Sécurité et préférences',
      link: '#',
      disabled: true
    }
  ];

  if (isAdmin) {
    menuItems.splice(1, 1, {
      title: 'Administration',
      icon: <Package className="text-blue-900" />,
      description: 'Accéder au panneau de gestion',
      link: '/admin'
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        <div className="bg-blue-900 p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <img 
              src={profile?.photoURL} 
              alt={profile?.displayName} 
              className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl"
            />
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile?.displayName}</h1>
              <p className="text-blue-200">{profile?.email}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                Compte {isAdmin ? 'Administrateur' : 'Client'}
              </div>
            </div>
          </div>
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!isEditingProfile ? (
              <motion.div 
                key="menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {menuItems.map((item, idx) => {
                  const content = (
                    <>
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-bold text-blue-900">{item.title}</h3>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                      {!item.disabled && <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-900 translate-x-0 group-hover:translate-x-1 transition-all" />}
                    </>
                  );

                  if (item.onClick) {
                    return (
                      <button 
                        key={idx} 
                        onClick={item.onClick}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-900 hover:bg-blue-50/30 transition-all group text-left"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link 
                      key={idx} 
                      to={item.disabled ? '#' : item.link!}
                      className={`flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-900 hover:bg-blue-50/30 transition-all group ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl mx-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-blue-900">Modifier mon profil</h2>
                  <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col items-center mb-8 relative">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img 
                        src={formData.photoURL || profile?.photoURL} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full border-4 border-gray-100 object-cover shadow-lg group-hover:opacity-75 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white drop-shadow-md" size={32} />
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 text-xs font-bold text-blue-900 border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2"
                    >
                      <Camera size={14} />
                      Changer la photo
                    </button>
                    <p className="mt-2 text-[10px] text-gray-400 italic">Format JPG, PNG (Max 5Mo)</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text"
                          required
                          value={formData.displayName || ''}
                          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all"
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email (Non modifiable)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="email"
                          disabled
                          value={profile?.email || ''}
                          className="w-full bg-gray-100 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all"
                          placeholder="Votre numéro de téléphone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse de livraison</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3 text-gray-400" size={18} />
                        <textarea 
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-900 transition-all min-h-[100px]"
                          placeholder="Votre adresse complète"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-4 rounded-xl border border-gray-100 font-bold text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-4 rounded-xl bg-blue-900 text-white font-bold shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Save size={20} /> Enregistrer</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
            >
              <LogOut size={20} />
              Se déconnecter
            </button>
          </div>
        </div>
      </motion.div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">PENTA GAD DISTRIBUTION - Espace Client Sécurisé</p>
      </div>
    </div>
  );
};

export default Account;
