import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Chip,
    Box
} from '@mui/material';

const NumberDetailsModal = ({ open, onClose, numberDetails }) => {
    if (!numberDetails) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Number Details: {numberDetails.full_number}
            </DialogTitle>
            <DialogContent dividers>
                <Box display="grid" gap={3}>
                    {/* Basic Information */}
                    <Box>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Basic Information
                        </Typography>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Status
                                </Typography>
                                <Chip 
                                    label={numberDetails.status}
                                    color={
                                        numberDetails.status === 'ASSIGNED' ? 'success' :
                                        numberDetails.status === 'UNASSIGNED' ? 'warning' :
                                        numberDetails.status === 'COOLOFF' ? 'error' : 'default'
                                    }
                                    size="small"
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Golden Number
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.is_golden ? 'Yes' : 'No'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Assignment Information */}
                    <Box>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Assignment Information
                        </Typography>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Subscriber Name
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.subscriber_name || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Company Name
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.company_name || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Gateway
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.gateway || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Assignment Date
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.assignment_date ? 
                                        new Date(numberDetails.assignment_date).toLocaleDateString() : 
                                        '-'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Previous Assignment (if in cooloff) */}
                    {numberDetails.status === 'COOLOFF' && (
                        <Box>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Previous Assignment
                            </Typography>
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Previous Subscriber
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.previous_subscriber || '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Previous Company
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.previous_company || '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Unassignment Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.unassignment_date ? 
                                            new Date(numberDetails.unassignment_date).toLocaleDateString() : 
                                            '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Days Remaining in Cooloff
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.days_remaining || '-'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NumberDetailsModal; 