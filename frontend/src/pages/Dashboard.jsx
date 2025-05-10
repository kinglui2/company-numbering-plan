import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CircularProgress, Alert } from '@mui/material';
import authService from '../services/auth';
import { phoneNumberService } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        totalNumbers: 0,
        assignedNumbers: 0,
        availableNumbers: 0,
        cooloffNumbers: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await phoneNumberService.getDashboardStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError('Failed to load dashboard stats');
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const user = authService.getCurrentUser();

    if (loading) {
        return (
            <div className="dashboard">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard">
                <Alert severity="error">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon total-icon">📊</div>
                        <div className="stat-info">
                            <h3>Total Numbers</h3>
                            <p className="stat-value">{stats.totalNumbers}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon assigned-icon">✅</div>
                        <div className="stat-info">
                            <h3>Assigned Numbers</h3>
                            <p className="stat-value">{stats.assignedNumbers}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon available-icon">🔢</div>
                        <div className="stat-info">
                            <h3>Available Numbers</h3>
                            <p className="stat-value">{stats.availableNumbers}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cooloff-icon">⏳</div>
                        <div className="stat-info">
                            <h3>Cooloff Numbers</h3>
                            <p className="stat-value">{stats.cooloffNumbers}</p>
                        </div>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <Link to="/numbers/all" className="action-button">
                            <span className="button-icon">📋</span>
                            <span className="button-text">View All Numbers</span>
                        </Link>
                        <Link to="/numbers/available" className="action-button">
                            <span className="button-icon">🔍</span>
                            <span className="button-text">View Available Numbers</span>
                        </Link>
                        <Link to="/numbers/cooloff" className="action-button">
                            <span className="button-icon">⏰</span>
                            <span className="button-text">View Cooloff Numbers</span>
                        </Link>
                        {user?.role === 'manager' && (
                            <>
                                <Link to="/logs" className="action-button">
                                    <span className="button-icon">📝</span>
                                    <span className="button-text">View Logs</span>
                                </Link>
                                <Link to="/reports" className="action-button">
                                    <span className="button-icon">📊</span>
                                    <span className="button-text">View Reports</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard; 