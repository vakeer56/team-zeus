import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CandidateLoginPage } from './pages/CandidateLoginPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CreateAssessmentPage } from './pages/CreateAssessmentPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { Toaster } from 'react-hot-toast';

function App() {
  const location = useLocation();
  
  // Hide Navbar & Footer on Auth / Assessment / Dashboard pages for cleaner, focused portal UI
  const hideLayout = 
    location.pathname === '/login' || 
    location.pathname === '/login-select' || 
    location.pathname === '/login-candidate' ||
    location.pathname === '/login-recruiter' ||
    location.pathname === '/assessment' ||
    location.pathname === '/recruiter-dashboard' ||
    location.pathname === '/candidate-dashboard' ||
    location.pathname === '/create-assessment';

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100 selection:bg-indigo-500/30 selection:text-white font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: '#111827', color: '#fff', border: '1px solid #1f2937' } }} />
      {!hideLayout && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<CandidateLoginPage />} />
          <Route path="/login-select" element={<CandidateLoginPage />} />
          <Route path="/login-candidate" element={<CandidateLoginPage />} />
          <Route path="/login-recruiter" element={<CandidateLoginPage />} />
          <Route path="/recruiter-dashboard" element={<RecruiterDashboard />} />
          <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
          <Route path="/create-assessment" element={<CreateAssessmentPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;

