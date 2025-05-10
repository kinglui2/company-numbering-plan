import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllNumbers from './pages/AllNumbers';
import AvailableNumbers from './pages/AvailableNumbers';
import CooloffNumbers from './pages/CooloffNumbers';
import AssignedNumbers from './pages/AssignedNumbers';
import MissingData from './pages/MissingData';
import './styles/main.css';
import './styles/layout.css';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route path="/" element={<Layout><Dashboard /></Layout>} />
                    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                    
                    {/* Number management routes */}
                    <Route path="/numbers/all" element={<Layout><AllNumbers /></Layout>} />
                    <Route path="/numbers/available" element={<Layout><AvailableNumbers /></Layout>} />
                    <Route path="/numbers/cooloff" element={<Layout><CooloffNumbers /></Layout>} />
                    <Route path="/numbers/assigned" element={<Layout><AssignedNumbers /></Layout>} />
                    <Route path="/numbers/missing" element={<Layout><MissingData /></Layout>} />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App; 