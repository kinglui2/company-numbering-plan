import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Chip,
    Fade,
    useTheme,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
    Info as InfoIcon,
    Assignment as AssignIcon,
    Update as UpdateIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    Clear as ClearIcon,
    Search as SearchIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import activityService from '../services/activityService';
import { format } from 'date-fns';

const Activity = () => {
    const theme = useTheme();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        actionType: '',
        targetType: '',
        startDate: null,
        endDate: null,
        searchTerm: ''
    });

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await activityService.getActivities({
                page: page + 1,
                limit: pageSize,
                ...filters,
                startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
                endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined
            });
            setActivities(response.activities);
            setTotalRows(response.pagination.total);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch activities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [page, pageSize, filters]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            actionType: '',
            targetType: '',
            startDate: null,
            endDate: null,
            searchTerm: ''
        });
    };

    const handleViewDetails = async (activity) => {
        try {
            const details = await activityService.getActivityById(activity.id);
            setSelectedActivity(details);
            setOpenDialog(true);
        } catch (err) {
            setError('Failed to fetch activity details');
        }
    };

    const getActionIcon = (actionType) => {
        switch (actionType.toLowerCase()) {
            case 'assign':
                return <AssignIcon sx={{ color: theme.palette.success.main }} />;
            case 'unassign':
                return <ClearIcon sx={{ color: theme.palette.error.main }} />;
            case 'update':
                return <UpdateIcon sx={{ color: theme.palette.info.main }} />;
            case 'login':
                return <LoginIcon sx={{ color: theme.palette.primary.main }} />;
            case 'logout':
                return <LogoutIcon sx={{ color: theme.palette.warning.main }} />;
            default:
                return null;
        }
    };

    const getActionColor = (actionType) => {
        switch (actionType.toLowerCase()) {
            case 'assign':
                return 'success';
            case 'unassign':
                return 'error';
            case 'update':
                return 'info';
            case 'login':
                return 'primary';
            case 'logout':
                return 'warning';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            field: 'action_type',
            headerName: 'Action',
            width: 150,
            renderCell: (params) => (
                <Chip
                    icon={getActionIcon(params.value)}
                    label={params.value}
                    color={getActionColor(params.value)}
                    variant="outlined"
                    size="small"
                />
            )
        },
        {
            field: 'target_type',
            headerName: 'Target Type',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    variant="outlined"
                />
            )
        },
        { field: 'target_id', headerName: 'Target ID', width: 150 },
        { field: 'user_name', headerName: 'User', width: 150 },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 180,
            valueFormatter: (params) => format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss')
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <Tooltip title="View Details">
                    <IconButton
                        onClick={() => handleViewDetails(params.row)}
                        sx={{
                            '&:hover': {
                                backgroundColor: theme.palette.primary.light,
                                color: theme.palette.primary.main
                            }
                        }}
                    >
                        <InfoIcon />
                    </IconButton>
                </Tooltip>
            )
        }
    ];

    const renderValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    return (
        <Box p={3}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
                Activity Log
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" component="h2">
                            Filters
                        </Typography>
                        <Button
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                            size="small"
                        >
                            Clear All
                        </Button>
                    </Box>
                    <Grid container spacing={2} alignItems="center">
                        <Grid grid={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Action Type"
                                value={filters.actionType}
                                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                variant="outlined"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="assign">Assign</MenuItem>
                                <MenuItem value="unassign">Unassign</MenuItem>
                                <MenuItem value="update">Update</MenuItem>
                                <MenuItem value="login">Login</MenuItem>
                                <MenuItem value="logout">Logout</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid grid={{ xs: 12, sm: 6, md: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Target Type"
                                value={filters.targetType}
                                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                                variant="outlined"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="phone_number">Phone Number</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="system">System</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid grid={{ xs: 12, sm: 6, md: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid grid={{ xs: 12, sm: 6, md: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid grid={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Search"
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                placeholder="Search by ID, username, or details..."
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                }}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card>
                <DataGrid
                    rows={activities}
                    columns={columns}
                    pagination
                    page={page}
                    pageSize={pageSize}
                    rowCount={totalRows}
                    rowsPerPageOptions={[10, 25, 50]}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    loading={loading}
                    disableSelectionOnClick
                    paginationMode="server"
                    sx={{
                        height: 600,
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: theme.palette.action.hover
                        }
                    }}
                />
            </Card>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
                TransitionComponent={Fade}
                transitionDuration={300}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" component="div">
                        Activity Details
                    </Typography>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {selectedActivity && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {Object.entries(selectedActivity).map(([key, value]) => (
                                <Grid grid={{ xs: 12 }} key={key}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography
                                                variant="subtitle2"
                                                color="textSecondary"
                                                gutterBottom
                                                sx={{ textTransform: 'capitalize' }}
                                            >
                                                {key.replace(/_/g, ' ')}
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    fontFamily: 'monospace',
                                                    backgroundColor: theme.palette.grey[50],
                                                    p: 1,
                                                    borderRadius: 1
                                                }}
                                            >
                                                {renderValue(value)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOpenDialog(false)}
                        variant="contained"
                        color="primary"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Activity; 