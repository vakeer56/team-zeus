import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, ArrowLeft, BarChart3, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RecruiterLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Recruiter Logging In: ${email}`);
  };

  const handleGoogleLogin = () => {
    alert('Logging in with Google...');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex relative overflow-hidden">
      {/* Background Neon Elements */}
      <div className="absolute top-1/2 left-[10%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <Link 
        to="/login-select" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors z-20 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to roles
      </Link>

      {/* Main Container */}
      <div className="flex w-full min-h-screen">
        {/* Left Side: Login Form */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 py-12 z-10">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold font-['Outfit'] tracking-tight">
                Recruiter Portal
              </h2>
              <p className="text-slate-400 text-sm">
                Access your recruitment workspace and candidate analytics.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</a>
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
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-slate-950 border border-slate-800 rounded text-blue-600 focus:ring-blue-500/30 accent-blue-600"
                />
                <label htmlFor="remember-me" className="ml-2.5 text-sm text-slate-400 select-none cursor-pointer">
                  Remember me on this device
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
              >
                Sign In to Workspace
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-600 text-xs uppercase tracking-wider font-semibold">Or continue with</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full py-3.5 px-5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            {/* Register link */}
            <div className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold">
                Register Workspace
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Futuristic Recruiter Dashboard HUD Mockup */}
        <div className="hidden lg:flex flex-1 bg-[#050914] border-l border-slate-900 justify-center items-center p-12 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-60" />
          {/* Dashboard panel wrapper */}
          <div className="relative w-full max-w-lg space-y-6 z-10">
            {/* Header metrics card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-slate-300">Live Workspace Analytics</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500">Total Applicants</span>
                  <div className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                    1,284 <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Avg Score</span>
                  <div className="text-lg font-bold text-white mt-0.5">84.2%</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Pass Rate</span>
                  <div className="text-lg font-bold text-white mt-0.5">38%</div>
                </div>
              </div>
            </div>

            {/* Applicant Activity Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Candidate Integrity Feed</span>
              
              <div className="space-y-3">
                {/* Cand 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      AM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Alex Mercer</div>
                      <div className="text-[10px] text-slate-500">React Architect Test</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    99.4% Valid
                  </div>
                </div>

                {/* Cand 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      SR
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Sarah Ridley</div>
                      <div className="text-[10px] text-slate-500">Data Engineering Challenge</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                    Risk Detected
                  </div>
                </div>

                {/* Cand 3 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                      JD
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">John Doe</div>
                      <div className="text-[10px] text-slate-500">Node JS Middleware Challenge</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    98.9% Valid
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-950/40 to-slate-950/40">
              <div>
                <span className="text-xs text-slate-500">Active Test Suites</span>
                <div className="text-lg font-bold text-white mt-0.5">14 active tests</div>
              </div>
              <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 text-xs font-semibold rounded-xl transition-all">
                Manage Suites
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
