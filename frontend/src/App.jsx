import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/login" element={<AuthPage />} />
          <Route path="/auth/register" element={<AuthPage />} />
          <Route path="/" element={<AuthPage />} />
        </Routes>
      </AuthProvider>
      <Toaster />
    </Router>
  );
}

export default App;