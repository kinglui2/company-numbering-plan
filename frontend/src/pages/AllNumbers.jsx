import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/numbers.css';

function AllNumbers() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNumbers = async () => {
            try {
                const response = await fetch('/api/numbers', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch numbers');
                }

                const data = await response.json();
                setNumbers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNumbers();
    }, [user.token]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="all-numbers">
            <h1>All Numbers</h1>
            <div className="numbers-grid">
                {numbers.map((number) => (
                    <div key={number.id} className="number-card">
                        <h3>{number.number}</h3>
                        <p>Status: {number.status}</p>
                        <p>Type: {number.type}</p>
                        {number.assignedTo && (
                            <p>Assigned to: {number.assignedTo}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllNumbers; 