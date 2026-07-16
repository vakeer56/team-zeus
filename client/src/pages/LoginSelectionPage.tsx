import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Laptop, ChevronRight } from 'lucide-react';

export const LoginSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center px-6 py-20 relative overflow-hidden bg-grid-pattern">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full text-center space-y-4 mb-12 relative z-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] tracking-tight">
          Welcome to <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Evalix</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          Please select your pathway to log in. Secure testing starts here.
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full relative z-10">
        {/* Recruiter Card */}
        <motion.div 
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-8 rounded-2xl glass-panel group cursor-pointer transition-all duration-300 border border-slate-800/80 hover:border-blue-500/30 flex flex-col justify-between"
          style={{ boxShadow: '0 8px 30px rgba(59, 130, 246, 0.05)' }}
          onClick={() => navigate('/login-recruiter')}
        >
          {/* Subtle hover glow border effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mb-6 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3 font-['Outfit'] group-hover:text-blue-400 transition-colors">
              Recruiter
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Create assessments, monitor candidates, analyze reports and recruit the best talent.
            </p>
          </div>

          <button 
            className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md group-hover:shadow-blue-500/10"
          >
            Continue as Recruiter
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Candidate Card */}
        <motion.div 
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative overflow-hidden p-8 rounded-2xl glass-panel group cursor-pointer transition-all duration-300 border border-slate-800/80 hover:border-purple-500/30 flex flex-col justify-between"
          style={{ boxShadow: '0 8px 30px rgba(168, 85, 247, 0.05)' }}
          onClick={() => navigate('/login-candidate')}
        >
          {/* Subtle hover glow border effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 mb-6 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                <Laptop className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3 font-['Outfit'] group-hover:text-purple-400 transition-colors">
              Candidate
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Attend coding assessments, aptitude tests, certification exams and showcase your skills.
            </p>
          </div>

          <button 
            className="w-full py-3.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md group-hover:shadow-purple-500/10"
          >
            Continue as Candidate
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
