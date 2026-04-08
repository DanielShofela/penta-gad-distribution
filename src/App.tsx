import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { Toaster } from 'sonner';
import { ShoppingCart, User, LogOut, LayoutDashboard, Home as HomeIcon, Package, CreditCard, Menu, X, Plus, Trash2, ChevronRight, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = () => {
  const { user, profile, login, logout, isAdmin, settings } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = React.useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-yellow-500 font-bold text-xl">P</div>
              )}
              <span className="text-lg sm:text-xl font-bold text-blue-900">{settings?.siteName || "PENTA GAD"}</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-600 hover:text-blue-900 font-medium py-2">
                Articles <ChevronDown size={16} />
              </button>
              <div className="absolute left-0 mt-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2 text-xs uppercase tracking-wider">Électroménagers</h4>
                    <ul className="space-y-1">
                      <li><Link to="/?category=refrigerateurs" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Réfrigérateurs</Link></li>
                      <li><Link to="/?category=fours" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Fours & Cuisson</Link></li>
                      <li><Link to="/?category=lave-vaisselle" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Lave-vaisselle</Link></li>
                      <li><Link to="/?category=petit-electromenager" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Petit Électroménager</Link></li>
                    </ul>
                  </div>
                  <div className="border-t border-gray-50 pt-3">
                    <h4 className="font-bold text-blue-900 mb-2 text-xs uppercase tracking-wider">Meubles</h4>
                    <ul className="space-y-1">
                      <li><Link to="/?category=salons" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Salons</Link></li>
                      <li><Link to="/?category=chambres" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Chambres à coucher</Link></li>
                      <li><Link to="/?category=salles-a-manger" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Salles à manger</Link></li>
                      <li><Link to="/?category=decoration" className="text-sm text-gray-600 hover:text-blue-900 block py-1">Décoration</Link></li>
                    </ul>
                  </div>
                  <div className="border-t border-gray-50 pt-3">
                    <Link to="/" className="text-sm font-bold text-blue-900 hover:underline">Tout le catalogue</Link>
                  </div>
                </div>
              </div>
            </div>
            {user ? (
              <>
                <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-gray-600 hover:text-blue-900 font-medium">
                  {isAdmin ? "Admin Panel" : "Mes Commandes"}
                </Link>
                <div className="relative group">
                  <button className="text-gray-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-50 transition-all">
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                    <AlertCircle size={24} />
                  </button>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <h4 className="font-bold text-blue-900 mb-3 text-sm">Notifications</h4>
                    <div className="space-y-3">
                      <div className="text-xs p-2 bg-blue-50 rounded-lg text-blue-800 border border-blue-100">
                        <p className="font-bold">Nouvelle Promotion !</p>
                        <p>Profitez de -10% sur la gamme Miele ce weekend.</p>
                      </div>
                      <div className="text-xs p-2 bg-yellow-50 rounded-lg text-yellow-800 border border-yellow-100">
                        <p className="font-bold">Rappel Paiement</p>
                        <p>Votre prochaine mensualité est prévue pour le 1er du mois.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Link to="/cart" className="relative text-gray-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-50 transition-all">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <img src={profile?.photoURL} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  <button onClick={logout} className="text-gray-600 hover:text-red-600">
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <button onClick={login} className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors">
                Connexion
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            {user && (
              <Link to="/cart" className="relative text-gray-600">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-blue-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Articles</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/?category=refrigerateurs" onClick={() => setIsOpen(false)} className="text-sm text-gray-600 py-1">Réfrigérateurs</Link>
                  <Link to="/?category=fours" onClick={() => setIsOpen(false)} className="text-sm text-gray-600 py-1">Fours</Link>
                  <Link to="/?category=lave-vaisselle" onClick={() => setIsOpen(false)} className="text-sm text-gray-600 py-1">Lave-vaisselle</Link>
                  <Link to="/?category=salons" onClick={() => setIsOpen(false)} className="text-sm text-gray-600 py-1">Salons</Link>
                  <Link to="/?category=chambres" onClick={() => setIsOpen(false)} className="text-sm text-gray-600 py-1">Chambres</Link>
                  <Link to="/" onClick={() => setIsOpen(false)} className="text-sm font-bold text-blue-900 py-1">Tout voir</Link>
                </div>
              </div>
              {user ? (
                <>
                  <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setIsOpen(false)} className="block text-gray-600 font-medium">
                    {isAdmin ? "Admin Panel" : "Mes Commandes"}
                  </Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left text-red-600 font-medium">
                    Déconnexion
                  </button>
                </>
              ) : (
                <button onClick={() => { login(); setIsOpen(false); }} className="w-full bg-blue-900 text-white px-4 py-2 rounded-lg font-medium">
                  Connexion
                </button>
              )}
            </div>
          </motion.div>
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
