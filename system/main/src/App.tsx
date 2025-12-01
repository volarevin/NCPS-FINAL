import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Homepage from './pages/public/Homepage';
import AdminPage from './pages/admin/AdminPage';
import CustomerPage from './pages/customer/CustomerPage';
import ReceptionistPage from './pages/receptionist/ReceptionistPage';
import TechnicianPage from './pages/technician/TechnicianPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FeedbackProvider } from './context/FeedbackContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <FeedbackProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/" element={<Homepage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/customer" element={<CustomerPage />} />
              <Route path="/receptionist" element={<ReceptionistPage />} />
              <Route path="/technician" element={<TechnicianPage />} />
            </Route>
          </Routes>
          <Toaster />
        </FeedbackProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
