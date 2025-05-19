import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { FaUserPlus } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/NumbersTable.css';

const AvailableNumbers = () => {
    const navigate = useNavigate();
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(0);

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
            field: 'is_golden', 
            headerName: 'Is Golden', 
            width: 100,
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
            field: 'unassignment_date',
            headerName: 'Last Unassigned',
            width: 150,
            filterable: true,
            renderCell: (params) => {
                if (!params.value) {
                    return <div>Never Assigned</div>;
                }
                const date = new Date(params.value);
                return (
                    <Tooltip title={date.toLocaleString()}>
                        <div>{date.toLocaleDateString()}</div>
                    </Tooltip>
                );
            },
        },
        {
            field: 'previous_company',
            headerName: 'Previous Company',
            width: 160,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Never Previously Assigned'}>
                    <div>{params.value || 'Never Previously Assigned'}</div>
                </Tooltip>
            ),
        },
        { 
            field: 'gateway', 
            headerName: 'Gateway', 
            width: 130,
            filterable: true,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Not Set'}>
                    <div className="gateway-cell">{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'actions',
            headerName: 'Assign',
            width: 80,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title="Assign Number">
                        <IconButton
                            size="small"
                            onClick={() => handleAssign(params.row)}
                            sx={{ color: '#1976d2' }}
                        >
                            <FaUserPlus />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAvailableNumbers(
                currentPage,
                pageSize
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

    const handleAssign = (row) => {
        navigate('/assign', { 
            state: { 
                selectedNumber: row 
            }
        });
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading numbers: {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Available Numbers
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Numbers that are unassigned and past their 90-day cool-off period
            </Typography>
            <Paper sx={{ p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div className="numbers-table-container">
                        <DataGrid
                            rows={numbers}
                            columns={columns}
                            loading={loading}
                            disableRowSelectionOnClick
                            getRowId={(row) => row.id}
                            hideFooter={true}
                            autoHeight={false}
                            density="comfortable"
                            disableColumnMenu={false}
                            disableColumnFilter={false}
                            disableColumnSelector={false}
                            disableDensitySelector={false}
                            sx={{
                                '& .MuiDataGrid-cell:focus': {
                                    outline: 'none',
                                },
                                '& .MuiDataGrid-row:hover': {
                                    cursor: 'pointer',
                                },
                            }}
                        />
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
                )}
            </Paper>
        </Box>
    );
};

export default AvailableNumbers; 