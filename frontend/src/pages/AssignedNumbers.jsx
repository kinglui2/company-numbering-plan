import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
    CircularProgress, 
    Alert, 
    Tooltip, 
    ToggleButtonGroup, 
    ToggleButton,
    IconButton
} from '@mui/material';
import { FaEye, FaEdit } from 'react-icons/fa';
import { phoneNumberService } from '../services/api';
import '../styles/assigned.css';

function AssignedNumbers() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'unassigned'

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
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div>{params.value}</div>
                </Tooltip>
            ),
        },
        {
            field: 'subscriber_name',
            headerName: 'Subscriber',
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'company_name',
            headerName: 'Company',
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'gateway',
            headerName: 'Gateway',
            width: 120,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'gateway_username',
            headerName: 'Gateway Username',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || '-'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'assignment_date',
            headerName: 'Assigned Date',
            width: 150,
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
            headerName: 'Golden Number',
            width: 130,
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
                    <Tooltip title="Edit">
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

    const unassignedColumns = [
        {
            field: 'full_number',
            headerName: 'Number',
            width: 150,
            renderCell: (params) => (
                <Tooltip title={params.value}>
                    <div>{params.value}</div>
                </Tooltip>
            ),
        },
        {
            field: 'unassignment_date',
            headerName: 'Last Unassigned',
            width: 150,
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
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Never Previously Assigned'}>
                    <div>{params.value || 'Never Previously Assigned'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'previous_subscriber',
            headerName: 'Previous Subscriber',
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'Never Previously Assigned'}>
                    <div>{params.value || 'Never Previously Assigned'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'is_golden',
            headerName: 'Golden Number',
            width: 130,
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
                    <Tooltip title="Edit">
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

    const handleViewDetails = (row) => {
        // TODO: Implement view details functionality
        console.log('View details for:', row);
    };

    const handleEdit = (row) => {
        // TODO: Implement edit functionality
        console.log('Edit:', row);
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
                minWidth: '800px'
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
        </div>
    );
}

export default AssignedNumbers; 