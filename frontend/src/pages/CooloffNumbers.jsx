import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { CircularProgress, Alert, Tooltip } from '@mui/material';
import { phoneNumberService } from '../services/api';
import '../styles/cooloff.css';

function CooloffNumbers() {
    const [numbers, setNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const columns = [
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
            field: 'cooloff_start_date',
            headerName: 'Cooloff Start',
            width: 150,
            renderCell: (params) => {
                if (!params.value) return <div>-</div>;
                try {
                    const date = new Date(params.value);
                    const formatted = date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    return (
                        <Tooltip title={formatted}>
                            <div>{formatted}</div>
                        </Tooltip>
                    );
                } catch (err) {
                    console.error('Error formatting date:', err);
                    return <div>-</div>;
                }
            }
        },
        {
            field: 'days_remaining',
            headerName: 'Cooloff Period',
            width: 150,
            valueGetter: (params) => {
                if (!params.row) return 90;
                return params.row.days_remaining;
            },
            renderCell: (params) => {
                const days = params.value;
                return (
                    <Tooltip title={`${days} day cooloff period`}>
                        <div>
                            {days} days
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            field: 'previous_company',
            headerName: 'Previous Company',
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || 'N/A'}</div>
                </Tooltip>
            ),
        },
        {
            field: 'previous_subscriber',
            headerName: 'Previous Subscriber',
            width: 200,
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <div>{params.value || 'N/A'}</div>
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
    ];

    useEffect(() => {
        fetchCooloffNumbers();
    }, [page, pageSize]);

    const fetchCooloffNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getCooloffNumbers(page + 1, pageSize);
            console.log('Raw response data:', response);
            
            if (response.numbers && response.numbers.length > 0) {
                console.log('First number cooloff_start_date:', response.numbers[0].cooloff_start_date);
            }
            
            setNumbers(response.numbers || []);
            setTotalCount(response.pagination?.total || 0);
            setError(null);
        } catch (err) {
            console.error('Error fetching cooloff numbers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading cooloff numbers: {error}
            </Alert>
        );
    }

    return (
        <div className="cooloff-numbers-container">
            <h1>Cooloff Numbers</h1>
            <div className="info-box">
                <p>Numbers in cooloff status cannot be reassigned for 90 days after unassignment.</p>
            </div>
            
            {loading ? (
                <div className="loading-container">
                    <CircularProgress />
                </div>
            ) : (
                <DataGrid
                    rows={numbers}
                    columns={columns}
                    pagination
                    paginationMode="server"
                    page={page}
                    pageSize={pageSize}
                    rowCount={totalCount}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    disableSelectionOnClick
                    autoHeight
                    getRowId={(row) => row.id || row.full_number}
                    sx={{
                        '& .near-completion': {
                            color: 'orange',
                            fontWeight: 'bold',
                        },
                        '& .golden-indicator.is-golden': {
                            color: 'gold',
                            fontWeight: 'bold',
                        },
                    }}
                />
            )}
        </div>
    );
}

export default CooloffNumbers; 