import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { phoneNumberService } from '../services/api';
import '../styles/numbers.css';

function AllNumbers() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNumbers = async () => {
            try {
                const data = await phoneNumberService.getAllNumbers();
                setNumbers(data.numbers || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNumbers();
    }, []);

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
                        <h3>{number.full_number}</h3>
                        <p>Status: {number.status}</p>
                        {number.company_name && (
                            <p>Company: {number.company_name}</p>
                        )}
                        {number.subscriber_name && (
                            <p>Subscriber: {number.subscriber_name}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AllNumbers; 