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
            valueFormatter: (params) => {
                if (!params.value) return '-';
                return new Date(params.value).toLocaleDateString();
            },
        },
        {
            field: 'days_remaining',
            headerName: 'Days Remaining',
            width: 150,
            valueGetter: (params) => {
                if (!params.row.cooloff_start_date) return '-';
                const startDate = new Date(params.row.cooloff_start_date);
                const today = new Date();
                const cooloffDays = 90; // Cooloff period in days
                const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                return Math.max(0, cooloffDays - daysElapsed);
            },
            renderCell: (params) => {
                const days = params.value;
                return (
                    <Tooltip title={`${days} days until available`}>
                        <div className={days <= 7 ? 'near-completion' : ''}>
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
            setNumbers(response.numbers);
            setTotalCount(response.total);
            setError(null);
        } catch (err) {
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