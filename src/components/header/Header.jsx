import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaClipboardList, FaShoppingCart, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /*
  ============================================================================
  == IMPORTANT NOTE FOR IMPLEMENTATION:                                     ==
  ============================================================================
  Because this header is fixed and has a RESPONSIVE height, you must
  add responsive top padding to your main content container to prevent it
  from being hidden underneath.

  Example in your main layout file (e.g., App.js):
  
  <div>
    <Header />
    <main className="pt-16 lg:pt-20"> // <--- THIS IS THE REQUIRED CHANGE
      {/* Your page content (Routes, etc.) will go here * /}
    </main>
  </div>
  ============================================================================
  */

  return (
    <>
      <header className="fixed w-full top-0 z-40 bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- CHANGE: Responsive header height --- */}
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center space-x-3 group">
                {/* --- CHANGE: Responsive logo font size --- */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Taaza</h1>
            </Link>

            {/* --- CHANGE: Responsive spacing and font size for nav links --- */}
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Link to="/" className={`flex items-center space-x-2 px-3 py-2 lg:px-5 rounded-lg text-sm lg:text-base font-medium transition-colors ${location.pathname === '/' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                <FaHome /> <span>Home</span>
                  </Link>
              <Link to="/orders" className={`flex items-center space-x-2 px-3 py-2 lg:px-5 rounded-lg text-sm lg:text-base font-medium transition-colors ${location.pathname === '/orders' ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}>
                <FaClipboardList /> <span>Orders</span>
                  </Link>
              <Link to="/cart" className="flex items-center space-x-2 px-3 py-2 lg:px-5 rounded-lg text-sm lg:text-base font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                <FaShoppingCart /> <span>Cart</span>
                </Link>
            </nav>

            <div className="flex items-center space-x-3">
              {user ? (
                <div className="relative">
                  {/* --- CHANGE: Responsive user menu icon and font size --- */}
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <FaUser className="text-slate-600 text-lg lg:text-xl" />
                    <span className="hidden sm:block text-sm lg:text-base font-medium text-slate-700">{user.name || 'User'}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                      <div className="p-2 border-b">
                        <p className="text-sm lg:text-base font-semibold">{user.name}</p>
                        <p className="text-xs lg:text-sm text-slate-500">{user.mobile}</p>
                      </div>
                      <button onClick={handleLogout} className="w-full flex items-center space-x-2 p-2 text-sm lg:text-base text-red-600 hover:bg-red-50">
                        <FaSignOutAlt /> <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="hidden md:flex items-center text-sm lg:text-base font-medium text-slate-600 hover:text-slate-900">Login</Link>
              )}
              <button onClick={toggleMobileMenu} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
                <FaBars size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`md:hidden fixed inset-0 z-50 transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60" onClick={closeMobileMenu}></div>
        <div className={`absolute top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-xl transition-transform flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between p-4 border-b">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={closeMobileMenu}><FaTimes size={20} /></button>
          </div>
          <nav className="flex-grow p-4 space-y-2">
            <Link to="/" onClick={closeMobileMenu} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100"><FaHome /><span>Home</span></Link>
            <Link to="/orders" onClick={closeMobileMenu} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100"><FaClipboardList /><span>Orders</span></Link>
            <Link to="/cart" onClick={closeMobileMenu} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100"><FaShoppingCart /><span>Cart</span></Link>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Header; 