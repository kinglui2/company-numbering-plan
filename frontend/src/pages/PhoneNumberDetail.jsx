import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PhoneNumberDetail() {
    const { id } = useParams();
    const [number, setNumber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // TODO: Fetch number details from API
        // For now, using dummy data
        setNumber({
            id: id,
            full_number: '254207901234',
            status: 'assigned',
            subscriber_name: 'John Doe',
            company_name: 'Example Corp',
            assignment_date: '2024-03-20'
        });
        setLoading(false);
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!number) return <div>Number not found</div>;

    return (
        <div className="container">
            <div className="card">
                <h2>Phone Number Details</h2>
                <div className="number-details">
                    <p><strong>Full Number:</strong> {number.full_number}</p>
                    <p><strong>Status:</strong> {number.status}</p>
                    <p><strong>Subscriber:</strong> {number.subscriber_name || 'N/A'}</p>
                    <p><strong>Company:</strong> {number.company_name || 'N/A'}</p>
                    <p><strong>Assignment Date:</strong> {number.assignment_date || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
}

export default PhoneNumberDetail; 