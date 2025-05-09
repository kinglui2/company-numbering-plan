import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth';

function Dashboard() {
    const [stats, setStats] = useState({
        totalNumbers: 0,
        assignedNumbers: 0,
        availableNumbers: 0,
        cooloffNumbers: 0
    });

    useEffect(() => {
        // TODO: Fetch dashboard stats from API
        // For now, using dummy data
        setStats({
            totalNumbers: 1000,
            assignedNumbers: 750,
            availableNumbers: 200,
            cooloffNumbers: 50
        });
    }, []);

    const user = authService.getCurrentUser();

    return (
        <div className="dashboard">
            <header className="header">
                <div className="container header-content">
                    <h1>Phone Number Management</h1>
                    <div className="user-info">
                        <span>Welcome, {user?.username}</span>
                        <button 
                            onClick={() => {
                                authService.logout();
                                window.location.href = '/login';
                            }}
                            className="btn btn-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>Total Numbers</h3>
                        <p className="stat-value">{stats.totalNumbers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Assigned Numbers</h3>
                        <p className="stat-value">{stats.assignedNumbers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Available Numbers</h3>
                        <p className="stat-value">{stats.availableNumbers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Cooloff Numbers</h3>
                        <p className="stat-value">{stats.cooloffNumbers}</p>
                    </div>
                </div>

                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                        <Link to="/numbers" className="btn btn-primary">
                            View All Numbers
                        </Link>
                        <Link to="/numbers/available" className="btn btn-primary">
                            View Available Numbers
                        </Link>
                        <Link to="/numbers/cooloff" className="btn btn-primary">
                            View Cooloff Numbers
                        </Link>
                        {user?.role === 'manager' && (
                            <>
                                <Link to="/logs" className="btn btn-primary">
                                    View Logs
                                </Link>
                                <Link to="/reports" className="btn btn-primary">
                                    View Reports
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