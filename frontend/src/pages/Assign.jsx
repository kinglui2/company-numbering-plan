import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Autocomplete,
    Grid,
    Button,
    Tooltip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StarIcon from '@mui/icons-material/Star';
import { phoneNumberService } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import MuiAlert from '@mui/material/Alert';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    width: '100%',
    height: 'calc(100vh - 100px)',
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(3),
    overflow: 'hidden'
}));

const FormSection = styled(Box)(({ theme }) => ({
    flex: 1,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    overflow: 'auto'
}));

const Assign = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [error, setError] = useState(null);
    const [showGoldenOnly, setShowGoldenOnly] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [formData, setFormData] = useState({
        subscriber_name: '',
        company_name: '',
        gateway: '',
        gateway_username: ''
    });

    // The only two valid gateways in the system
    const GATEWAYS = ['CS01', 'LS02'];

    useEffect(() => {
        fetchAvailableNumbers();
        // Check if we have a pre-selected number from navigation
        if (location.state?.selectedNumber) {
            setSelectedNumber(location.state.selectedNumber);
        }
    }, [location.state]);

    const fetchAvailableNumbers = async () => {
        try {
            setLoading(true);
            const response = await phoneNumberService.getAvailableNumbers(1, 10000, { fetchAll: true });
            setAvailableNumbers(response.numbers || []);
        } catch (error) {
            console.error('Error fetching available numbers:', error);
            setError('Failed to load available numbers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterOptions = (options, { inputValue }) => {
        const searchTerm = inputValue.trim();
        
        // First filter by golden status if enabled
        let filteredOptions = showGoldenOnly 
            ? options.filter(option => Boolean(option.is_golden))
            : options;
        
        // Then filter by search term if present
        if (searchTerm) {
            filteredOptions = filteredOptions.filter(option => 
                option.full_number.includes(searchTerm)
            );
        }

        return filteredOptions;
    };

    const handleNumberSelect = (event, newValue) => {
        setSelectedNumber(newValue);
    };

    const handleInputChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleGoldenToggle = () => {
        setShowGoldenOnly(!showGoldenOnly);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedNumber) {
            setError('Please select a number');
            return;
        }
        
        // Validate required fields
        if (!formData.subscriber_name.trim()) {
            setError('Subscriber Name is required');
            return;
        }
        if (!formData.company_name.trim()) {
            setError('Company Name is required');
            return;
        }
        if (!formData.gateway) {
            setError('Gateway is required');
            return;
        }
        if (!formData.gateway_username.trim()) {
            setError('Gateway Username is required');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            await phoneNumberService.assignNumber(selectedNumber.id, {
                ...formData,
                status: 'assigned'
            });
            setSnackbar({
                open: true,
                message: `Successfully assigned number ${selectedNumber.full_number}`,
                severity: 'success'
            });
            // Add delay before navigation
            setTimeout(() => {
                navigate('/numbers/assigned');
            }, 1500); // Show success message for 1.5 seconds before navigating
        } catch (error) {
            setError(error.message || 'Failed to assign number. Please try again.');
            setSnackbar({
                open: true,
                message: error.message || 'Failed to assign number. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <StyledPaper component="form" onSubmit={handleSubmit}>
            {/* Left Section - Number Details */}
            <FormSection>
                <Typography variant="h6" gutterBottom>
                    Number Details
                </Typography>

                {selectedNumber && (
                    <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontFamily: 'monospace' }}>
                            {selectedNumber.full_number}
                            {Boolean(selectedNumber.is_golden) && (
                                <Tooltip title="Golden Number">
                                    <StarIcon sx={{ ml: 1, color: 'gold', verticalAlign: 'top' }} />
                                </Tooltip>
                            )}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item>
                                <Typography variant="body1">
                                    <strong>Status:</strong> {selectedNumber.status}
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Typography variant="body1">
                                    <strong>Previous Assignment:</strong>{' '}
                                    {selectedNumber.unassignment_date ? (
                                        `Last unassigned on ${new Date(selectedNumber.unassignment_date).toLocaleDateString()}`
                                    ) : (
                                        'Never Previously Assigned'
                                    )}
                                </Typography>
                            </Grid>
                            {selectedNumber.previous_company && (
                                <Grid item>
                                    <Typography variant="body1">
                                        <strong>Previous Company:</strong> {selectedNumber.previous_company}
                                    </Typography>
                                </Grid>
                            )}
                            {selectedNumber.previous_subscriber && (
                                <Grid item>
                                    <Typography variant="body1">
                                        <strong>Previous Subscriber:</strong> {selectedNumber.previous_subscriber}
                                    </Typography>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                )}
            </FormSection>

            {/* Right Section - Form */}
            <FormSection>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Select Number
                    </Typography>
                    <Button
                        variant={showGoldenOnly ? "contained" : "outlined"}
                        color="warning"
                        onClick={handleGoldenToggle}
                        startIcon={<StarIcon />}
                        sx={{ 
                            color: showGoldenOnly ? 'white' : 'gold',
                            borderColor: showGoldenOnly ? 'transparent' : 'gold',
                            '&:hover': {
                                borderColor: showGoldenOnly ? 'transparent' : 'gold',
                            }
                        }}
                    >
                        Golden Numbers
                    </Button>
                </Box>
                
                <Autocomplete
                    options={availableNumbers}
                    getOptionLabel={(option) => option.full_number}
                    filterOptions={filterOptions}
                    loading={loading}
                    onChange={handleNumberSelect}
                    value={selectedNumber}
                    renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                            <li key={key} {...otherProps}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontFamily: 'monospace' }}>{option.full_number}</span>
                                    {Boolean(option.is_golden) && (
                                        <Tooltip title="Golden Number - Special pricing may apply">
                                            <StarIcon sx={{ ml: 1, color: 'gold' }} />
                                        </Tooltip>
                                    )}
                                </Box>
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={`Phone Number (${filterOptions(availableNumbers, { inputValue: '' }).length} available)`}
                            required
                            variant="outlined"
                            placeholder="Type to search"
                            InputProps={{
                                ...params.InputProps,
                                style: { fontFamily: 'monospace' },
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    ListboxProps={{
                        style: { 
                            maxHeight: '400px',
                            fontSize: '14px'
                        }
                    }}
                />

                <TextField
                    label="Subscriber Name"
                    value={formData.subscriber_name}
                    onChange={handleInputChange('subscriber_name')}
                    variant="outlined"
                    required
                    fullWidth
                />

                <TextField
                    label="Company Name"
                    value={formData.company_name}
                    onChange={handleInputChange('company_name')}
                    variant="outlined"
                    required
                    fullWidth
                />

                <FormControl fullWidth required>
                    <InputLabel>Gateway</InputLabel>
                    <Select
                        value={formData.gateway}
                        onChange={handleInputChange('gateway')}
                        label="Gateway"
                    >
                        {GATEWAYS.map(gateway => (
                            <MenuItem key={gateway} value={gateway}>
                                {gateway}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="Gateway Username"
                    value={formData.gateway_username}
                    onChange={handleInputChange('gateway_username')}
                    variant="outlined"
                    required
                    fullWidth
                />

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !selectedNumber}
                    sx={{ mt: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Assign Number'}
                </Button>
            </FormSection>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert 
                    elevation={6} 
                    variant="filled" 
                    severity={snackbar.severity}
                    onClose={handleSnackbarClose}
                >
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </StyledPaper>
    );
};

export default Assign; 