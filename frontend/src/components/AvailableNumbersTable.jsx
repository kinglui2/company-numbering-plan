import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaCrown } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import '../styles/AvailableNumbers.css';

const AvailableNumbersTable = () => {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        gateway: 'all'
    });

    useEffect(() => {
        fetchNumbers();
    }, [currentPage, filters]);

    const getAssignmentStatus = (row) => {
        if (!row.unassignment_date) {
            return {
                label: 'Never Assigned',
                className: 'status-never-assigned',
                tooltip: 'This number has never been assigned before'
            };
        }
        const days = row.days_since_unassigned;
        if (days > 90) {
            return {
                label: `Available (${days} days)`,
                className: 'status-available',
                tooltip: `This number was unassigned ${days} days ago and is available for assignment`
            };
        }
        return {
            label: `In Cool-off (${days} days)`,
            className: 'status-cooloff',
            tooltip: `This number was unassigned ${days} days ago and is in cool-off period`
        };
    };

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAvailableNumbers(
                currentPage,
                pageSize,
                filters
            );
            setNumbers(response.numbers);
            if (response.total_count) {
                setTotalCount(response.total_count);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load available numbers');
            console.error('Error fetching available numbers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handleAssign = (row) => {
        // TODO: Implement assign functionality
        console.log('Assign number:', row);
    };

    const handleViewDetails = (row) => {
        // TODO: Implement view details functionality
        console.log('View details for:', row);
    };

    const handleEdit = (row) => {
        // TODO: Implement edit functionality
        console.log('Edit:', row);
    };

    if (error) {
        return (
            <div className="error-message">
                {error}
            </div>
        );
    }

    return (
        <div className="numbers-table-container">
            <div className="filters-container">
                <div className="filter-group">
                    <label>Status:</label>
                    <select 
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="never_assigned">Never Assigned</option>
                        <option value="available">Available</option>
                        <option value="cooloff">In Cool-off</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Type:</label>
                    <select 
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="golden">Golden</option>
                        <option value="regular">Regular</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Gateway:</label>
                    <select 
                        value={filters.gateway}
                        onChange={(e) => handleFilterChange('gateway', e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="set">Set</option>
                        <option value="not_set">Not Set</option>
                    </select>
                </div>
            </div>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Full Number</th>
                            <th>Assignment Status</th>
                            <th>Golden</th>
                            <th>Gateway</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="loading-cell">
                                    <div className="loading-spinner">Loading...</div>
                                </td>
                            </tr>
                        ) : (
                            numbers.map((number) => {
                                const status = getAssignmentStatus(number);
                                return (
                                    <tr key={number.id}>
                                        <td>
                                            <div className="number-cell">
                                                {number.is_golden && (
                                                    <FaCrown className="golden-icon" />
                                                )}
                                                {number.full_number}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-chip ${status.className}`} title={status.tooltip}>
                                                {status.label}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`golden-status ${number.is_golden ? 'yes' : 'no'}`}>
                                                {number.is_golden ? 'Yes' : 'No'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`gateway-chip ${number.gateway ? 'set' : 'not-set'}`}>
                                                {number.gateway || 'Not Set'}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <div className="pagination-container">
                <div className="pagination-info">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} available numbers
                </div>
                <div className="pagination-buttons">
                    <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <button 
                        className="pagination-button"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage * pageSize >= totalCount}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvailableNumbersTable; 