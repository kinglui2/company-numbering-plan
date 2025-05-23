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
    Stack
} from '@mui/material';
import { FaEye, FaEdit, FaUserMinus } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import NumberDetailsModal from '../components/NumberDetailsModal';
import '../styles/assigned.css';

function AssignedNumbers() {
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
    const [editFormData, setEditFormData] = useState({
        subscriber_name: '',
        company_name: '',
        gateway: '',
        gateway_username: ''
    });

    // Available gateways in the system
    const GATEWAYS = ['CS01', 'LS02'];

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
            setPage(1);
        }
    };

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
                </Box>
            ),
        },
    ];

    useEffect(() => {
        fetchNumbers();
    }, [page, pageSize, viewMode]);

    const fetchNumbers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Making request with:', { viewMode, page, pageSize });
            
            const response = await phoneNumberService.getNumbersByStatus(
                viewMode,
                page,
                pageSize
            );
            
            console.log('API Response:', response);
            
            if (!response.numbers) {
                throw new Error('Invalid response format from server');
            }
            
            setNumbers(response.numbers);
            setTotalCount(response.total);
        } catch (err) {
            console.error('Error fetching numbers:', err);
            setError(err.message || 'Failed to fetch numbers. Please try again later.');
            setNumbers([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    };

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
        try {
            setLoading(true);
            await phoneNumberService.unassignNumber(selectedNumber.id, { notes: unassignNotes });
            setUnassignDialogOpen(false);
            setUnassignNotes('');
            setSelectedNumber(null);
            fetchNumbers(); // Refresh the list
        } catch (err) {
            setError('Failed to unassign number');
            console.error('Error unassigning number:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="assigned-numbers-container">
            <div className="header-section">
                <h1>Number Assignment Status</h1>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="number status view"
                    className="view-toggle"
                >
                    <ToggleButton value="assigned" aria-label="assigned numbers">
                        Assigned
                    </ToggleButton>
                    <ToggleButton value="unassigned" aria-label="unassigned numbers">
                        Unassigned
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>

            <div className="info-box">
                <p>
                    {viewMode === 'assigned' 
                        ? 'Currently assigned numbers with their subscriber and gateway details.'
                        : 'Numbers available for assignment with their previous assignment history.'}
                </p>
            </div>
            
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

            {console.log('Sample number:', JSON.stringify(numbers[0], null, 2))}
            {console.log('Column definitions:', JSON.stringify(viewMode === 'assigned' ? assignedColumns : unassignedColumns, null, 2))}

            <div className="data-grid-container" style={{ 
                height: 'calc(100vh - 250px)',
                width: '100%',
                minWidth: '0'
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
                        },
                        '& .MuiDataGrid-virtualScroller': {
                            overflowX: 'hidden !important'
                        },
                        '& .MuiDataGrid-virtualScrollerContent': {
                            minWidth: '100% !important'
                        },
                        '& .MuiDataGrid-virtualScrollerRenderZone': {
                            minWidth: '100% !important'
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
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => {
                            setUnassignDialogOpen(false);
                            setUnassignNotes('');
                            setSelectedNumber(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUnassign}
                        color="error"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Unassign'}
                    </Button>
                </DialogActions>
            </Dialog>

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