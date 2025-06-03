import { useState, useEffect, useCallback } from 'react';
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
    CardContent,
    InputAdornment,
    Stack,
    Collapse,
    Snackbar,
    CircularProgress
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
    FilterList as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import activityService from '../services/activityService';
import { format, isAfter, isBefore } from 'date-fns';
import debounce from 'lodash/debounce';
import '../styles/Activity.css';

const Activity = () => {
    const theme = useTheme();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showFilters, setShowFilters] = useState(true);
    
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

    // Enhanced cleanup function
    const cleanupData = useCallback(() => {
        // Clear all data states
        setActivities([]);
        setError(null);
        setSuccessMessage(null);
        
        // Reset all filters
        setFilters({
            actionType: '',
            targetType: '',
            startDate: null,
            endDate: null,
            searchTerm: ''
        });
        
        // Reset pagination
        setPage(0);
        setPageSize(10);
        setTotalRows(0);
        
        // Reset loading states
        setLoading(false);
        setIsLoadingFilters(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupData();
        };
    }, [cleanupData]);

    const getErrorMessage = (error) => {
        if (error.response?.status === 404) return 'No activities found';
        if (error.response?.status === 403) return 'You do not have permission to view activities';
        if (error.response?.status === 400) return 'Invalid request parameters';
        return error.response?.data?.message || 'An unexpected error occurred';
    };

    const validateDateRange = (startDate, endDate) => {
        if (startDate && endDate && isAfter(startDate, endDate)) {
            setError('End date must be after start date');
            return false;
        }
        return true;
    };

    const fetchActivities = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!validateDateRange(filters.startDate, filters.endDate)) {
                return;
            }

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
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            console.error('Error fetching activities:', err);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search handler
    const debouncedSearch = useCallback(
        debounce(async (value) => {
            try {
                setFilters(prev => ({ ...prev, searchTerm: value }));
                setPage(0);
                await fetchActivities();
            } catch (err) {
                console.error('Error in debounced search:', err);
                setError('Search failed. Please try again.');
            }
        }, 300),
        []
    );

    const handleFilterChange = async (field, value) => {
        try {
            setIsLoadingFilters(true);
            setError(null);

            // Update the specific filter
            setFilters(prev => ({ ...prev, [field]: value }));
            
            // Reset page when filters change
            setPage(0);

            // For search term, use the debounced handler
            if (field === 'searchTerm') {
                debouncedSearch(value);
            } else {
                // For other filters, fetch immediately
                await fetchActivities();
            }
        } catch (err) {
            console.error('Error updating filter:', err);
            setError('Failed to update filter. Please try again.');
        } finally {
            setIsLoadingFilters(false);
        }
    };

    const clearFilters = async () => {
        try {
            setIsLoadingFilters(true);
            setError(null);

            // Reset all filter states
            const resetFilters = {
                actionType: '',
                targetType: '',
                startDate: null,
                endDate: null,
                searchTerm: ''
            };

            // Reset pagination
            setPage(0);
            setPageSize(10);

            // Update filters state
            setFilters(resetFilters);

            // Force update the search input value
            const searchInput = document.querySelector('input[aria-label="Search activities"]');
            if (searchInput) {
                searchInput.value = '';
            }

            // Reset date pickers
            const startDateInput = document.querySelector('input[aria-label="Filter by start date"]');
            const endDateInput = document.querySelector('input[aria-label="Filter by end date"]');
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';

            // Wait for state updates to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            // Fetch activities with cleared filters
            await fetchActivities();

            // Show success message only after everything is cleared
            setSuccessMessage('All filters have been cleared successfully');
        } catch (err) {
            console.error('Error clearing filters:', err);
            setError('Failed to clear filters. Please try again.');
        } finally {
            setIsLoadingFilters(false);
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    const handleCloseSuccess = () => {
        setSuccessMessage(null);
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
            renderCell: (params) => {
                const actionValue = typeof params === 'string' ? params : params.value;
                return (
                    <Chip
                        icon={getActionIcon(actionValue)}
                        label={actionValue}
                        color={getActionColor(actionValue)}
                        variant="outlined"
                        size="small"
                        className="action-chip"
                    />
                );
            }
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
                    className="target-chip"
                />
            )
        },
        { 
            field: 'target_id', 
            headerName: 'Target ID', 
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" className="cell-text">
                    {params.value}
                </Typography>
            )
        },
        { 
            field: 'user_name', 
            headerName: 'User', 
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" className="cell-text">
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 180,
            valueFormatter: (params) => {
                try {
                    const dateString = typeof params === 'string' ? params : params.value;
                    if (!dateString) return 'N/A';
                    
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return 'Invalid Date';
                    
                    return format(date, 'yyyy-MM-dd HH:mm:ss');
                } catch (error) {
                    return 'Invalid Date';
                }
            },
            renderCell: (params) => (
                <Typography variant="body2" className="cell-date">
                    {params.formattedValue}
                </Typography>
            )
        }
    ];

    const renderValue = (value) => {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    };

    useEffect(() => {
        fetchActivities();
    }, [page, pageSize, filters.actionType, filters.targetType, filters.startDate, filters.endDate]);

    // Add cleanup when component is hidden/unmounted
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                cleanupData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [cleanupData]);

    return (
        <Box className="activity-container" role="main" aria-label="Activity Log">
            <Box className="activity-header">
                <Typography variant="h4" component="h1" className="activity-title">
                    Activity Log
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                    aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={handleCloseError}
                    role="alert"
                >
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    onClose={handleCloseSuccess}
                    role="alert"
                >
                    {successMessage}
                </Alert>
            )}

            <Collapse in={showFilters}>
                <Card className="filter-card">
                    <CardContent>
                        <Box className="filter-header">
                            <Typography variant="h6" component="h2" className="filter-title">
                                <FilterIcon color="primary" />
                                Filters
                            </Typography>
                            <Button
                                startIcon={<ClearIcon />}
                                onClick={clearFilters}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                disabled={isLoadingFilters}
                                aria-label="Clear all filters"
                            >
                                {isLoadingFilters ? 'Clearing...' : 'Clear All'}
                            </Button>
                        </Box>
                        <Box className="filter-grid">
                            <TextField
                                select
                                className="filter-field"
                                label="Action Type"
                                value={filters.actionType}
                                onChange={(e) => handleFilterChange('actionType', e.target.value)}
                                variant="outlined"
                                size="small"
                                disabled={isLoadingFilters}
                                aria-label="Filter by action type"
                            >
                                <MenuItem value="">All Actions</MenuItem>
                                <MenuItem value="assign">Assign</MenuItem>
                                <MenuItem value="unassign">Unassign</MenuItem>
                                <MenuItem value="update">Update</MenuItem>
                                <MenuItem value="login">Login</MenuItem>
                                <MenuItem value="logout">Logout</MenuItem>
                            </TextField>

                            <TextField
                                select
                                className="filter-field"
                                label="Target Type"
                                value={filters.targetType}
                                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                                variant="outlined"
                                size="small"
                                disabled={isLoadingFilters}
                                aria-label="Filter by target type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="phone_number">Phone Number</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="system">System</MenuItem>
                            </TextField>

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                    textField={(params) => (
                                        <TextField
                                            {...params}
                                            className="filter-field"
                                            size="small"
                                            variant="outlined"
                                            disabled={isLoadingFilters}
                                            aria-label="Filter by start date"
                                        />
                                    )}
                                />
                            </LocalizationProvider>

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
                                    textField={(params) => (
                                        <TextField
                                            {...params}
                                            className="filter-field"
                                            size="small"
                                            variant="outlined"
                                            disabled={isLoadingFilters}
                                            aria-label="Filter by end date"
                                        />
                                    )}
                                />
                            </LocalizationProvider>

                            <TextField
                                className="filter-field filter-search"
                                label="Search"
                                value={filters.searchTerm}
                                onChange={(e) => debouncedSearch(e.target.value)}
                                variant="outlined"
                                size="small"
                                disabled={isLoadingFilters}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                placeholder="Search by user, target ID, or any other field..."
                                aria-label="Search activities"
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Collapse>

            <Card className="data-grid-card">
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
                    className="data-grid"
                    error={error}
                    components={{
                        NoRowsOverlay: () => (
                            <Stack height="100%" alignItems="center" justifyContent="center">
                                <Typography color="textSecondary">
                                    No activities found
                                </Typography>
                            </Stack>
                        ),
                        ErrorOverlay: () => (
                            <Stack height="100%" alignItems="center" justifyContent="center">
                                <Typography color="error">
                                    {error || 'An error occurred while loading activities'}
                                </Typography>
                            </Stack>
                        ),
                        LoadingOverlay: () => (
                            <Stack height="100%" alignItems="center" justifyContent="center">
                                <CircularProgress />
                            </Stack>
                        )
                    }}
                />
            </Card>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                message={successMessage}
            />
        </Box>
    );
};

export default Activity; 