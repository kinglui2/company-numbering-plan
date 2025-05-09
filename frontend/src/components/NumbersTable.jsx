import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, CircularProgress, Alert, Box, Typography } from '@mui/material';
import { FaEye, FaEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import '../styles/NumbersTable.css';

const NumbersTable = () => {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(10000); // Set initial total count

    // Handle resize and navbar changes
    useEffect(() => {
        const handleResize = () => {
            // Force a re-render by updating the state
            setCurrentPage(prev => prev);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('navbarToggle', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('navbarToggle', handleResize);
        };
    }, []);

    useEffect(() => {
        fetchNumbers();
    }, [currentPage]);

    const columns = [
        { 
            field: 'full_number', 
            headerName: 'Full Number', 
            width: 140,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div className="number-cell">{params.value}</div>
                </Tooltip>
            ),
        },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 120,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={`Status: ${params.value}`}>
                    <div className={`status-cell status-${params.value.toLowerCase()}`}>
                        {params.value}
                    </div>
                </Tooltip>
            ),
        },
        { 
            field: 'is_golden', 
            headerName: 'Golden Number', 
            width: 120,
            type: 'boolean',
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value ? 'Golden Number' : 'Regular Number'}>
                    <div className={`golden-cell ${params.value ? 'golden' : 'regular'}`}>
                        {params.value ? 'Yes' : 'No'}
                    </div>
                </Tooltip>
            ),
        },
        { 
            field: 'gateway', 
            headerName: 'Gateway', 
            width: 120,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={`Gateway: ${params.value}`}>
                    <div className="gateway-cell">{params.value}</div>
                </Tooltip>
            ),
        },
        { 
            field: 'subscriber_name', 
            headerName: 'Subscriber', 
            width: 180,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value || 'No subscriber'}>
                    <div className="subscriber-cell">{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        { 
            field: 'company_name', 
            headerName: 'Company', 
            width: 180,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value || 'No company'}>
                    <div className="company-cell">{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div className="action-buttons">
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={() => handleViewDetails(params.row)}
                            className="action-button view-button"
                        >
                            <FaEye />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Number">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(params.row)}
                            className="action-button edit-button"
                        >
                            <FaEdit />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAllNumbers(
                currentPage,
                pageSize
            );
            setNumbers(response.numbers);
            // Only update total count if it's provided by the API
            if (response.total_count) {
                setTotalCount(response.total_count);
            }
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage * pageSize < totalCount) {
            setCurrentPage(prev => prev + 1);
        }
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
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading numbers: {error}
            </Alert>
        );
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="numbers-table-container">
            <DataGrid
                rows={numbers}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                hideFooter={true}
                autoHeight={false}
                columnBuffer={0}
                columnThreshold={0}
                density="comfortable"
                disableColumnMenu={false}
                disableColumnFilter={false}
                disableColumnSelector={false}
                disableDensitySelector={false}
                disableSelectionOnClick={true}
                checkboxSelection={false}
                sx={{
                    '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                    },
                    '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer',
                    },
                    '& .MuiDataGrid-virtualScrollerContent': {
                        height: '100% !important'
                    }
                }}
            />
            <div className="pagination-container">
                <div className="pagination-info">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} numbers
                </div>
                <div className="pagination-buttons">
                    <button 
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        <FaChevronLeft />
                    </button>
                    <button 
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={currentPage * pageSize >= totalCount}
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NumbersTable; 