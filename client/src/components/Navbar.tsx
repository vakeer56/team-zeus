import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import evalixLogoWithText from '../assets/evalix-logo-with-text.png';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location]);
  
  const isActive = (path: string) => location.pathname === path;

  // For landing page sub-sections
  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('evalix_auth_token');
    localStorage.removeItem('evalix_user');
    localStorage.removeItem('evalix_current_test');
    localStorage.removeItem('evalix_exam_progress_secure');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-2xl glass-panel shadow-2xl transition-all duration-300">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src={evalixLogoWithText} 
            alt="Evalix" 
            className="h-9 w-auto object-contain group-hover:scale-[1.02] transition-transform duration-200" 
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link 
            to="/" 
            className={`hover:text-white transition-colors duration-200 ${isActive('/') ? 'text-white font-semibold' : ''}`}
          >
            Home
          </Link>
          <button 
            onClick={() => scrollToSection('features')} 
            className="hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="hover:text-white transition-colors duration-200 cursor-pointer"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('stats')} 
            className="hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Dynamic CTA / User Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200">{user.name}</div>
                <div className="text-[10px] text-indigo-400 font-semibold font-mono uppercase tracking-wider">
                  {user.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </div>
              </div>
              <Link
                to={user.role === 'recruiter' ? '/recruiter-dashboard' : '/candidate-dashboard'}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-2 px-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold py-2 px-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="relative inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-300 group hover:scale-[1.02]"
            >
              Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

