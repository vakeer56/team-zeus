import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Laptop,
  Mail,
  Lock,
  User,
  Terminal,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Phone,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../config/api';

export const CandidateLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  // Basic states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Custom schema fields for candidate signup
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [education, setEducation] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken') || '';
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
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
      if (resetToken) {
        // --- RESET PASSWORD FLOW ---
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(apiUrl('/reset-password'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: resetToken,
            password
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Password reset failed");
        }

        toast.success("Password reset successfully! Please sign in.");
        setSearchParams({}); // Clear query parameters
        setPassword('');
        setConfirmPassword('');
        setForgotPasswordMode(false);
        setIsSignUp(false);
      } else if (forgotPasswordMode) {
        // --- FORGOT PASSWORD FLOW ---
        const response = await fetch(apiUrl('/forgot-password'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to submit request");
        }

        toast.success("Reset link printed to the backend console logs!", { duration: 6000 });
        setForgotPasswordMode(false);
      } else if (isSignUp) {
        // --- SIGN UP / REGISTRATION FLOW ---
        if (isRecruiterEmail(email)) {
          toast.error("Recruiter accounts cannot be self-registered. Contact system administrator.", {
            duration: 5000,
            style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
          });
          setIsLoading(false);
          return;
        }

        if (mobileNumber) {
          const mobileRegex = /^[789]\d{9}$/;
          if (!mobileRegex.test(mobileNumber)) {
            toast.error("Mobile number must start with 7, 8, or 9 and contain exactly 10 digits.", {
              duration: 5000,
              style: { background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }
            });
            setIsLoading(false);
            return;
          }
        }

        const payload = {
          name,
          email,
          password,
          mobileNumber: mobileNumber || undefined,
          age: age !== '' ? Number(age) : undefined,
          education: education || undefined
        };

        const response = await fetch(apiUrl('/register'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
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
        const response = await fetch(apiUrl('/login'), {
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
    <div className="min-h-screen bg-[#030712] flex justify-center items-center relative overflow-hidden bg-grid-pattern p-6 sm:p-12">
      {/* Background Neon Elements */}
      <div className="absolute top-1/2 left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Centered Wrapper to Prevent Viewport Stretch */}
      <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 z-10">

        {/* Left Side: Secure Sign In Form */}
        <div className="w-full max-w-md space-y-6 animate-fade-in shrink-0">

          {/* Laptop Icon Badge */}
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Laptop className="w-5 h-5 text-white" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold font-['Outfit'] tracking-tight text-white">
              {resetToken ? 'Reset Your Password' : forgotPasswordMode ? 'Forgot Password' : isSignUp ? 'Create Exam Profile' : 'Secure Sign In'}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {resetToken
                ? 'Enter a new secure password for your account.'
                : forgotPasswordMode
                ? 'Enter your registered email address to receive a password reset link.'
                : isSignUp
                ? 'Sign up to register your candidate profile.'
                : 'Enter your credentials to access your secure exam environment or dashboard.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          {!resetToken && !forgotPasswordMode && (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-900">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${!isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isSignUp ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Register Candidate
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {resetToken ? (
              // --- RESET PASSWORD FIELDS ---
              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : forgotPasswordMode ? (
              // --- FORGOT PASSWORD FIELDS ---
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@evalix.com"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : isSignUp ? (
              // --- SIGN UP FIELDS ---
              <div className="space-y-4 animate-fade-in max-h-[40vh] overflow-y-auto pr-1">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@email.com"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="21"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Educational Details */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Educational Details</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="B.S. in Computer Science"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // --- SIGN IN FIELDS ---
              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@evalix.com"
                      className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 bg-slate-950 border border-slate-800 rounded text-indigo-600 focus:ring-indigo-500/30 accent-indigo-600"
                    />
                    <label htmlFor="remember-me" className="ml-2.5 text-xs text-slate-400 select-none cursor-pointer font-medium">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authorizing...</span>
              ) : (
                <>
                  <span>{resetToken ? 'Update Password' : forgotPasswordMode ? 'Send Reset Link' : isSignUp ? 'Register Exam Profile' : 'Authorize Security Gateway'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Cancel / Back to login button */}
            {resetToken && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors text-center cursor-pointer pt-1"
              >
                Cancel Reset
              </button>
            )}
            {!resetToken && forgotPasswordMode && (
              <button
                type="button"
                onClick={() => setForgotPasswordMode(false)}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-350 transition-colors text-center cursor-pointer pt-1"
              >
                Back to Sign In
              </button>
            )}
          </form>

        </div>

        {/* Right Side: Proctor telemetry panels */}
        <div className="hidden lg:flex flex-col w-full max-w-md space-y-6 shrink-0">

          {/* Active Integrity Proctor Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Integrity Proctor</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Shield Active</span>
            </div>

            <div className="flex gap-5 items-center border-t border-slate-900 pt-4">
              {/* Telemetry eye graphic */}
              <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner text-indigo-400 shrink-0">
                <Eye className="w-7 h-7" />
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-400 flex-grow">
                <div className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mb-1">Real-time Telemetry</div>
                <div className="flex justify-between items-center">
                  <span>Clipboard shield:</span>
                  <span className="text-white font-bold">LOCKED</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Focus inspector:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>DevTools block:</span>
                  <span className="text-white font-bold">ENABLED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Isolated Compiler Sandbox Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Isolated Compiler Sandbox</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Code execution is carried out inside an isolated sandbox environment. Submissions are tracked and audited for structural compliance dynamically.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
