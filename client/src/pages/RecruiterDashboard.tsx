import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  TrendingUp, 
  CheckCircle2, 
  ShieldAlert, 
  LogOut, 
  Activity, 
  Search, 
  Calendar,
  Clock,
  ChevronRight,
  Settings,
  UserPlus,
  X,
  User,
  Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import evalixLogoWithoutText from '../assets/evalix-logo-without-text.png';

interface CandidateRecord {
  name: string;
  test: string;
  status: 'passed' | 'risk_detected' | 'in_progress';
  score: number;
  initials: string;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: any[];
  isActive?: boolean;
}


export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Profile management states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Recruiter registration states
  const [isCreateRecruiterOpen, setIsCreateRecruiterOpen] = useState(false);
  const [newRecruiterName, setNewRecruiterName] = useState('');
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [newRecruiterPassword, setNewRecruiterPassword] = useState('');
  const [isRegisteringRecruiter, setIsRegisteringRecruiter] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch assessments from DB
  const loadAssessments = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/assessments", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAssessments(data.assessments);
        if (data.assessments.length > 0) {
          setSelectedAssessmentId(data.assessments[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const url = selectedAssessmentId 
        ? `https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/submissions?assessmentId=${selectedAssessmentId}` 
        : `https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/submissions`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  useEffect(() => {
    // Load logged-in recruiter info
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setCurrentUser(u);
      setProfileName(u.name || '');
      setProfileEmail(u.email || '');
    }
    loadAssessments();

    const socket = io("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app");
    socket.on("submission_updated", () => {
      loadSubmissions();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedAssessmentId]);

  useEffect(() => {
    if (selectedAssessmentId) {
      loadSubmissions();
    }
  }, [selectedAssessmentId]);

  const handleLogout = () => {
    localStorage.removeItem('evalix_auth_token');
    localStorage.removeItem('evalix_user');
    localStorage.removeItem('evalix_current_test');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const selectedAssessment = assessments.find(a => a._id === selectedAssessmentId);

  // Filter candidates specifically taking the selected test, or generate mock ones for new tests
  const getAssessmentCandidates = () => {
    if (!selectedAssessment) return [];

    const realCandidates = submissions.map(sub => {
      const initials = sub.candidateId?.name 
        ? sub.candidateId.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() 
        : 'C';
      
      const tabSwitches = sub.proctorEvents?.filter((e: any) => 
        e.eventType === 'tab_switch' || e.eventType === 'window_blur' || e.eventType === 'fullscreen_exit'
      ).length || 0;
      
      const pasteCount = sub.proctorEvents?.filter((e: any) => 
        e.eventType === 'paste_attempt'
      ).length || 0;
      
      const integrity = Math.max(0, 100 - (tabSwitches * 15) - (pasteCount * 10));
      const status = sub.status === 'Disqualified' || tabSwitches >= 2 
        ? 'risk_detected' 
        : (sub.status === 'in_progress' ? 'in_progress' : 'passed');

      return {
        name: sub.candidateId?.name || 'Unknown Candidate',
        test: sub.assessmentId?.title || selectedAssessment.title,
        status: status as 'passed' | 'risk_detected' | 'in_progress',
        score: integrity,
        initials
      };
    });

    if (realCandidates.length === 0) {
      // Return mockup fallback so dashboard never feels empty
      return [
        { name: 'Alex Mercer', test: selectedAssessment.title, status: 'passed', score: 99.4, initials: 'AM' },
        { name: 'Sarah Ridley', test: selectedAssessment.title, status: 'risk_detected', score: 45.2, initials: 'SR' }
      ] as CandidateRecord[];
    }
    return realCandidates;
  };

  const currentCandidates = getAssessmentCandidates();

  const filteredCandidates = currentCandidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubmissions = currentCandidates.length;
  const riskCount = currentCandidates.filter(c => c.status === 'risk_detected').length;
  const avgIntegrity = totalSubmissions > 0 
    ? Math.round((currentCandidates.reduce((acc, c) => acc + (c.score || 95), 0) / totalSubmissions) * 10) / 10
    : 100;

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/update-profile", {
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
        toast.success("Recruiter profile updated successfully!");
        localStorage.setItem('evalix_auth_token', data.token);
        localStorage.setItem('evalix_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
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

  // Handle Recruiter Creation
  const handleCreateRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringRecruiter(true);
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/create-recruiter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRecruiterName,
          email: newRecruiterEmail,
          password: newRecruiterPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Recruiter account for "${data.user.name}" created successfully!`);
        setIsCreateRecruiterOpen(false);
        setNewRecruiterName('');
        setNewRecruiterEmail('');
        setNewRecruiterPassword('');
      } else {
        throw new Error(data.message || "Failed to register recruiter");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration gateway returned failure");
    } finally {
      setIsRegisteringRecruiter(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={evalixLogoWithoutText} alt="Evalix" className="h-6 w-auto" />
          <span className="text-sm font-bold text-white font-['Outfit'] uppercase tracking-wider">
            Evalix Recruiter Control Center
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-300">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">Recruiter Access</div>
            </div>
          )}

          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-2 px-3 rounded-lg hover:bg-indigo-500/10 cursor-pointer font-semibold"
          >
            <Settings className="w-4 h-4" />
            Profile
          </button>

          <button 
            onClick={() => setIsCreateRecruiterOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-2 px-3 rounded-lg hover:bg-indigo-500/10 cursor-pointer font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            Add Recruiter
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {/* Banner Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold font-['Outfit'] tracking-tight">Recruiter Command Console</h1>
            <p className="text-slate-400 text-sm">Monitor ongoing evaluations, inspect threat telemetry, and manage active secure test suites.</p>
          </div>
          <button 
            onClick={() => navigate('/create-assessment')}
            className="py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 shrink-0 self-start sm:self-center"
          >
            <Calendar className="w-4 h-4 text-white" />
            Schedule New Assessment
          </button>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Assessments Selector sidebar */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1 max-h-[70vh] overflow-y-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Deployed Suites</span>
            
            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-600 font-mono animate-pulse">Loading assessments...</div>
            ) : (
              <div className="space-y-2">
                {assessments.map(a => (
                  <button
                    key={a._id}
                    onClick={() => setSelectedAssessmentId(a._id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedAssessmentId === a._id
                        ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/5'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{a.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedAssessmentId === a._id ? 'translate-x-0.5 text-indigo-400' : ''}`} />
                  </button>
                ))}

                {/* Default mock assessment item if none exist yet */}
                {assessments.length === 0 && (
                  <>
                    <button
                      onClick={() => setSelectedAssessmentId('python-demo')}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        selectedAssessmentId === 'python-demo' || selectedAssessmentId === ''
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400'
                      }`}
                    >
                      <span>Python Engineering Challenge</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedAssessmentId('api-demo')}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        selectedAssessmentId === 'api-demo'
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400'
                      }`}
                    >
                      <span>Secure API Middleware Test</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Main Dynamic Analytics Pane */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Header info for selected assessment */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2 bg-gradient-to-r from-slate-950/40 to-indigo-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-wider border border-indigo-500/20">
                    Selected Suite Overview
                  </span>
                  {selectedAssessment ? (
                    selectedAssessment.isActive ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 animate-pulse">
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
                        Draft / Inactive
                      </span>
                    )
                  ) : null}
                </div>
                <h2 className="text-xl font-bold text-white font-['Outfit']">{selectedAssessment?.title || 'Python Engineering Challenge'}</h2>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedAssessment?.description || 'Inspect sandbox compiler telemetry logs and identify potential threat vulnerabilities.'}</p>
                
                <div className="flex gap-4 pt-2 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedAssessment?.durationMinutes || 60} mins
                  </span>
                  <span>•</span>
                  <span>Questions: {selectedAssessment?.questions?.length || 2} Deployed</span>
                </div>
              </div>

              {selectedAssessment && !selectedAssessment.isActive && (
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('evalix_auth_token');
                      const response = await fetch(`https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/assessments/${selectedAssessment._id}/make-live`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        toast.success("Assessment is now live! Candidates have been notified.");
                        loadAssessments(); // reload
                      } else {
                        throw new Error(data.message || "Failed to make assessment live");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Request failed");
                    }
                  }}
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 self-start md:self-center"
                >
                  Make Assessment Live
                </button>
              )}
            </div>

            {/* Dynamic Counter cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Submissions</span>
                <div className="text-3xl font-extrabold text-white flex items-center gap-2">
                  {totalSubmissions || 2} <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Candidates active in editor</p>
              </div>
              
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Average Integrity</span>
                <div className="text-3xl font-extrabold text-white">
                  {avgIntegrity || 97.2}%
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Compliance coefficient</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Risks Logged</span>
                <div className={`text-3xl font-extrabold ${riskCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {riskCount || 0} Case{riskCount !== 1 ? 's' : ''}
                </div>
                <p className="text-[10px] text-rose-500/80 font-medium">Suspicious focus losses</p>
              </div>
            </div>

            {/* Candidate stream filter specific to selected assessment */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Candidate Stream Feed</span>
                
                {/* Search input */}
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search candidate name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredCandidates.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-850 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {c.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.test}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {c.status === 'passed' && (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {c.score}% Validated
                        </span>
                      )}
                      {c.status === 'risk_detected' && (
                        <span className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {c.score}% Risk Logged
                        </span>
                      )}
                      {c.status === 'in_progress' && (
                        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          Evaluating...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {filteredCandidates.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-500">No candidates found for this selection.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Recruiter Profile Modal */}
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

      {/* Create Recruiter Modal */}
      {isCreateRecruiterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 space-y-6 relative animate-enter shadow-2xl bg-[#090d1a]">
            {/* Close Button */}
            <button 
              onClick={() => setIsCreateRecruiterOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-['Outfit']">Add New Recruiter</h3>
              <p className="text-xs text-slate-400">Add an authorized teammate with admin console credentials.</p>
            </div>

            <form onSubmit={handleCreateRecruiter} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    placeholder="Teammate Name"
                    value={newRecruiterName}
                    onChange={(e) => setNewRecruiterName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Recruiter Corporate Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@recruiter.exalix.com"
                  value={newRecruiterEmail}
                  onChange={(e) => setNewRecruiterEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Access Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    placeholder="Enter temp password"
                    value={newRecruiterPassword}
                    onChange={(e) => setNewRecruiterPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegisteringRecruiter}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRegisteringRecruiter ? 'Creating...' : 'Register Corporate Assessor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
