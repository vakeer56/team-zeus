import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, Mail, Lock, User, Terminal, Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const CandidateLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isRecruiterEmail = (emailStr: string) => {
    const domain = emailStr.trim().toLowerCase();
    return domain.endsWith('@recruiter.evalix.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP / REGISTRATION FLOW ---
        // 1. Enforce validation constraint: recruiters cannot register
        if (isRecruiterEmail(email)) {
          toast.error("Recruiter accounts cannot be self-registered. Contact system administrator.", {
            duration: 5000,
            style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
          });
          setIsLoading(false);
          return;
        }

        // 2. Call backend register route
        const response = await fetch("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Registration failed");
        }

        toast.success(`Welcome, ${data.user.name}! Profile registered successfully.`);
        localStorage.setItem('evalix_auth_token', data.token);
        localStorage.setItem('evalix_user', JSON.stringify(data.user));
        navigate('/candidate-dashboard');
      } else {
        // --- SIGN IN / LOGIN FLOW ---
        // 1. Call backend login route
        const response = await fetch("https://team-zeus-oz502elrp-varuns-projects-ed5fdbfe.vercel.app/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Invalid email or password");
        }

        localStorage.setItem('evalix_auth_token', data.token);
        localStorage.setItem('evalix_user', JSON.stringify(data.user));

        // 2. Role validation checks
        if (data.user.role === 'recruiter') {
          toast.success("Recruiter Command Console unlocked successfully.");
          navigate('/recruiter-dashboard');
        } else {
          toast.success(`Assessment Session authorized. Welcome back, ${data.user.name}.`);
          navigate('/candidate-dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Connection to security gateway failed.", {
        duration: 4000,
        style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex relative overflow-hidden bg-grid-pattern">
      {/* Background Neon Elements */}
      <div className="absolute top-1/2 left-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex w-full min-h-screen">
        {/* Left Side: Dynamic Login/Registration Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 py-12 z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Laptop className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold font-['Outfit'] tracking-tight text-white">
                {isSignUp ? 'Create Exam Profile' : 'Secure Sign In'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isSignUp 
                  ? 'Sign up to register your candidate profile and take secure assessments.' 
                  : 'Enter your credentials to access your secure exam environment or dashboard.'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-900">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register Candidate
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isSignUp ? "candidate@email.com" : "you@evalix.com"}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <a href="#" className="text-xs text-purple-400 hover:text-purple-300 hover:underline">Forgot password?</a>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-slate-950 border border-slate-800 rounded text-purple-600 focus:ring-purple-500/30 accent-purple-600"
                  />
                  <label htmlFor="remember-me" className="ml-2.5 text-sm text-slate-400 select-none cursor-pointer">
                    Remember me on this device
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authorizing...</span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Register Exam Profile' : 'Authorize Security Gateway'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Futuristic Proctoring / Coding IDE HUD Mockup */}
        <div className="hidden lg:flex flex-1 bg-[#050914] border-l border-slate-900 justify-center items-center p-12 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-60" />
          
          <div className="relative w-full max-w-lg space-y-6 z-10">
            {/* Proctor Hud Mockup */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">Active Integrity Proctor</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">Shield Active</span>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-700">
                  <Eye className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Real-time Telemetry</span>
                  <p className="text-xs text-slate-300 font-mono">Clipboard shield: LOCKED</p>
                  <p className="text-xs text-slate-300 font-mono">Focus inspector: ACTIVE</p>
                  <p className="text-xs text-slate-300 font-mono">DevTools block: ENABLED</p>
                </div>
              </div>
            </div>

            {/* Sandbox HUD Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 bg-gradient-to-r from-purple-950/20 to-indigo-950/20">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>Isolated Compiler Sandbox</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Code execution is carried out inside an isolated sandbox environment. Submissions are tracked and audited for structural compliance dynamically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
