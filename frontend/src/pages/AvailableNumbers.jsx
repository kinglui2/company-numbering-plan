import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, CircularProgress, Alert, TextField, Button, Stack, Switch, FormControlLabel, InputAdornment } from '@mui/material';
import { DataGrid, gridPageCountSelector, gridPageSelector, useGridApiContext, useGridSelector } from '@mui/x-data-grid';
import { FaUserPlus, FaFileExport, FaSearch } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/NumbersTable.css';

const AvailableNumbers = () => {
    const navigate = useNavigate();
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 100,
    });
    const [rowCount, setRowCount] = useState(0);
    
    // Filter states
    const [showGoldenOnly, setShowGoldenOnly] = useState(false);
    const [numberRange, setNumberRange] = useState({ start: '', end: '' });
    const [subscriberSearch, setSubscriberSearch] = useState('');
    const [quickSearchTimeout, setQuickSearchTimeout] = useState(null);

    useEffect(() => {
        fetchNumbers();
    }, [paginationModel.page, paginationModel.pageSize, showGoldenOnly, numberRange.start, numberRange.end]);

    useEffect(() => {
        if (quickSearchTimeout) {
            clearTimeout(quickSearchTimeout);
        }

        const timeout = setTimeout(() => {
            fetchNumbers();
        }, 300);

        setQuickSearchTimeout(timeout);

        return () => {
            if (quickSearchTimeout) {
                clearTimeout(quickSearchTimeout);
            }
        };
    }, [subscriberSearch]);

    const columns = [
        { 
            field: 'full_number', 
            headerName: 'Full Number', 
            width: 140,
            flex: 1,
            minWidth: 140,
        },
        { 
            field: 'is_golden', 
            headerName: 'Is Golden', 
            width: 100,
            flex: 0.8,
            minWidth: 100,
            type: 'boolean',
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
            flex: 1,
            minWidth: 150,
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
            flex: 1.2,
            minWidth: 140,
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
            flex: 0.8,
            minWidth: 100,
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
            flex: 0.5,
            minWidth: 80,
            sortable: false,
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

    const handleGoldenToggle = () => {
        setShowGoldenOnly(prev => !prev);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    };

    const handleRangeChange = (field) => (event) => {
        const value = event.target.value;
        if (value.length <= 4 && /^\d*$/.test(value)) {
            setNumberRange(prev => ({
                ...prev,
                [field]: value
            }));
            setPaginationModel(prev => ({ ...prev, page: 0 }));
        }
    };

    const handleSubscriberSearch = (event) => {
        const value = event.target.value;
        if (value.length <= 4 && /^\d*$/.test(value)) {
            setSubscriberSearch(value);
            setPaginationModel(prev => ({ ...prev, page: 0 }));
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAvailableNumbers(
                1,
                rowCount,
                {
                    fetchAll: true,
                    is_golden: showGoldenOnly || undefined,
                    range_start: numberRange.start || undefined,
                    range_end: numberRange.end || undefined,
                    subscriber_search: subscriberSearch || undefined
                }
            );

            const headers = ['Full Number', 'Is Golden', 'Last Unassigned', 'Previous Company', 'Gateway'];
            const csvData = response.numbers.map(number => [
                number.full_number,
                number.is_golden ? 'Yes' : 'No',
                number.unassignment_date ? new Date(number.unassignment_date).toLocaleDateString() : 'Never Assigned',
                number.previous_company || 'Never Previously Assigned',
                number.gateway || '-'
            ]);

            const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `available_numbers_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            setError('Failed to export numbers');
            console.error('Error exporting numbers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAvailableNumbers(
                paginationModel.page + 1,
                paginationModel.pageSize,
                {
                    is_golden: showGoldenOnly || undefined,
                    range_start: numberRange.start || undefined,
                    range_end: numberRange.end || undefined,
                    subscriber_search: subscriberSearch || undefined
                }
            );
            setNumbers(response.numbers);
            setRowCount(response.total_count || 0);
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
                {/* Filter Toolbar */}
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showGoldenOnly}
                                    onChange={handleGoldenToggle}
                                    color="primary"
                                />
                            }
                            label="Golden Numbers Only"
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                label="Range Start"
                                value={numberRange.start}
                                onChange={handleRangeChange('start')}
                                size="small"
                                inputProps={{ maxLength: 4 }}
                                sx={{ width: '100px' }}
                            />
                            <Typography>to</Typography>
                            <TextField
                                label="Range End"
                                value={numberRange.end}
                                onChange={handleRangeChange('end')}
                                size="small"
                                inputProps={{ maxLength: 4 }}
                                sx={{ width: '100px' }}
                            />
                        </Stack>
                        <TextField
                            label="Search Last 4 Digits"
                            value={subscriberSearch}
                            onChange={handleSubscriberSearch}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: '150px' }}
                        />
                    </Stack>
                    <Button
                        variant="outlined"
                        startIcon={<FaFileExport />}
                        onClick={handleExport}
                        disabled={loading}
                    >
                        Export
                    </Button>
                </Stack>

                    <div className="numbers-table-container">
                        <DataGrid
                            rows={numbers}
                            columns={columns}
                            loading={loading}
                        rowCount={rowCount}
                        pageSizeOptions={[100]}
                        paginationModel={paginationModel}
                        paginationMode="server"
                        onPaginationModelChange={setPaginationModel}
                        disableColumnFilter
                        disableColumnSelector
                        disableDensitySelector
                            getRowId={(row) => row.id}
                            sx={{
                                '& .MuiDataGrid-cell:focus': {
                                    outline: 'none',
                                },
                                '& .MuiDataGrid-row:hover': {
                                    cursor: 'pointer',
                                },
                            }}
                        />
                    </div>
            </Paper>
        </Box>
    );
};

export default AvailableNumbers; 