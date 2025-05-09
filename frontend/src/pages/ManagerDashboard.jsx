import { useAuth } from '../contexts/AuthContext';

function ManagerDashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manager Dashboard</h1>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Logout
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Welcome, {user?.username}!</p>
                <p>Role: {user?.role}</p>
            </div>
        </div>
    );
}

export default ManagerDashboard; 