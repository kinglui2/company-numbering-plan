import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CooloffNumbers() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // TODO: Fetch cooloff numbers from API
        // For now, using dummy data
        setNumbers([
            {
                id: 1,
                full_number: '254207901234',
                unassigned_date: '2024-03-01',
                previous_subscriber: 'John Doe',
                previous_company: 'Example Corp'
            },
            {
                id: 2,
                full_number: '254207901235',
                unassigned_date: '2024-03-15',
                previous_subscriber: 'Jane Smith',
                previous_company: 'Test Corp'
            }
        ]);
        setLoading(false);
    }, []);

    const getDaysRemaining = (unassignedDate) => {
        const unassigned = new Date(unassignedDate);
        const today = new Date();
        const daysPassed = Math.floor((today - unassigned) / (1000 * 60 * 60 * 24));
        return Math.max(0, 90 - daysPassed);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container">
            <div className="card">
                <h2>Cooloff Numbers</h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Full Number</th>
                                <th>Unassigned Date</th>
                                <th>Previous Subscriber</th>
                                <th>Previous Company</th>
                                <th>Days Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {numbers.map(number => (
                                <tr key={number.id}>
                                    <td>{number.full_number}</td>
                                    <td>{new Date(number.unassigned_date).toLocaleDateString()}</td>
                                    <td>{number.previous_subscriber}</td>
                                    <td>{number.previous_company}</td>
                                    <td>{getDaysRemaining(number.unassigned_date)}</td>
                                    <td>
                                        <Link to={`/number/${number.id}`} className="btn btn-sm">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CooloffNumbers; 