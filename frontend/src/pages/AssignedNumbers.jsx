import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
    CircularProgress, 
    Alert, 
    Tooltip, 
    ToggleButtonGroup, 
    ToggleButton,
    IconButton,
    Box,
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
    FormControlLabel,
    Switch,
    Snackbar
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { FaEye, FaEdit, FaUserMinus, FaUserPlus } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import NumberDetailsModal from '../components/NumberDetailsModal';
import '../styles/assigned.css';
import { useNavigate } from 'react-router-dom';

function AssignedNumbers() {
    const navigate = useNavigate();
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'unassigned'
    const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [unassignNotes, setUnassignNotes] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedNumberDetails, setSelectedNumberDetails] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    
    // Filter states
    const [showGoldenOnly, setShowGoldenOnly] = useState(false);
    const [companySearch, setCompanySearch] = useState('');
    const [subscriberSearch, setSubscriberSearch] = useState('');
    const [selectedGateway, setSelectedGateway] = useState('');
    const [prevCompanySearch, setPrevCompanySearch] = useState('');
    const [prevSubscriberSearch, setPrevSubscriberSearch] = useState('');
    const [filterTimeout, setFilterTimeout] = useState(null);

    const [editFormData, setEditFormData] = useState({
        subscriber_name: '',
        company_name: '',
        gateway: '',
        gateway_username: ''
    });

    // Available gateways in the system
    const GATEWAYS = ['CS01', 'LS02'];

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const assignedColumns = [
        {
            field: 'full_number',
            headerName: 'Number',
            width: 130,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div>{params.value}</div>
                </Tooltip>
            ),
        },
        {
            field: 'subscriber_name',
            headerName: 'Subscriber',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'company_name',
            headerName: 'Company',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'gateway',
            headerName: 'Gateway',
            width: 100,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'gateway_username',
            headerName: 'Gateway User',
            width: 120,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'assignment_date',
            headerName: 'Assigned Date',
            width: 120,
            renderCell: (params) => {
                const formattedDate = params.value ? new Date(params.value).toLocaleDateString() : '-';
                return (
                    <Tooltip title={formattedDate}>
                        <div>{formattedDate}</div>
                    </Tooltip>
                );
            },
        },
        {
            field: 'is_golden',
            headerName: 'Golden',
            width: 90,
            renderCell: (params) => (
                <div className={`golden-indicator ${params.value ? 'is-golden' : ''}`}>
                    {params.value ? 'Yes' : 'No'}
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={() => handleViewDetails(params.row)}
                            sx={{ color: '#1976d2' }}
                        >
                            <FaEye />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(params.row)}
                            sx={{ color: '#ed6c02' }}
                        >
                            <FaEdit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Unassign">
                        <IconButton
                            size="small"
                            onClick={() => {
                                setSelectedNumber(params.row);
                                setUnassignDialogOpen(true);
                            }}
                            sx={{ color: '#d32f2f' }}
                        >
                            <FaUserMinus />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const unassignedColumns = [
        {
            field: 'full_number',
            headerName: 'Number',
            width: 130,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div>{params.value}</div>
                </Tooltip>
            ),
        },
        {
            field: 'unassignment_date',
            headerName: 'Last Unassigned',
            width: 120,
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
            headerName: 'Prev. Company',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Never Previously Assigned'}>
                    <div>{params.value || 'Never Previously Assigned'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'previous_subscriber',
            headerName: 'Prev. Subscriber',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Never Previously Assigned'}>
                    <div>{params.value || 'Never Previously Assigned'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'is_golden',
            headerName: 'Golden',
            width: 90,
            renderCell: (params) => (
                <div className={`golden-indicator ${params.value ? 'is-golden' : ''}`}>
                    {params.value ? 'Yes' : 'No'}
                </div>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            onClick={() => handleViewDetails(params.row)}
                            sx={{ color: '#1976d2' }}
                        >
                            <FaEye />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(params.row)}
                            sx={{ color: '#ed6c02' }}
                        >
                            <FaEdit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Assign">
                        <IconButton
                            size="small"
                            onClick={() => handleAssign(params.row)}
                            sx={{ color: '#4caf50' }}
                        >
                            <FaUserPlus />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    // Effect for handling filter changes
    useEffect(() => {
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }

        const timeout = setTimeout(() => {
            setPage(1); // Reset to first page when filters change
            fetchNumbers();
        }, 300); // Debounce filter changes

        setFilterTimeout(timeout);

        return () => {
            if (filterTimeout) {
                clearTimeout(filterTimeout);
            }
        };
    }, [showGoldenOnly, companySearch, subscriberSearch, selectedGateway, 
        prevCompanySearch, prevSubscriberSearch, viewMode]);

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            const filters = {
                is_golden: showGoldenOnly ? true : undefined,
                ...(viewMode === 'assigned' ? {
                    company_name: companySearch?.trim() || undefined,
                    subscriber_name: subscriberSearch?.trim() || undefined,
                    gateway: selectedGateway || undefined
                } : {
                    previous_company: prevCompanySearch?.trim() || undefined,
                    previous_subscriber: prevSubscriberSearch?.trim() || undefined
                })
            };
            
            // Remove any undefined values
            Object.keys(filters).forEach(key => 
                filters[key] === undefined && delete filters[key]
            );
            
            const response = await phoneNumberService.getNumbersByStatus(viewMode, page, pageSize, filters);
            setNumbers(response.numbers || []);
            setTotalCount(response.total || 0);
            setError(null);
        } catch (err) {
            setError(`Failed to load ${viewMode} numbers`);
            console.error(`Error fetching ${viewMode} numbers:`, err);
        } finally {
            setLoading(false);
        }
    };

    // Clear filters function
    const clearFilters = () => {
        setShowGoldenOnly(false);
        setCompanySearch('');
        setSubscriberSearch('');
        setSelectedGateway('');
        setPrevCompanySearch('');
        setPrevSubscriberSearch('');
        setPage(1); // Reset to first page when clearing filters
    };

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
            setPage(1);
            clearFilters(); // Clear filters when switching views
        }
    };

    useEffect(() => {
        fetchNumbers();
    }, [page, pageSize, viewMode]);

    const handleViewDetails = async (row) => {
        try {
            // Fetch detailed information about the number
            const details = await phoneNumberService.getNumberById(row.id);
            setSelectedNumberDetails(details);
            setIsDetailsModalOpen(true);
        } catch (err) {
            setError('Failed to fetch number details. Please try again.');
        }
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedNumberDetails(null);
    };

    const handleEdit = async (row) => {
        try {
            // Fetch detailed information about the number
            const details = await phoneNumberService.getNumberById(row.id);
            setSelectedNumber(details);
            setEditFormData({
                subscriber_name: details.subscriber_name || '',
                company_name: details.company_name || '',
                gateway: details.gateway || '',
                gateway_username: details.gateway_username || ''
            });
            setEditDialogOpen(true);
        } catch (err) {
            setError('Failed to fetch number details for editing. Please try again.');
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await phoneNumberService.updateNumber(selectedNumber.id, editFormData);
            setEditDialogOpen(false);
            await fetchNumbers(); // Refresh the list
            setError(null);
        } catch (err) {
            setError('Failed to update number. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async () => {
        if (!unassignNotes.trim()) {
            setError('Please provide unassignment notes');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await phoneNumberService.unassignNumber(selectedNumber.id, { notes: unassignNotes });
            
            setSnackbar({
                open: true,
                message: `Successfully unassigned number ${selectedNumber.full_number}`,
                severity: 'success'
            });
            
            // First clear the UI state
            setUnassignDialogOpen(false);
            setUnassignNotes('');
            setSelectedNumber(null);
            
            // Then fetch fresh data
            await fetchNumbers();
        } catch (err) {
            const errorMessage = err.message || 'Failed to unassign number. Please try again.';
            setError(errorMessage);
            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleAssign = (row) => {
        navigate('/assign', { 
            state: { 
                selectedNumber: row 
            }
        });
    };

    return (
        <div className="assigned-numbers-container">
            <Box sx={{ width: '100%', mb: 2 }}>
                <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                >
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="number status view"
                        sx={{
                            '& .MuiToggleButton-root': {
                                '&.Mui-selected': {
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: '#43a047'
                                    }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="assigned" aria-label="assigned numbers">
                            Assigned
                        </ToggleButton>
                        <ToggleButton value="unassigned" aria-label="unassigned numbers">
                            Unassigned
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Filters Section */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showGoldenOnly}
                                    onChange={(e) => setShowGoldenOnly(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Golden Numbers Only"
                        />
                        
                        {viewMode === 'assigned' ? (
                            <>
                                <TextField
                                    label="Company"
                                    value={companySearch}
                                    onChange={(e) => setCompanySearch(e.target.value)}
                                    size="small"
                                    sx={{ width: '150px' }}
                                />
                                <TextField
                                    label="Subscriber"
                                    value={subscriberSearch}
                                    onChange={(e) => setSubscriberSearch(e.target.value)}
                                    size="small"
                                    sx={{ width: '150px' }}
                                />
                                <FormControl size="small" sx={{ width: '150px' }}>
                                    <InputLabel>Gateway</InputLabel>
                                    <Select
                                        value={selectedGateway}
                                        onChange={(e) => setSelectedGateway(e.target.value)}
                                        label="Gateway"
                                    >
                                        <MenuItem value="">
                                            <em>Any</em>
                                        </MenuItem>
                                        {GATEWAYS.map(gateway => (
                                            <MenuItem key={gateway} value={gateway}>
                                                {gateway}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <>
                                <TextField
                                    label="Previous Company"
                                    value={prevCompanySearch}
                                    onChange={(e) => setPrevCompanySearch(e.target.value)}
                                    size="small"
                                    sx={{ width: '150px' }}
                                />
                                <TextField
                                    label="Previous Subscriber"
                                    value={prevSubscriberSearch}
                                    onChange={(e) => setPrevSubscriberSearch(e.target.value)}
                                    size="small"
                                    sx={{ width: '150px' }}
                                />
                            </>
                        )}
                        
                        <Button
                            variant="outlined"
                            onClick={clearFilters}
                            disabled={!showGoldenOnly && !companySearch && !subscriberSearch && 
                                    !selectedGateway && !prevCompanySearch && !prevSubscriberSearch}
                            size="small"
                        >
                            Clear Filters
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    action={
                        <IconButton
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setError(null);
                                fetchNumbers();
                            }}
                        >
                            Retry
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            )}

            <div className="data-grid-container" style={{ 
                height: 'calc(100vh - 250px)',
                width: '100%',
                minWidth: '0',
                flex: 1
            }}>
                <DataGrid
                    rows={numbers}
                    columns={viewMode === 'assigned' ? assignedColumns : unassignedColumns}
                    pagination
                    paginationMode="server"
                    rowCount={totalCount}
                    loading={loading}
                    pageSizeOptions={[25, 50, 100]}
                    disableSelectionOnClick
                    getRowId={(row) => row.id || row.full_number}
                    autoHeight={false}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: pageSize,
                                page: page - 1
                            },
                        },
                    }}
                    paginationModel={{
                        page: page - 1,
                        pageSize
                    }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page + 1);
                        setPageSize(model.pageSize);
                    }}
                    sx={{
                        '& .golden-indicator.is-golden': {
                            color: 'gold',
                            fontWeight: 'bold',
                        },
                        width: '100%',
                        height: '100%',
                        boxSizing: 'border-box',
                        '& .MuiDataGrid-row': {
                            maxHeight: '52px !important',
                            minHeight: '52px !important'
                        },
                        '& .MuiDataGrid-cell': {
                            padding: '0 8px !important'
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5'
                        }
                    }}
                    components={{
                        LoadingOverlay: CircularProgress,
                        NoRowsOverlay: () => (
                            <div style={{ 
                                display: 'flex', 
                                height: '100%', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}>
                                {loading ? 'Loading...' : error ? 'Error loading data' : 'No numbers found'}
                            </div>
                        )
                    }}
                />
            </div>

            <Dialog 
                open={unassignDialogOpen} 
                onClose={() => {
                    setUnassignDialogOpen(false);
                    setUnassignNotes('');
                    setSelectedNumber(null);
                }}
            >
                <DialogTitle>Unassign Number</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Unassignment Notes"
                            value={unassignNotes}
                            onChange={(e) => setUnassignNotes(e.target.value)}
                            placeholder="Enter reason for unassigning this number..."
                            required
                            error={error && !unassignNotes.trim()}
                            helperText={error && !unassignNotes.trim() ? 'Notes are required' : ''}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setUnassignDialogOpen(false);
                            setUnassignNotes('');
                            setSelectedNumber(null);
                            setError(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUnassign}
                        color="error"
                        disabled={loading || !unassignNotes.trim()}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Unassign'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert 
                    elevation={6} 
                    variant="filled" 
                    severity={snackbar.severity}
                    onClose={handleSnackbarClose}
                >
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>

            <NumberDetailsModal 
                open={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                numberDetails={selectedNumberDetails}
            />

            {/* Edit Dialog */}
            <Dialog 
                open={editDialogOpen} 
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Number Details</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Subscriber Name"
                            value={editFormData.subscriber_name}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                subscriber_name: e.target.value
                            }))}
                        />
                        <TextField
                            fullWidth
                            size="small"
                            label="Company Name"
                            value={editFormData.company_name}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                company_name: e.target.value
                            }))}
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Gateway</InputLabel>
                            <Select
                                value={editFormData.gateway}
                                label="Gateway"
                                onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    gateway: e.target.value
                                }))}
                            >
                                {GATEWAYS.map(gw => (
                                    <MenuItem key={gw} value={gw}>{gw}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            size="small"
                            label="Gateway Username"
                            value={editFormData.gateway_username}
                            onChange={(e) => setEditFormData(prev => ({
                                ...prev,
                                gateway_username: e.target.value
                            }))}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default AssignedNumbers; 