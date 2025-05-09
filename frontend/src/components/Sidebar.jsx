import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
    FaHome, 
    FaHashtag, 
    FaUserPlus, 
    FaHistory, 
    FaChartBar, 
    FaUsers, 
    FaCog, 
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';

function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isNumbersExpanded, setIsNumbersExpanded] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    const isManager = user?.role === 'manager';

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleNumbers = () => {
        setIsNumbersExpanded(!isNumbersExpanded);
    };

    const navItems = [
        { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
        {
            path: '/numbers',
            icon: <FaHashtag />,
            label: 'Numbers',
            subItems: [
                { path: '/numbers/all', label: 'All Numbers' },
                { path: '/numbers/available', label: 'Available Numbers' },
                { path: '/numbers/cooloff', label: 'Cooloff Numbers' },
                { path: '/numbers/assigned', label: 'Assigned/Unassigned' },
                { path: '/numbers/missing', label: 'Missing Data' }
            ]
        },
        { path: '/assign', icon: <FaUserPlus />, label: 'Assign' }
    ];

    const managerItems = [
        { path: '/logs', icon: <FaHistory />, label: 'Logs' },
        { path: '/reports', icon: <FaChartBar />, label: 'Reports' },
        { path: '/users', icon: <FaUsers />, label: 'Users' },
        { path: '/settings', icon: <FaCog />, label: 'Settings' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <img src="/logo.png" alt="Company Logo" className="logo" />
                <button className="collapse-btn" onClick={toggleCollapse}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
            </div>

            <div className="user-profile">
                <div className="avatar">{user?.username[0].toUpperCase()}</div>
                {!isCollapsed && (
                    <div className="user-info">
                        <div className="username">{user?.username}</div>
                        <div className="role">{user?.role}</div>
                    </div>
                )}
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <div key={item.path} className="nav-item">
                        {item.subItems ? (
                            <>
                                <div 
                                    className={`nav-link ${isNumbersExpanded ? 'expanded' : ''}`}
                                    onClick={toggleNumbers}
                                >
                                    {item.icon}
                                    {!isCollapsed && (
                                        <>
                                            <span>{item.label}</span>
                                            <span className="arrow">▼</span>
                                        </>
                                    )}
                                </div>
                                {!isCollapsed && isNumbersExpanded && (
                                    <div className="sub-items">
                                        {item.subItems.map((subItem) => (
                                            <Link
                                                key={subItem.path}
                                                to={subItem.path}
                                                className={`sub-item ${isActive(subItem.path) ? 'active' : ''}`}
                                            >
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                to={item.path}
                                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                            >
                                {item.icon}
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        )}
                    </div>
                ))}

                {isManager && managerItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                        {item.icon}
                        {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={logout}>
                    <FaSignOutAlt />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}

export default Sidebar; 