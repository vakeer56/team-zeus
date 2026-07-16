import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Code2, 
  Eye, 
  ShieldAlert, 
  UserCheck, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck,
  Terminal
} from 'lucide-react';
import evalixHero from '../assets/evalix_hero.png';

const features = [
  {
    title: 'AI Powered Assessments',
    description: 'Dynamic question banks tailored to applicant expertise, featuring intelligent code generation checks.',
    icon: Cpu,
    color: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  {
    title: 'Live Coding Challenges',
    description: 'Interactive IDE with linting, unit-test suites, multi-language support, and real-time execution.',
    icon: Code2,
    color: 'from-cyan-500 to-teal-500',
    glow: 'rgba(20, 184, 166, 0.15)'
  },
  {
    title: 'AI Proctoring',
    description: 'Behavioral monitoring checking tab focus status, browser window switching, and keyboard shortcuts.',
    icon: Eye,
    color: 'from-indigo-500 to-blue-500',
    glow: 'rgba(99, 102, 241, 0.15)'
  },
  {
    title: 'Integrity & Risk Analysis',
    description: 'Explainable AI-driven confidence scoring based on behavioral tracking and abnormal action flags.',
    icon: ShieldAlert,
    color: 'from-purple-500 to-indigo-500',
    glow: 'rgba(168, 85, 247, 0.15)'
  },
  {
    title: 'Candidate Skill Profiling',
    description: 'Granular skill matrices showcasing strengths, logic depth, coding speeds, and resourcefulness.',
    icon: UserCheck,
    color: 'from-pink-500 to-rose-500',
    glow: 'rgba(236, 72, 153, 0.15)'
  },
  {
    title: 'Recruiter Analytics Dashboard',
    description: 'Aggregated analytics overview showing hiring funnel progression, scores, and integrity assessments.',
    icon: BarChart3,
    color: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16, 185, 129, 0.15)'
  }
];

const steps = [
  {
    id: 1,
    title: 'Create Assessment',
    desc: 'Customize technical frameworks, choose question models, and configure AI proctoring severity.'
  },
  {
    id: 2,
    title: 'Candidate Takes Test',
    desc: 'Secure browser access, live test validation, and active behavior intelligence guidance.'
  },
  {
    id: 3,
    title: 'AI Evaluates Performance',
    desc: 'Automated syntax scoring, code quality review, time-complexity analysis, and plagiarism scan.'
  },
  {
    id: 4,
    title: 'Recruiter Receives Insights',
    desc: 'Review candidate skill graph, code playback, integrity score detail, and hiring recommendation.'
  }
];

export const LandingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('evalix_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] pt-24 pb-20 relative overflow-hidden bg-grid-pattern">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[180px] pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10 md:pt-16 pb-20 flex flex-col lg:flex-row items-center gap-16 relative z-10">
        <div className="flex-1 space-y-8 text-left">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-xs font-semibold text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Empowering Secure Technical Hiring
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-['Outfit'] leading-tight">
            Beyond Scores. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Discover True Talent.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
            AI-powered coding assessments, secure online examinations, intelligent proctoring, behavioral analytics, and recruiter insights—all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link 
              to={user ? (user.role === 'recruiter' ? '/recruiter-dashboard' : '/candidate-dashboard') : '/login'}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300 flex items-center justify-center gap-2 group hover:scale-[1.02]"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 rounded-xl font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/60 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero Illustration */}
        <div className="flex-1 w-full relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative w-full aspect-video md:aspect-[4/3] max-w-lg lg:max-w-none mx-auto rounded-2xl overflow-hidden glass-panel border border-slate-800 p-2 shadow-2xl"
          >
            {/* Top Bar simulating browser/app frame */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-950/60 rounded-t-xl">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800/80 text-[10px] text-slate-500 font-mono">
                <Terminal className="w-3 h-3 text-indigo-400" />
                evalix.com/dashboard/analytics
              </div>
              <div className="w-10" />
            </div>

            {/* Generated Image Wrapper */}
            <div className="relative w-full h-[calc(100%-36px)] bg-slate-950/80 overflow-hidden group">
              <img 
                src={evalixHero} 
                alt="Evalix Cyber Assessment Panel" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
              />
              
              {/* Extra glass-panel elements layered on top to create look and feel of mock dashboard */}
              <div className="absolute top-4 left-4 glass-panel p-3 rounded-xl border border-blue-500/20 max-w-[160px] animate-pulse">
                <div className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mb-1">PROCTORING MONITOR</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-white">AI Active (100%)</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 glass-panel p-3 rounded-xl border border-purple-500/20 max-w-[180px]">
                <div className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase mb-1">INTEGRITY INDEX</div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-[99.8%]" />
                  </div>
                  <span className="text-xs font-bold text-white">99.8%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 relative z-10 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit']">
            Intelligent Features for Modern Teams
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Everything you need to set challenges, evaluate results, monitor behaviors, and speed up hiring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div 
                key={index}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative overflow-hidden p-6 rounded-2xl glass-panel group cursor-pointer transition-all duration-300 hover:border-slate-700"
                style={{ boxShadow: `0 8px 30px ${feature.glow}` }}
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon wrapper */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feature.color} p-0.5 mb-5 shadow-lg flex items-center justify-center`}>
                  <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 font-['Outfit'] group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 relative z-10 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Outfit']">
            How It Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            A seamless journey from initial test draft to selection.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center group">
              {/* Step number badge */}
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-800 group-hover:border-indigo-500 transition-all duration-300 shadow-xl mb-6">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent font-['Outfit']">
                  0{step.id}
                </span>
                {/* Mini background ring */}
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2 font-['Outfit']">
                {step.title}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-[220px]">
                {step.desc}
              </p>

              {/* Connecting arrow (only for desktop / md up) */}
              {idx < 3 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+45px)] w-[calc(100%-90px)] h-px bg-gradient-to-r from-indigo-500/60 to-indigo-500/10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="max-w-5xl mx-auto px-6 py-20 relative z-10 scroll-mt-20">
        <div className="p-8 md:p-12 rounded-3xl glass-panel border border-slate-800/80 shadow-2xl relative overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950/40">
          <div className="absolute top-0 right-0 w-[20%] h-[30%] bg-blue-500/10 blur-3xl rounded-full" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
            <div className="flex flex-col items-center text-center justify-center p-4">
              <span className="text-3xl md:text-4xl font-extrabold text-blue-400 font-['Outfit']">99.8%</span>
              <span className="text-xs text-slate-400 font-medium uppercase mt-2 tracking-wider">Assessment Integrity</span>
            </div>
            
            <div className="flex flex-col items-center text-center justify-center p-4 pt-8 md:pt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-cyan-400 font-['Outfit']">50+</span>
              <span className="text-xs text-slate-400 font-medium uppercase mt-2 tracking-wider">Languages Supported</span>
            </div>

            <div className="flex flex-col items-center text-center justify-center p-4 pt-8 md:pt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-indigo-400 font-['Outfit']">AI-Powered</span>
              <span className="text-xs text-slate-400 font-medium uppercase mt-2 tracking-wider">Evaluation engine</span>
            </div>

            <div className="flex flex-col items-center text-center justify-center p-4 pt-8 md:pt-4">
              <span className="text-3xl md:text-4xl font-extrabold text-purple-400 font-['Outfit']">Explainable</span>
              <span className="text-xs text-slate-400 font-medium uppercase mt-2 tracking-wider">Risk Scoring</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
