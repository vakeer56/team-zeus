import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Laptop, Mail, Lock, ArrowLeft, Terminal, Play, Video, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const CandidateLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/assessment');
  };

  const handleGoogleLogin = () => {
    toast.success('Redirecting to Google Secure SSO...');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex relative overflow-hidden">
      {/* Background Neon Elements */}
      <div className="absolute top-1/2 left-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Laptop className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold font-['Outfit'] tracking-tight">
                Candidate Portal
              </h2>
              <p className="text-slate-400 text-sm">
                Enter your test credentials to launch the secure Evalix exam environment.
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
                    placeholder="candidate@email.com"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-purple-400 hover:text-purple-300 hover:underline">Forgot password?</a>
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

              {/* Remember Me */}
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

              <button
                type="submit"
                className="w-full py-4 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
              >
                Launch Assessment Session
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
              <a href="#" className="text-purple-400 hover:text-purple-300 font-semibold">
                Register Candidate Profile
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Futuristic Proctoring / Coding IDE HUD Mockup */}
        <div className="hidden lg:flex flex-1 bg-[#050914] border-l border-slate-900 justify-center items-center p-12 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-60" />
          
          <div className="relative w-full max-w-lg space-y-6 z-10">
            {/* Top row: Video feed / proctor status & code run console */}
            <div className="grid grid-cols-5 gap-4">
              {/* Webcam monitor */}
              <div className="col-span-2 glass-panel p-3 rounded-2xl border border-slate-800 relative aspect-video flex flex-col justify-between overflow-hidden">
                {/* Simulated Webcam Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <div className="absolute inset-4 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                  <div className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                    EYE TRACK: LOCK
                  </div>
                </div>
                {/* Header indicators */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Candidate WebCam</span>
                  </div>
                  <Video className="w-3.5 h-3.5 text-slate-500" />
                </div>
                {/* Bottom stats */}
                <div className="relative z-10 text-[9px] text-slate-400 font-mono">
                  FPS: 30 | BLINK: 0.1s
                </div>
              </div>

              {/* Proctor AI parameters */}
              <div className="col-span-3 glass-panel p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">AI Proctor Sentinel</span>
                </div>
                <div className="space-y-1 my-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Security Score:</span>
                    <span className="text-emerald-400 font-bold">100/100</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Tabs Switched:</span>
                    <span className="text-white">0 / 3 max</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Noise Level:</span>
                    <span className="text-white">Normal (12dB)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-full" />
                </div>
              </div>
            </div>

            {/* IDE mockup */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              {/* IDE Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono text-slate-300">Solution.tsx</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">TypeScript</span>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-all">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Run Tests
                  </button>
                </div>
              </div>

              {/* Code input mockup */}
              <div className="p-4 bg-slate-950/40 font-mono text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <div><span className="text-purple-400">import</span> &#123; useState &#125; <span className="text-purple-400">from</span> <span className="text-emerald-500">'react'</span>;</div>
                <div></div>
                <div><span className="text-blue-400">export function</span> <span className="text-yellow-400">verifyPrime</span>(num: <span className="text-blue-400">number</span>): <span className="text-blue-400">boolean</span> &#123;</div>
                <div className="pl-4"><span className="text-slate-600">// AI Proctor analyzes keyboard cadence</span></div>
                <div className="pl-4"><span className="text-purple-400">if</span> (num &lt;= <span className="text-amber-500">1</span>) <span className="text-purple-400">return false</span>;</div>
                <div className="pl-4"><span className="text-purple-400">for</span> (<span className="text-blue-400">let</span> i = <span className="text-amber-500">2</span>; i &lt;= Math.<span className="text-yellow-400">sqrt</span>(num); i++) &#123;</div>
                <div className="pl-8"><span className="text-purple-400">if</span> (num % i === <span className="text-amber-500">0</span>) <span className="text-purple-400">return false</span>;</div>
                <div className="pl-4">&#125;</div>
                <div className="pl-4"><span className="text-purple-400">return true</span>;</div>
                <div>&#125;</div>
              </div>

              {/* IDE compiler output */}
              <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All 12 unit tests passed.
                </span>
                <span>Time: 14ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
