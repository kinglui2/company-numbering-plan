import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { phoneNumberService } from '../services/api';

function PhoneNumberList({ availableOnly = false }) {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 0
    });

    const fetchNumbers = async (page) => {
        try {
            setLoading(true);
            const data = await phoneNumberService.getAllNumbers(page, 15, availableOnly);
            if (data && data.numbers) {
                setNumbers(data.numbers);
                setPagination(data.pagination);
                setError(null);
            } else {
                setNumbers([]);
                setError('Invalid data received from server');
            }
        } catch (err) {
            setNumbers([]);
            setError('Failed to load phone numbers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
        fetchNumbers(1);
    }, [availableOnly]);

    useEffect(() => {
        fetchNumbers(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const getStatusBadge = (number) => {
        if (number.effective_status === 'available') {
            return <span className="badge badge-success">Available</span>;
        } else if (number.status === 'cooloff') {
            const unassignedDate = new Date(number.unassigned_date);
            const daysRemaining = Math.max(0, 90 - Math.floor((new Date() - unassignedDate) / (1000 * 60 * 60 * 24)));
            return (
                <span className="badge badge-warning">
                    Cooloff ({daysRemaining} days)
                </span>
            );
        } else {
            return <span className={`badge badge-${number.status}`}>{number.status}</span>;
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    return (
        <div className="container">
            <div className="card">
                <h2>{availableOnly ? 'Available Numbers' : 'All Phone Numbers'}</h2>
                <div className="table-container compact-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Full Number</th>
                                <th>Status</th>
                                <th>Company</th>
                                <th>Subscriber</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {numbers && numbers.length > 0 ? (
                                numbers.map(number => (
                                    <tr key={number.id}>
                                        <td>{number.full_number}</td>
                                        <td>{getStatusBadge(number)}</td>
                                        <td>{number.company_name || '-'}</td>
                                        <td>{number.subscriber_name || '-'}</td>
                                        <td>
                                            <Link to={`/number/${number.id}`} className="btn btn-primary btn-sm">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>
                                        No phone numbers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {numbers && numbers.length > 0 && (
                    <div className="pagination">
                        <button
                            className="btn btn-sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            className="btn btn-sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PhoneNumberList; 