import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { Toaster } from 'sonner';
import { ShoppingCart, User, LogOut, LayoutDashboard, Home as HomeIcon, Package, CreditCard, Menu, X, Plus, Trash2, ChevronRight, CheckCircle, Clock, AlertCircle, ChevronDown, Grid, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { CATEGORY_GROUPS } from './constants';

// --- Components ---

const Navbar = () => {
  const { user, profile, login, logout, isAdmin, settings, isLoggingIn } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? [] : [id]
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile Menu Toggle (Left) */}
            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
            {/* Desktop Catalogue Menu */}
            <div className="hidden md:block relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-blue-900 font-medium py-2">
                Catalogue <ChevronDown size={16} />
              </button>
              <div className="absolute left-0 mt-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 overflow-y-auto max-h-[80vh]">
                <div className="space-y-1">
                  {CATEGORY_GROUPS.map((group) => {
                    const isExpanded = expandedGroups.includes(group.id);
                    return (
                      <div key={group.id} className="border-b border-gray-50 last:border-0">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleGroup(group.id);
                          }}
                          className="flex items-center justify-between w-full py-2.5 hover:bg-gray-50 rounded-lg transition-colors px-3"
                        >
                          <h4 className="font-bold text-blue-900 text-[10px] uppercase tracking-widest text-left leading-tight pr-2">{group.name}</h4>
                          <ChevronDown size={14} className={cn("text-gray-400 transition-transform flex-shrink-0", isExpanded && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-1 pl-6 pt-1 pb-3">
                                {group.categories.map((cat) => (
                                  <Link 
                                    key={cat.id} 
                                    to={`/?category=${cat.id}`} 
                                    className="text-xs text-gray-500 py-1.5 hover:text-blue-900 block border-l border-gray-100 pl-3 hover:border-blue-900 transition-colors"
                                  >
                                    {cat.name}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link to="/" className="text-xs font-bold text-blue-900 hover:text-yellow-600 flex items-center justify-center gap-2 group/all">
                    Tout le catalogue <ChevronRight size={14} className="group-hover/all:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/" className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-yellow-500 font-bold text-xl">P</div>
              )}
              <span className="text-lg sm:text-xl font-bold text-blue-900">{settings?.siteName || "PENTA GAD"}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <div className="relative group">
                  <button className="text-gray-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-50 transition-all">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                    <Bell size={24} />
                  </button>
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <h4 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
                       <Bell size={16} className="text-yellow-500" /> Notifications
                    </h4>
                    <div className="space-y-3">
                      <div className="text-xs p-3 bg-blue-50 rounded-xl text-blue-800 border border-blue-100 group/notif">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">🔥</span>
                          <div>
                            <p className="font-bold">Promotion de Pâques !</p>
                            <p className="opacity-80">Jusqu'à -15% sur tous les réfrigérateurs LG cette semaine.</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs p-3 bg-red-50 rounded-xl text-red-800 border border-red-100">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">⚠️</span>
                          <div>
                            <p className="font-bold">Retard de paiement</p>
                            <p className="opacity-80">Votre mensualité du 15 Avril est en attente. Merci de régulariser.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <Link to="/cart" className="relative text-gray-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-50 transition-all">
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-yellow-500 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <Link to="/account" className="relative group">
                    <img 
                      src={profile?.photoURL} 
                      alt="Account" 
                      className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-blue-900 transition-all object-cover shadow-sm"
                    />
                  </Link>
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-bold text-blue-900 leading-tight">{profile?.displayName?.split(' ')[0]}</p>
                    <button onClick={logout} className="text-[10px] uppercase font-black text-red-400 hover:text-red-600 tracking-tighter transition-colors">Déconnexion</button>
                  </div>
                </div>
              </>
            ) : (
              <button 
                onClick={login} 
                disabled={isLoggingIn}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? "Connexion..." : "Connexion"}
              </button>
            )}
          </div>

          {/* Mobile Cart Action */}
          <div className="md:hidden flex items-center gap-4">
            {user && !isAdmin && (
              <Link to="/cart" className="relative text-gray-600">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-blue-900/20 backdrop-blur-[2px] z-[60]"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings?.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-yellow-500 font-bold text-lg">P</div>
                  )}
                  <span className="text-base font-bold text-blue-900">{settings?.siteName || "PENTA GAD"}</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 p-1">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                <div>
                  <Link to="/" onClick={() => setIsOpen(false)} className="text-xs font-black text-blue-900 border-b border-gray-100 pb-2 mb-4 flex items-center justify-between group uppercase tracking-widest">
                    Tout le catalogue <ChevronRight size={14} />
                  </Link>
                  <div className="space-y-4">
                    {CATEGORY_GROUPS.map((group) => {
                      const isExpanded = expandedGroups.includes(group.id);
                      return (
                        <div key={group.id} className="border-b border-gray-50 pb-2">
                          <button 
                            onClick={() => toggleGroup(group.id)}
                            className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded-lg transition-colors px-2"
                          >
                            <h4 className="font-bold text-blue-900 text-[10px] uppercase tracking-widest text-left">{group.name}</h4>
                            <ChevronDown size={14} className={cn("text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 gap-1 pl-4 pt-2 pb-2">
                                  {group.categories.map((cat) => (
                                    <Link 
                                      key={cat.id} 
                                      to={`/?category=${cat.id}`} 
                                      onClick={() => setIsOpen(false)} 
                                      className="text-sm text-gray-500 py-1.5 hover:text-blue-900 block"
                                    >
                                      {cat.name}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  {user ? (
                    <div className="space-y-6">
                      <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <img src={profile?.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                        <div>
                          <p className="font-bold text-blue-900 text-sm">{profile?.displayName}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Mon Compte</p>
                        </div>
                      </Link>
                      <div className="grid grid-cols-1 gap-1">
                        <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 font-bold py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors text-sm">
                          <User size={16} /> Mon Espace Client
                        </Link>
                        <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 font-bold py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors text-sm">
                          <Package size={16} /> {isAdmin ? "Admin Panel" : "Commandes & Paiements"}
                        </Link>
                        <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center gap-2 w-full text-left text-red-600 font-bold py-3 mt-4 border-t border-gray-50 px-2 transition-colors">
                          <LogOut size={16} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { login(); setIsOpen(false); }} 
                      disabled={isLoggingIn}
                      className="w-full bg-blue-900 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-sm"
                    >
                      {isLoggingIn ? "Connexion..." : "Connexion"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const { settings } = useAuth();
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logoUrl ? (
                <div className="bg-white p-1.5 rounded-xl shadow-sm inline-block">
                  <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-900 font-bold text-xl">P</div>
              )}
              <span className="text-xl font-bold text-yellow-500">{settings?.siteName || "PENTA GAD"}</span>
            </div>
            <p className="text-blue-100 opacity-80">
              L'excellence de l'électroménager de luxe à votre portée. Qualité, design et innovation.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Liens Rapides</h3>
            <ul className="space-y-2 text-blue-100 opacity-80">
              <li><Link to="/">Articles</Link></li>
              <li>À propos</li>
              <li>Contact</li>
              <li>Conditions de vente</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-500">Contact</h3>
            <p className="text-blue-100 opacity-80">
              8WMR+39 Abidjan.<br />
              Cité sgbci, Abidjan<br />
              pentagad.distribution@gmail.com
            </p>
          </div>
        </div>
        <div className="border-t border-blue-800 mt-12 pt-8 text-center text-blue-200 text-sm">
          © 2026 {settings?.siteName || "PENTA GAD"}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

// --- Pages ---

import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ItemDetail from './pages/ItemDetail';
import Account from './pages/Account';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/item/:id" element={<ItemDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/dashboard" element={<ClientDashboard />} />
                <Route path="/account" element={<Account />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-center" richColors />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
