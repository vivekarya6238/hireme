import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OnboardingWorker from "./pages/OnboardingWorker";
import OnboardingHirer from "./pages/OnboardingHirer";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding/worker"
          element={
            <ProtectedRoute>
              <OnboardingWorker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/hirer"
          element={
            <ProtectedRoute>
              <OnboardingHirer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;