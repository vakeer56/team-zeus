import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CandidateLoginPage } from './pages/CandidateLoginPage';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { CreateAssessmentPage } from './pages/CreateAssessmentPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecruiterProfilePage } from './pages/RecruiterProfilePage';
import { AddRecruiterPage } from './pages/AddRecruiterPage';
import { Toaster } from 'react-hot-toast';

// LocalStorage Polyfill to intercept "evalix_user" calls and dynamically decode from "evalix_auth_token"
const originalGetItem = localStorage.getItem;
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;

localStorage.getItem = function (key) {
  if (key === 'evalix_user') {
    const token = originalGetItem.call(localStorage, 'evalix_auth_token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      return JSON.stringify({
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        role: parsed.role,
        mobileNumber: parsed.mobileNumber,
        age: parsed.age,
        education: parsed.education
      });
    } catch (e) {
      return null;
    }
  }
  return originalGetItem.apply(this, arguments as any);
};

localStorage.setItem = function (key, _value) {
  if (key === 'evalix_user') return;
  return originalSetItem.apply(this, arguments as any);
};

localStorage.removeItem = function (key) {
  if (key === 'evalix_user') return;
  return originalRemoveItem.apply(this, arguments as any);
};

// Clear legacy plain text user storage on initial app boot
originalRemoveItem.call(localStorage, 'evalix_user');

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
    location.pathname === '/create-assessment' ||
    location.pathname === '/profile' ||
    location.pathname === '/recruiter-profile' ||
    location.pathname === '/add-recruiter';

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/recruiter-profile" element={<RecruiterProfilePage />} />
          <Route path="/add-recruiter" element={<AddRecruiterPage />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}

export default App;
