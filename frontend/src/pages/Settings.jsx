import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
    Stack,
    Tooltip,
    IconButton
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';
import '../styles/Settings.css';

const API_URL = 'http://localhost:5000/api';

function Settings() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // System Configuration
    const [systemConfig, setSystemConfig] = useState({
        cooloffPeriod: 90,
        defaultGateway: 'CS01',
        numberFormat: 'standard'
    });

    // Security Configuration
    const [securityConfig, setSecurityConfig] = useState({
        passwordExpiry: 'none',
        maxLoginAttempts: 5,
        sessionTimeout: 30
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const [systemResponse, securityResponse] = await Promise.all([
                axios.get(`${API_URL}/settings/system`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/settings/security`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Convert string boolean values to actual booleans for system settings
            const systemSettings = Object.entries(systemResponse.data).reduce((acc, [key, value]) => {
                if (value === 'true') acc[key] = true;
                else if (value === 'false') acc[key] = false;
                else if (!isNaN(value)) acc[key] = Number(value);
                else acc[key] = value;
                return acc;
            }, {});

            // Ensure security settings have proper values with defaults
            const securitySettings = {
                passwordExpiry: securityResponse.data.passwordExpiry || 'none',
                maxLoginAttempts: Number(securityResponse.data.maxLoginAttempts) || 5,
                sessionTimeout: Number(securityResponse.data.sessionTimeout) || 30
            };

            setSystemConfig(systemSettings);
            setSecurityConfig(securitySettings);
            setError(null);
        } catch (err) {
            setError('Failed to load settings');
            console.error('Error loading settings:', err);
            // Set default values if API call fails
            setSecurityConfig({
                passwordExpiry: 'none',
                maxLoginAttempts: 5,
                sessionTimeout: 30
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSystemConfigChange = (field) => (event) => {
        setSystemConfig(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSecurityConfigChange = (field) => (event) => {
        setSecurityConfig(prev => ({
            ...prev,
            [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null); // Clear any previous errors
            const token = localStorage.getItem('token');
            
            if (activeTab === 0) {
                await axios.put(`${API_URL}/settings/system`, systemConfig, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.put(`${API_URL}/settings/security`, securityConfig, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setSuccess('Settings saved successfully');
            // Keep success message visible longer
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            console.error('Error saving settings:', err);
            // Show more detailed error message
            const errorMessage = err.response?.data?.message || 'Failed to save settings. Please try again.';
            setError(errorMessage);
            // Keep error message visible until user dismisses it
        } finally {
            setSaving(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="settings-container">
            <Typography variant="h4" gutterBottom>
                System Settings
            </Typography>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }} 
                    onClose={() => setError(null)}
                    action={
                        <Button color="inherit" size="small" onClick={() => setError(null)}>
                            Dismiss
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert 
                    severity="success" 
                    sx={{ mb: 2 }} 
                    onClose={() => setSuccess(null)}
                >
                    {success}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="System Configuration" />
                    <Tab label="Security Settings" />
                </Tabs>
            </Paper>

            {activeTab === 0 ? (
                <Paper sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Number Management
                            </Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Cooloff Period (days)"
                                        type="number"
                                        value={systemConfig.cooloffPeriod}
                                        onChange={handleSystemConfigChange('cooloffPeriod')}
                                        InputProps={{ inputProps: { min: 1, max: 365 } }}
                                        helperText="Number of days a number must wait before being reassigned"
                                    />
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Default Gateway</InputLabel>
                                    <Select
                                        value={systemConfig.defaultGateway}
                                        onChange={handleSystemConfigChange('defaultGateway')}
                                        label="Default Gateway"
                                    >
                                        <MenuItem value="CS01">CS01</MenuItem>
                                        <MenuItem value="LS02">LS02</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Number Format</InputLabel>
                                    <Select
                                        value={systemConfig.numberFormat}
                                        onChange={handleSystemConfigChange('numberFormat')}
                                        label="Number Format"
                                    >
                                        <MenuItem value="standard">Standard (25420790XXXX)</MenuItem>
                                        <MenuItem value="formatted">Formatted (020790XXXX)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Security Settings
                            </Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Password Expiry</InputLabel>
                                    <Select
                                        value={securityConfig.passwordExpiry}
                                        onChange={handleSecurityConfigChange('passwordExpiry')}
                                        label="Password Expiry"
                                    >
                                        <MenuItem value="none">None</MenuItem>
                                        <MenuItem value="30">30 days</MenuItem>
                                        <MenuItem value="60">60 days</MenuItem>
                                        <MenuItem value="90">90 days</MenuItem>
                                        <MenuItem value="180">180 days</MenuItem>
                                        <MenuItem value="365">365 days</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <TextField
                                        label="Max Login Attempts"
                                        type="number"
                                        value={securityConfig.maxLoginAttempts}
                                        onChange={handleSecurityConfigChange('maxLoginAttempts')}
                                        InputProps={{ inputProps: { min: 3, max: 10 } }}
                                        helperText="Maximum number of failed login attempts before account lockout"
                                    />
                                </FormControl>

                                <FormControl fullWidth>
                                    <TextField
                                        label="Session Timeout (minutes)"
                                        type="number"
                                        value={securityConfig.sessionTimeout}
                                        onChange={handleSecurityConfigChange('sessionTimeout')}
                                        InputProps={{ inputProps: { min: 5, max: 120 } }}
                                        helperText="Time of inactivity before automatic logout"
                                    />
                                </FormControl>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </Box>
        </Box>
    );
}

export default Settings; 