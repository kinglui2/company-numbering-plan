import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllNumbers from './pages/AllNumbers';
import CooloffNumbers from './pages/CooloffNumbers';
import AssignedNumbers from './pages/AssignedNumbers';
import MissingData from './pages/MissingData';
import PublishedNumbers from './pages/PublishedNumbers';
import PhoneNumberDetails from './pages/PhoneNumberDetails';
import AvailableNumbers from './pages/AvailableNumbers';
import Assign from './pages/Assign';
import Activity from './pages/Activity';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Users from './pages/Users';
import Settings from './pages/Settings';
import './styles/main.css';
import './styles/layout.css';

function App() {
    return (
        <ErrorBoundary>
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
                        <Route path="/numbers/published" element={<Layout><PublishedNumbers /></Layout>} />
                        <Route path="/numbers/:id" element={<Layout><PhoneNumberDetails /></Layout>} />
                        <Route path="/assign" element={<Layout><Assign /></Layout>} />
                        
                        {/* Manager routes */}
                        <Route 
                            path="/activity" 
                            element={
                                <ProtectedRoute allowedRoles={['manager']}>
                                    <Layout><Activity /></Layout>
                                </ProtectedRoute>
                            } 
                        />
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute allowedRoles={['manager']}>
                                    <Layout><Users /></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute allowedRoles={['manager']}>
                                    <Layout><Settings /></Layout>
                                </ProtectedRoute>
                            }
                        />
                        
                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
}

export default App; 