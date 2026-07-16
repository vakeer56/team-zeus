import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Clock, 
  Play, 
  LogOut, 
  HelpCircle, 
  User,
  Laptop,
  CheckSquare,
  TrendingUp,
  Brain,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, apiUrl } from '../config/api';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  duration: number;
  questions: any[];
  difficulty: string;
  status: string;
}

export const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Fetch assessments
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
        setAssessments(data.data || data.assessments || []);
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
    }
  };

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl('/submissions'), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load candidate submissions:", err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchAssessments(), fetchSubmissions()]);
    setIsLoading(false);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    loadData();

    // Socket.io updates
    const socket = io(API_BASE_URL);
    socket.on("connect", () => {
      console.log("Connected to real-time proctor socket.");
    });

    socket.on("assessment_created", (newAssessment: any) => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#111827] border border-indigo-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-3 text-left`}>
          <div>
            <p className="text-xs font-bold text-white">New Assessment Released!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">"{newAssessment.title}" is now active in your dashboard.</p>
          </div>
        </div>
      ), { duration: 6000 });

      setAssessments(prev => [newAssessment, ...prev]);
    });

    socket.on("submission_updated", () => {
      fetchSubmissions();
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
      // Compatibility mapping for frontend execution environments that expect durationMinutes
      const mappedTest = {
        ...selectedTest,
        durationMinutes: selectedTest.duration || 60
      };
      localStorage.setItem('evalix_current_test', JSON.stringify(mappedTest));
    } else {
      localStorage.removeItem('evalix_current_test');
    }
    toast.success("Exam authorized. Launching secure sandbox environment...");
    navigate('/assessment');
  };

  // Dynamic statistics calculations
  const nonDisqualifiedSubmissions = submissions.filter(s => s.status !== 'disqualified');
  
  const assessmentsTaken = submissions.length;
  
  const averageScore = nonDisqualifiedSubmissions.length > 0 
    ? Math.round(nonDisqualifiedSubmissions.reduce((acc, s) => acc + (s.totalScore || 0), 0) / nonDisqualifiedSubmissions.length)
    : 0;

  const skillStrength = averageScore > 0 ? Math.round((averageScore / 10) * 10) / 10 : 0;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex relative bg-grid-pattern">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 backdrop-blur-md p-6 flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-20">
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
              <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">AI-Powered Assessments</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button 
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-white bg-indigo-600/10 border border-indigo-500/20 rounded-xl cursor-pointer text-left font-['Outfit'] tracking-wide"
            >
              <Laptop className="w-4 h-4 text-indigo-400" />
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-all cursor-pointer text-left font-['Outfit'] tracking-wide"
            >
              <User className="w-4 h-4 text-slate-500" />
              Skill Profile
            </button>
          </nav>
        </div>

        {/* AI Proctoring Active Panel */}
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5 bg-gradient-to-r from-purple-950/10 to-indigo-950/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">AI Proctoring Active</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Your integrity. Our priority.</p>
          </div>
          
          <div className="text-[10px] text-slate-600 font-medium text-center">
            &copy; 2026 Evalix. All rights reserved.
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-grow flex flex-col min-h-screen relative z-10">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-sm" />
            <span className="text-xs font-bold text-slate-400 font-['Outfit'] uppercase tracking-wider">
              Evalix Candidate Dashboard
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {user && (
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-300">{user.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                </div>
              )}
              <div 
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white uppercase select-none cursor-pointer hover:opacity-90 active:scale-95 transition-all animate-fade-in"
              >
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'U'}
              </div>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="max-w-6xl w-full mx-auto px-8 py-8 space-y-8 flex-grow">
          {/* Welcome Hero block */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a0f24] to-[#12082b] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-4 max-w-xl animate-fade-in">
              <span className="text-xs text-slate-400 font-medium">Welcome back,</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight text-white">
                {user?.name || 'Testing User'} 👋
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Track your assessments, showcase your skills, and unlock new opportunities in isolated sandbox proctor suites.
              </p>
            </div>
            
            {/* Visual simulation card on the right */}
            <div className="relative shrink-0 w-64 h-40 bg-[#030712]/60 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Telemetry Shield</span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div className="space-y-1.5">
                <div className="h-1 w-24 bg-indigo-500/30 rounded" />
                <div className="h-1 w-32 bg-purple-500/20 rounded" />
                <div className="h-1 w-20 bg-indigo-500/20 rounded" />
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Isolated Sandbox Active</div>
            </div>
          </div>

          {/* Stats Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
            {/* Stats Card 1 */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-indigo-500/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Assessments Taken</span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">{assessmentsTaken}</span>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> Sync Active
                </span>
              </div>
            </div>

            {/* Stats Card 2 */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-indigo-500/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Average Score</span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">{averageScore}%</span>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> Average weighted percentage
                </span>
              </div>
            </div>

            {/* Stats Card 3 */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4 hover:border-indigo-500/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Skill Strength</span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">{skillStrength}/10</span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Sync Active</span>
              </div>
            </div>
          </div>

          {/* Active Evaluations List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-indigo-500 rounded-sm" />
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Active Evaluations</h2>
              </div>
              <button className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-xs text-slate-600 font-mono animate-pulse">
                Fetching secure evaluation streams...
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((a) => {
                  const sub = submissions.find(s => s.assessmentId?._id === a._id || s.assessmentId === a._id);
                  const isSubDisqualified = sub?.status === 'disqualified';
                  const isSubCompleted = sub?.status === 'submitted' || sub?.status === 'evaluated';

                  return (
                    <div 
                      key={a._id} 
                      className={`relative overflow-hidden p-6 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-6 transition-all shadow-xl bg-gradient-to-r ${
                        isSubDisqualified 
                          ? 'border-rose-500/30 from-[#1f070d]/60 to-[#030712]/85 hover:border-rose-500/50' 
                          : (isSubCompleted ? 'border-slate-800/40 from-[#030712]/40 to-[#030712]/80 hover:border-slate-700/50' : 'border-indigo-500/30 from-[#0d071f]/60 to-[#030712]/80 hover:border-indigo-500/50')
                      }`}
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 font-mono uppercase">
                            Python 3 Sandbox
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {a.duration || 60} mins
                          </span>
                          {isSubDisqualified && (
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 font-mono flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 animate-pulse" />
                              DISQUALIFIED
                            </span>
                          )}
                          {isSubCompleted && (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-mono">
                              COMPLETED ({sub.totalScore}%)
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-white font-['Outfit']">{a.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                            {a.description || 'Seeded test assessment to verify portal environment.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                            Questions: {a.questions?.length || 1}
                          </span>
                          <span>•</span>
                          <span>Type: Coding</span>
                          {isSubDisqualified && (
                            <>
                              <span>•</span>
                              <span className="text-rose-400 font-bold">Awaiting Recruiter Approval</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-stretch sm:items-end justify-center gap-2">
                        {isSubDisqualified ? (
                          <button
                            disabled
                            className="py-3 px-6 bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <span>Locked Session</span>
                          </button>
                        ) : isSubCompleted ? (
                          <button
                            disabled
                            className="py-3 px-6 bg-slate-900/50 border border-slate-900 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                          >
                            <span>Submitted</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTest(a._id)}
                            className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                          >
                            <span>Launch Test Session</span>
                            <Play className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform fill-white" />
                          </button>
                        )}
                        <span className="text-[9px] text-slate-500 font-mono text-center sm:text-right block">Secure IDE Sandbox</span>
                      </div>
                    </div>
                  );
                })}

                {assessments.length === 0 && (
                  <div className="relative overflow-hidden p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#0d071f]/60 to-[#030712]/80 flex flex-col sm:flex-row justify-between sm:items-center gap-6 shadow-xl">
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 font-mono uppercase">
                          Python 3 Sandbox
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          90 mins
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white font-['Outfit'] font-extrabold">Test Assessment</h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                          Seeded test assessment to verify portal environment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
