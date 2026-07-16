import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowLeft,
  Settings,
  LogOut,
  Laptop
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../config/api';

export const RecruiterProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load user data
  useEffect(() => {
    // Immediate pre-population from local storage
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setName(u.name || '');
      setEmail(u.email || '');
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('evalix_auth_token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetch(apiUrl('/me'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.user) {
          const u = data.user;
          setUser(u);
          setName(u.name || '');
          setEmail(u.email || '');
          // Keep local storage updated
          localStorage.setItem('evalix_user', JSON.stringify(u));
        } else {
          toast.error("Failed to load recruiter profile");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error connecting to server");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('evalix_auth_token');
      
      const payload: any = {
        name,
        email
      };

      if (newPassword) {
        if (!currentPassword) {
          toast.error("Current password is required to set a new password.");
          setIsSaving(false);
          return;
        }
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }

      const response = await fetch(apiUrl('/update-profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Recruiter profile updated successfully!");
        localStorage.setItem('evalix_auth_token', data.token);
        localStorage.setItem('evalix_user', JSON.stringify(data.user));
        setUser(data.user);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Update request failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('evalix_auth_token');
    localStorage.removeItem('evalix_user');
    localStorage.removeItem('evalix_current_test');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden bg-grid-pattern flex">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Sidebar - Consistent with Recruiter Dashboard */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md p-6 flex flex-col justify-between shrink-0 hidden md:flex z-20 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/10">
              <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center">
                <Laptop className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-sm font-extrabold text-white font-['Outfit'] uppercase tracking-wider block">Evalix</span>
              <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">Recruiter Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button 
              onClick={() => navigate('/recruiter-dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer text-left font-['Outfit'] tracking-wide"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/recruiter-profile')}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-white bg-indigo-600/10 border border-indigo-500/20 rounded-xl cursor-pointer text-left font-['Outfit'] tracking-wide"
            >
              <User className="w-4 h-4 text-indigo-400" />
              Recruiter Profile
            </button>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/5 transition-all cursor-pointer font-['Outfit'] tracking-wide"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/recruiter-dashboard')}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
              Profile Settings
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-300">{user.name}</div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Recruiter Access</div>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase select-none">
              {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'R'}
            </div>
          </div>
        </header>

        {/* Profile Form */}
        <main className="max-w-3xl w-full mx-auto px-8 py-10 flex-grow">
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold font-['Outfit'] tracking-tight">Edit Corporate Profile</h1>
              <p className="text-slate-400 text-sm">Update your corporate name, email address, and console passwords.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 bg-slate-950/20">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Assessor Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Admin Recruiter"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input 
                        type="email" 
                        required
                        disabled
                        value={email}
                        placeholder="admin@recruiter.evalix.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-850 rounded-xl text-xs text-slate-400 cursor-not-allowed opacity-70 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password credentials block */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 bg-slate-950/20">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2">Change Password</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/recruiter-dashboard')}
                  className="py-3 px-6 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-['Outfit'] tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-600/20 cursor-pointer font-['Outfit'] tracking-wide"
                >
                  {isSaving ? "Saving profile..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
