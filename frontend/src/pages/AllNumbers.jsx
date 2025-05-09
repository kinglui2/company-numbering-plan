import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import NumbersTable from '../components/NumbersTable';

const AllNumbers = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                All Numbers
            </Typography>
            <Paper sx={{ p: 2 }}>
                <NumbersTable />
            </Paper>
        </Box>
    );
};

export default AllNumbers; 