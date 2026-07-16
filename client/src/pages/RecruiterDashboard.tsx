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
  Laptop,
  Play,
  Square,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, apiUrl } from '../config/api';

interface CandidateRecord {
  id: string;
  name: string;
  test: string;
  status: 'passed' | 'risk_detected' | 'in_progress' | 'disqualified';
  score: number;
  initials: string;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  durationMinutes: number;
  duration?: number;
  questions: any[];
  status: string;
}

export const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch assessments from DB
  const loadAssessments = async () => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl('/assessments'), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const assessmentList = data.data || data.assessments || [];
        setAssessments(assessmentList);
        if (assessmentList.length > 0 && !selectedAssessmentId) {
          setSelectedAssessmentId(assessmentList[0]._id);
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
        ? apiUrl(`/submissions?assessmentId=${selectedAssessmentId}`)
        : apiUrl('/submissions');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  useEffect(() => {
    // Load logged-in recruiter info
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    loadAssessments();

    const socket = io(API_BASE_URL);
    socket.on("submission_updated", () => {
      loadSubmissions();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleReauthorize = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl(`/submissions/${submissionId}/reauthorize`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Candidate re-authorized successfully! Previous data removed and timer reset.");
        loadSubmissions();
      } else {
        throw new Error(data.message || "Reauthorization failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reauthorize candidate");
    }
  };

  const selectedAssessment = assessments.find(a => a._id === selectedAssessmentId);

  // Filter candidates specifically taking the selected test, or generate mock ones for new tests
  const getAssessmentCandidates = (): CandidateRecord[] => {
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
      
      const integrity = sub.aiReport?.riskScore !== undefined ? (100 - sub.aiReport.riskScore) : Math.max(0, 100 - (tabSwitches * 15) - (pasteCount * 10));
      
      let status: 'passed' | 'risk_detected' | 'in_progress' | 'disqualified' = 'passed';
      if (sub.status === 'disqualified') {
        status = 'disqualified';
      } else if (sub.status === 'in_progress') {
        status = 'in_progress';
      } else if (sub.aiReport?.riskScore >= 40 || tabSwitches >= 2) {
        status = 'risk_detected';
      }

      return {
        id: sub._id,
        name: sub.candidateId?.name || 'Unknown Candidate',
        test: sub.assessmentId?.title || selectedAssessment.title,
        status,
        score: sub.totalScore !== undefined ? sub.totalScore : integrity,
        initials
      };
    });

    return realCandidates;
  };

  const currentCandidates = getAssessmentCandidates();

  const filteredCandidates = currentCandidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubmissions = currentCandidates.length;
  const riskCount = currentCandidates.filter(c => c.status === 'risk_detected' || c.status === 'disqualified').length;
  
  // Average Score of all validated submissions
  const completedCandidates = currentCandidates.filter(c => c.status !== 'in_progress' && c.status !== 'disqualified');
  const avgScore = completedCandidates.length > 0 
    ? Math.round((completedCandidates.reduce((acc, c) => acc + (c.score || 0), 0) / completedCandidates.length) * 10) / 10
    : 100;

  const handleToggleLive = async () => {
    if (!selectedAssessment) return;
    try {
      const token = localStorage.getItem('evalix_auth_token');
      const response = await fetch(apiUrl(`/assessments/${selectedAssessment._id}/make-live`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.assessment.status === 'published') {
          toast.success("Assessment is now live! Candidates can view it.");
        } else {
          toast.success("Assessment stopped successfully.");
        }
        loadAssessments(); // reload
      } else {
        throw new Error(data.message || "Request failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Toggle live request failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans relative overflow-x-hidden bg-grid-pattern">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <Laptop className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white font-['Outfit'] uppercase tracking-wider block">Evalix</span>
            <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">Recruiter Control Center</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-300">{currentUser.name}</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Recruiter Access</div>
            </div>
          )}

          <button 
            onClick={() => navigate('/recruiter-profile')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-slate-900 cursor-pointer font-semibold"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Profile
          </button>

          <button 
            onClick={() => navigate('/add-recruiter')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-slate-900 cursor-pointer font-semibold"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            Add Recruiter
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors py-2 px-3 rounded-xl hover:bg-rose-500/5 cursor-pointer font-semibold"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-8 py-8 space-y-8 relative z-10">
        
        {/* Banner Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold font-['Outfit'] tracking-tight text-white">Recruiter Command Console</h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">Monitor ongoing evaluations, inspect threat telemetry, and manage active secure test suites.</p>
          </div>
          <button 
            onClick={() => navigate('/create-assessment')}
            className="py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 shrink-0 self-start sm:self-center"
          >
            <Calendar className="w-4 h-4 text-white" />
            Schedule New Assessment
          </button>
        </div>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          
          {/* Column 1: Deployed Suites Selector */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1 max-h-[75vh] overflow-y-auto bg-slate-950/40">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deployed Suites</span>
            
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
                        : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{a.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedAssessmentId === a._id ? 'translate-x-0.5 text-indigo-400' : ''}`} />
                  </button>
                ))}

                {assessments.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">No assessments deployed yet.</div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Main Dynamic Analytics Pane */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Header info card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-gradient-to-r from-slate-950/40 to-indigo-950/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-wider border border-indigo-500/20 font-mono">
                    Selected Suite Overview
                  </span>
                  {selectedAssessment ? (
                    selectedAssessment.status === 'published' ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 font-mono animate-pulse">
                        Live
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20 font-mono">
                        Draft / Inactive
                      </span>
                    )
                  ) : null}
                </div>
                
                <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">{selectedAssessment?.title || 'Python Engineering Challenge'}</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{selectedAssessment?.description || 'Inspect sandbox compiler telemetry logs and identify potential threat vulnerabilities.'}</p>
                
                <div className="flex gap-4 pt-2 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedAssessment?.duration || selectedAssessment?.durationMinutes || 60} mins
                  </span>
                  <span>•</span>
                  <span>Questions: {selectedAssessment?.questions?.length || 1} Deployed</span>
                </div>
              </div>

              {selectedAssessment && (
                <button
                  onClick={handleToggleLive}
                  className={`py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 self-start md:self-center flex items-center gap-2 border ${
                    selectedAssessment.status === 'published'
                      ? 'bg-rose-600/10 border-rose-500/30 text-rose-400 hover:bg-rose-600/20'
                      : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
                  }`}
                >
                  {selectedAssessment.status === 'published' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                      <span>Stop Assessment Live</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                      <span>Make Assessment Live</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Dynamic Counter cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Submissions</span>
                <div className="text-3xl font-extrabold text-white flex items-center gap-2 font-['Outfit']">
                  {totalSubmissions || 2} <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Candidates active in editor</p>
              </div>
              
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Average Score</span>
                <div className="text-3xl font-extrabold text-white font-['Outfit']">
                  {avgScore}%
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Average weighted evaluation</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Risks / DQs Logged</span>
                <div className={`text-3xl font-extrabold font-['Outfit'] ${riskCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {riskCount || 0} Case{riskCount !== 1 ? 's' : ''}
                </div>
                <p className="text-[10px] text-rose-500/80 font-medium">Suspicious active logs</p>
              </div>
            </div>

            {/* Candidate stream filter */}
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
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredCandidates.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-900 hover:border-slate-850 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 uppercase font-mono">
                        {c.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.test}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {c.status === 'passed' && (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {c.score}% Score
                          </span>
                        )}
                        {c.status === 'risk_detected' && (
                          <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Suspicious ({c.score}% score)
                          </span>
                        )}
                        {c.status === 'disqualified' && (
                          <span className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold animate-pulse font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            DISQUALIFIED
                          </span>
                        )}
                        {c.status === 'in_progress' && (
                          <span className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold">
                            <Activity className="w-3.5 h-3.5 animate-spin" />
                            Evaluating...
                          </span>
                        )}
                      </div>

                      {c.status === 'disqualified' && (
                        <button
                          onClick={() => handleReauthorize(c.id)}
                          className="py-1.5 px-3.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer font-['Outfit']"
                        >
                          Re-authorize
                        </button>
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
    </div>
  );
};
