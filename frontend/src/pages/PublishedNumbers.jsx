import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, CircularProgress, Alert, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FaGlobe, FaUser, FaUndo } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import '../styles/NumbersTable.css';

const PublishedNumbers = () => {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 100,
    });
    const [rowCount, setRowCount] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', number: null });
    const [confirmAll, setConfirmAll] = useState(false);
    const [unpublishing, setUnpublishing] = useState(false);

    useEffect(() => {
        fetchPublishedNumbers();
    }, [paginationModel.page, paginationModel.pageSize]);

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
            field: 'published_date',
            headerName: 'Published Date',
            width: 150,
            flex: 1,
            minWidth: 150,
            renderCell: (params) => {
                if (!params.value) {
                    return <div>-</div>;
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
            field: 'published_by_username',
            headerName: 'Published By',
            width: 140,
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Unknown'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaUser size={12} />
                        {params.value || 'Unknown'}
                    </div>
                </Tooltip>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            flex: 0.8,
            minWidth: 100,
            renderCell: (params) => (
                <Chip
                    icon={<FaGlobe />}
                    label="Published"
                    color="success"
                    size="small"
                    variant="filled"
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            flex: 0.8,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                <Tooltip title="Unpublish Number">
                    <span>
                        <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setConfirmDialog({ open: true, type: 'unpublish', number: params.row })}
                            disabled={unpublishing}
                        >
                            <FaUndo />
                        </IconButton>
                    </span>
                </Tooltip>
            ),
        },
    ];

    const fetchPublishedNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getPublishedNumbers(
                paginationModel.page + 1,
                paginationModel.pageSize
            );
            setNumbers(response.numbers);
            setRowCount(response.pagination.total);
            setError(null);
        } catch (err) {
            setError('Failed to load published numbers');
            console.error('Error fetching published numbers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnpublish = async () => {
        if (!confirmDialog.number) return;
        try {
            setUnpublishing(true);
            await phoneNumberService.unpublishNumber(confirmDialog.number.id);
            setConfirmDialog({ open: false, type: '', number: null });
            await fetchPublishedNumbers();
        } catch (error) {
            setError(error.message);
        } finally {
            setUnpublishing(false);
        }
    };

    const handleUnpublishAll = async () => {
        setConfirmAll(true);
    };

    const confirmUnpublishAll = async () => {
        try {
            setUnpublishing(true);
            // Unpublish all numbers currently listed
            await Promise.all(numbers.map(n => phoneNumberService.unpublishNumber(n.id)));
            setConfirmAll(false);
            await fetchPublishedNumbers();
        } catch (error) {
            setError(error.message);
        } finally {
            setUnpublishing(false);
        }
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading published numbers: {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Published Numbers
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Numbers currently published on the company website
            </Typography>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<FaUndo />}
                        onClick={handleUnpublishAll}
                        disabled={unpublishing || numbers.length === 0}
                    >
                        Unpublish All
                    </Button>
                </Box>
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
                        }}
                    />
                </div>
            </Paper>

            {/* Confirmation Dialog for Individual Unpublish */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: '', number: null })}>
                <DialogTitle>Confirm Unpublish</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to unpublish the number <b>{confirmDialog.number?.full_number}</b>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, type: '', number: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleUnpublish} color="warning" variant="contained" disabled={unpublishing}>
                        {unpublishing ? 'Unpublishing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Unpublish All */}
            <Dialog open={confirmAll} onClose={() => setConfirmAll(false)}>
                <DialogTitle>Confirm Unpublish All</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to unpublish <b>all</b> currently listed published numbers?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmAll(false)}>
                        Cancel
                    </Button>
                    <Button onClick={confirmUnpublishAll} color="warning" variant="contained" disabled={unpublishing}>
                        {unpublishing ? 'Unpublishing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PublishedNumbers; 