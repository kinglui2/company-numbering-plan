import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import NumbersIcon from "@mui/icons-material/Numbers";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AvailableIcon from "@mui/icons-material/CheckCircle";
import TimerIcon from "@mui/icons-material/Timer";
import authService from "../services/auth";
import { phoneNumberService } from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await phoneNumberService.getDashboardStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError("Failed to load dashboard statistics");
            console.error("Error fetching stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <CircularProgress size={60} thickness={4} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <Alert severity="error">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <NumbersIcon />
                    </div>
                    <div className="stat-content">
                        <h3>Total Numbers</h3>
                        <p className="stat-value">{stats?.totalNumbers?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="stat-card assigned">
                    <div className="stat-icon">
                        <AssignmentIcon />
                    </div>
                    <div className="stat-content">
                        <h3>Assigned Numbers</h3>
                        <p className="stat-value">{stats?.assignedNumbers?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="stat-card available">
                    <div className="stat-icon">
                        <AvailableIcon />
                    </div>
                    <div className="stat-content">
                        <h3>Available Numbers</h3>
                        <p className="stat-value">{stats?.availableNumbers?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="stat-card cooloff">
                    <div className="stat-icon">
                        <TimerIcon />
                    </div>
                    <div className="stat-content">
                        <h3>Cool-off Numbers</h3>
                        <p className="stat-value">{stats?.cooloffNumbers?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-actions">
                <div className="quick-actions">
                    <div className="actions-header">
                        <h2>Quick Actions</h2>
                        <button className="refresh-button" onClick={fetchStats}>
                            <RefreshIcon />
                            <span>Refresh Stats</span>
                        </button>
                    </div>
                    <div className="action-buttons">
                        <Link to="/numbers/all" className="action-button">
                            <NumbersIcon />
                            <span>All Numbers</span>
                        </Link>
                        <Link to="/numbers/available" className="action-button">
                            <AvailableIcon />
                            <span>Available Numbers</span>
                        </Link>
                        <Link to="/numbers/cooloff" className="action-button">
                            <TimerIcon />
                            <span>Cool-off Numbers</span>
                        </Link>
                        <Link to="/numbers/assigned" className="action-button">
                            <AssignmentIcon />
                            <span>Assigned Numbers</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard; 