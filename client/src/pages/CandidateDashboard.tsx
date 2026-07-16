import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Clock, 
  Play, 
  LogOut, 
  HelpCircle, 
  Bell,
  User,
  Settings,
  X,
  Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import evalixLogoWithoutText from '../assets/evalix-logo-without-text.png';
import { API_BASE_URL, apiUrl } from '../config/api';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: any[];
  startTime: string;
  endTime: string;
}

export const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Profile modal states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fetch initial assessments
  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl('/assessments'), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get logged-in user profile
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setProfileName(u.name || '');
      setProfileEmail(u.email || '');
    }

    fetchAssessments();

    // 2. Setup Socket.io real-time connection to backend
    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      console.log("Connected to real-time proctor socket.");
    });

    socket.on("assessment_created", (newAssessment: Assessment) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#111827] border border-indigo-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-3 text-left`}>
          <Bell className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="text-xs font-bold text-white">New Assessment Released!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">"{newAssessment.title}" is now active in your dashboard.</p>
          </div>
        </div>
      ), { duration: 6000 });

      // Append new assessment to list
      setAssessments(prev => [newAssessment, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('evalix_auth_token');
    localStorage.removeItem('evalix_user');
    localStorage.removeItem('evalix_current_test');
    toast.success('Logged out of secure exam session.');
    navigate('/login');
  };

  const handleStartTest = (testId: string) => {
    const selectedTest = assessments.find(a => a._id === testId);
    if (selectedTest) {
      localStorage.setItem('evalix_current_test', JSON.stringify(selectedTest));
    } else {
      localStorage.removeItem('evalix_current_test');
    }
    toast.success("Exam authorized. Launching secure sandbox environment...");
    navigate('/assessment');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl('/update-profile'), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          password: profilePassword || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Credentials updated successfully!");
        localStorage.setItem('evalix_auth_token', data.token);
        localStorage.setItem('evalix_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsProfileOpen(false);
        setProfilePassword('');
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Update request failed");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={evalixLogoWithoutText} alt="Evalix" className="h-6 w-auto" />
          <span className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
            Evalix Candidate Dashboard
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-300">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
            </div>
          )}
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-2 px-3 rounded-lg hover:bg-indigo-500/10 cursor-pointer font-semibold"
          >
            <Settings className="w-4 h-4" />
            Profile Settings
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors py-2 px-3 rounded-lg hover:bg-rose-500/10 cursor-pointer font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Workspace */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold font-['Outfit'] tracking-tight">Active Evaluations</h1>
          <p className="text-slate-400 text-sm">Below are the assessments scheduled for your profile. Select one to launch the secure IDE sandbox.</p>
        </div>

        {/* List of Assessments */}
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-500 font-mono animate-pulse">
            Fetching secure proctor streams...
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((a) => (
              <div key={a._id} className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-6 hover:border-indigo-500/20 transition-all bg-gradient-to-r hover:from-slate-950/40 hover:to-indigo-950/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 font-mono uppercase">
                      Python 3 Sandbox
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {a.durationMinutes} mins
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{a.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Questions: {a.questions?.length || 1}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest(a._id)}
                    className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Launch Test Session</span>
                    <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}

            {/* Default Static assessment if DB is empty */}
            {assessments.length === 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 font-mono uppercase">
                      Seeded Demo
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      60 mins
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Default Coding Challenge</h3>
                    <p className="text-xs text-slate-400">Validate substring patterns with sandbox compliance proctoring checks.</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest("coding-demo")}
                    className="w-full sm:w-auto py-3 px-5 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Launch Test Session</span>
                    <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 space-y-6 relative animate-enter shadow-2xl bg-[#090d1a]">
            {/* Close Button */}
            <button 
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-['Outfit']">Profile Settings</h3>
              <p className="text-xs text-slate-400">Update your account registration credentials below.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Change Password (Leave blank to keep current)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    placeholder="Enter new password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingProfile ? 'Saving...' : 'Update Credentials'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
