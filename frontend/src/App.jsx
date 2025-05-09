import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import AllNumbers from './pages/AllNumbers';
import './styles/main.css';
import './styles/layout.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={<Layout><ManagerDashboard /></Layout>} />
                    <Route path="/dashboard" element={<Layout><ManagerDashboard /></Layout>} />
                    <Route path="/numbers/all" element={<Layout><AllNumbers /></Layout>} />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App; 