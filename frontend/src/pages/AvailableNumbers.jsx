import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AvailableNumbersTable from '../components/AvailableNumbersTable';

const AvailableNumbers = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Available Numbers
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Numbers that are unassigned and past their 90-day cool-off period, eligible for reassignment.
            </Typography>
            <Paper sx={{ p: 2 }}>
                <AvailableNumbersTable />
            </Paper>
        </Box>
    );
};

export default AvailableNumbers; 