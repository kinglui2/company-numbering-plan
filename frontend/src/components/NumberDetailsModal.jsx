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
                <Typography variant="h6">
                    Number Details: {numberDetails.full_number}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Basic Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
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
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Golden Number
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.is_golden ? 'Yes' : 'No'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Assignment Information */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Assignment Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Subscriber Name
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.subscriber_name || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Company Name
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.company_name || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Gateway
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.gateway || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="textSecondary">
                                    Assignment Date
                                </Typography>
                                <Typography variant="body1">
                                    {numberDetails.assignment_date ? 
                                        new Date(numberDetails.assignment_date).toLocaleDateString() : 
                                        '-'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Previous Assignment (if in cooloff) */}
                    {numberDetails.status === 'COOLOFF' && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Previous Assignment
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Previous Subscriber
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.previous_subscriber || '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Previous Company
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.previous_company || '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Unassignment Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.unassignment_date ? 
                                            new Date(numberDetails.unassignment_date).toLocaleDateString() : 
                                            '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Days Remaining in Cooloff
                                    </Typography>
                                    <Typography variant="body1">
                                        {numberDetails.days_remaining || '-'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </Grid>
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