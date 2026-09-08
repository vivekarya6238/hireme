import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OnboardingWorker from "./pages/OnboardingWorker";
import OnboardingHirer from "./pages/OnboardingHirer";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PostJob from "./pages/PostJob";
import JobDetail from "./pages/JobDetail";
import EditJob from "./pages/EditJob";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding/worker" element={<ProtectedRoute><OnboardingWorker /></ProtectedRoute>} />
        <Route path="/onboarding/hirer" element={<ProtectedRoute><OnboardingHirer /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/jobs/new" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
        <Route path="/jobs/:id/edit" element={<ProtectedRoute><EditJob /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;