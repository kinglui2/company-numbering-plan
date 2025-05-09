import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { phoneNumberService } from '../services/api';
import '../styles/numbers.css';

function NumberList({ title, fetchNumbers, showFilters = true }) {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        gateway: '',
        isGolden: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        loadNumbers();
    }, [page, searchTerm, filters]);

    const loadNumbers = async () => {
        try {
            setLoading(true);
            const data = await fetchNumbers(page, searchTerm, filters);
            setNumbers(data.numbers);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page on new search
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1); // Reset to first page on filter change
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="number-list">
            <div className="header">
                <h1>{title}</h1>
                {showFilters && (
                    <div className="filters">
                        <input
                            type="text"
                            placeholder="Search numbers..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="cooloff">Cooloff</option>
                        </select>
                        <select
                            name="gateway"
                            value={filters.gateway}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="">All Gateways</option>
                            <option value="CS01">CS01</option>
                            <option value="CS02">CS02</option>
                            {/* Add more gateways as needed */}
                        </select>
                        <select
                            name="isGolden"
                            value={filters.isGolden}
                            onChange={handleFilterChange}
                            className="filter-select"
                        >
                            <option value="">All Numbers</option>
                            <option value="true">Golden Numbers</option>
                            <option value="false">Regular Numbers</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="numbers-grid">
                {numbers.map((number) => (
                    <div key={number.id} className="number-card">
                        <h3>{number.full_number}</h3>
                        <p>Status: {number.status}</p>
                        <p>Gateway: {number.gateway || 'N/A'}</p>
                        {number.subscriber_name && (
                            <p>Subscriber: {number.subscriber_name}</p>
                        )}
                        {number.company_name && (
                            <p>Company: {number.company_name}</p>
                        )}
                        {number.assignment_date && (
                            <p>Assigned: {new Date(number.assignment_date).toLocaleDateString()}</p>
                        )}
                        {number.is_golden && <span className="golden-badge">Golden</span>}
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default NumberList; 