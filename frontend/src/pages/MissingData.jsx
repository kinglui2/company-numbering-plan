import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Snackbar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FaEdit } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import '../styles/NumbersTable.css';

const MissingData = () => {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        totalMissing: 0,
        missingSubscriber: 0,
        missingCompany: 0,
        missingGateway: 0,
        missingGatewayUsername: 0
    });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [editFormData, setEditFormData] = useState({
        subscriber_name: '',
        company_name: '',
        gateway: '',
        gateway_username: ''
    });
    const [selectedMissingType, setSelectedMissingType] = useState('all');
    const [editError, setEditError] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Available gateways in the system
    const GATEWAYS = ['CS01', 'LS02'];

    useEffect(() => {
        fetchNumbers();
    }, [currentPage, selectedMissingType]);

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getMissingDataNumbers(
                currentPage,
                pageSize,
                selectedMissingType
            );
            
            if (response && response.numbers) {
                setNumbers(response.numbers);
                setTotalCount(response.total || 0);
                setStats(response.stats || {});
                setError(null);
            }
        } catch (err) {
            setError('Failed to load numbers with missing data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (number) => {
        setSelectedNumber(number);
        setEditFormData({
            subscriber_name: number.subscriber_name || '',
            company_name: number.company_name || '',
            gateway: number.gateway || '',
            gateway_username: number.gateway_username || ''
        });
        setEditError(null);
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setEditLoading(true);
            setEditError(null);
            await phoneNumberService.updateNumber(selectedNumber.id, editFormData);
            setEditDialogOpen(false);
            await fetchNumbers();
            // Show success message using snackbar
            setSnackbar({
                open: true,
                message: 'Number updated successfully',
                severity: 'success'
            });
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update number. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleCloseEdit = () => {
        setEditDialogOpen(false);
        setEditError(null);
        setEditFormData({});
    };

    const getMissingDataChip = (value, label) => {
        return value ? (
            <Chip 
                label={value} 
                size="small" 
                color="default"
            />
        ) : (
            <Chip 
                label={`Missing ${label}`} 
                size="small" 
                color="error"
            />
        );
    };

    const columns = [
        {
            field: 'full_number',
            headerName: 'Number',
            width: 130,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div style={{ fontFamily: 'monospace' }}>{params.value}</div>
                </Tooltip>
            ),
        },
        {
            field: 'subscriber_name',
            headerName: 'Subscriber',
            width: 160,
            renderCell: (params) => getMissingDataChip(params.value, 'Subscriber'),
        },
        {
            field: 'company_name',
            headerName: 'Company',
            width: 160,
            renderCell: (params) => getMissingDataChip(params.value, 'Company'),
        },
        {
            field: 'gateway',
            headerName: 'Gateway',
            width: 120,
            renderCell: (params) => getMissingDataChip(params.value, 'Gateway'),
        },
        {
            field: 'gateway_username',
            headerName: 'Gateway Username',
            width: 150,
            renderCell: (params) => getMissingDataChip(params.value, 'Username'),
        },
        {
            field: 'assignment_date',
            headerName: 'Assigned Date',
            width: 120,
            valueFormatter: (params) => {
                if (!params?.value) return '';
                return new Date(params.value).toLocaleDateString();
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 70,
            sortable: false,
            renderCell: (params) => (
                <Tooltip title="Edit Number">
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(params.row)}
                        color="primary"
                    >
                        <FaEdit />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading numbers: {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                {/* Header and Stats Combined Section */}
                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Typography variant="h5">
                            Missing Data Numbers
                        </Typography>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel size="small">Filter Missing Data</InputLabel>
                            <Select
                                size="small"
                                value={selectedMissingType}
                                label="Filter Missing Data"
                                onChange={(e) => {
                                    setSelectedMissingType(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <MenuItem value="all">All Missing Data</MenuItem>
                                <MenuItem value="subscriber">Missing Subscriber</MenuItem>
                                <MenuItem value="company">Missing Company</MenuItem>
                                <MenuItem value="gateway">Missing Gateway</MenuItem>
                                <MenuItem value="gateway_username">Missing Gateway Username</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Compact Stats */}
                    <Stack 
                        direction="row" 
                        spacing={3} 
                        sx={{ 
                            mt: 2,
                            overflowX: 'auto',
                            '&::-webkit-scrollbar': { height: 6 },
                            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3 }
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">Total</Typography>
                            <Typography variant="h6">{stats.totalMissing}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Missing Subscriber</Typography>
                            <Typography variant="h6">{stats.missingSubscriber}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Missing Company</Typography>
                            <Typography variant="h6">{stats.missingCompany}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Missing Gateway</Typography>
                            <Typography variant="h6">{stats.missingGateway}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Missing Username</Typography>
                            <Typography variant="h6">{stats.missingGatewayUsername}</Typography>
                        </Box>
                    </Stack>
                </Paper>

                {/* Numbers Table */}
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
                                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} numbers with missing data
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
            </Stack>

            {/* Edit Dialog */}
            <Dialog 
                open={editDialogOpen} 
                onClose={handleCloseEdit}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Edit Number Details
                </DialogTitle>
                <DialogContent>
                    {editError && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2, mt: 1 }}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    onClick={() => setEditError(null)}
                                >
                                    Dismiss
                                </Button>
                            }
                        >
                            {editError}
                        </Alert>
                    )}
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Subscriber Name"
                            value={editFormData.subscriber_name || ''}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                subscriber_name: e.target.value
                            }))}
                            disabled={editLoading}
                        />
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={editFormData.company_name || ''}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                company_name: e.target.value
                            }))}
                            disabled={editLoading}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Gateway</InputLabel>
                            <Select
                                value={editFormData.gateway || ''}
                                label="Gateway"
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    gateway: e.target.value
                                }))}
                                disabled={editLoading}
                            >
                                {GATEWAYS.map(gw => (
                                    <MenuItem key={gw} value={gw}>{gw}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Gateway Username"
                            value={editFormData.gateway_username || ''}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                gateway_username: e.target.value
                            }))}
                            disabled={editLoading}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseEdit}
                        disabled={editLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={editLoading}
                        variant="contained"
                        color="primary"
                        startIcon={editLoading ? <CircularProgress size={20} /> : null}
                    >
                        {editLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MissingData; 