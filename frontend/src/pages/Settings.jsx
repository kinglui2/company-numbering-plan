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
        numberFormat: 'standard',
        enableNotifications: true
    });

    // Security Settings
    const [securityConfig, setSecurityConfig] = useState({
        passwordMinLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
        sessionTimeout: 30,
        enableTwoFactor: false,
        maxLoginAttempts: 5
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

            // Convert string boolean values to actual booleans for security settings
            const securitySettings = Object.entries(securityResponse.data).reduce((acc, [key, value]) => {
                if (value === 'true') acc[key] = true;
                else if (value === 'false') acc[key] = false;
                else if (!isNaN(value)) acc[key] = Number(value);
                else acc[key] = value;
                return acc;
            }, {});

            setSystemConfig(systemSettings);
            setSecurityConfig(securitySettings);
            setError(null);
        } catch (err) {
            setError('Failed to load settings');
            console.error('Error loading settings:', err);
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
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save settings');
            console.error('Error saving settings:', err);
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
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
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
                                        <MenuItem value="standard">Standard (1234567890)</MenuItem>
                                        <MenuItem value="formatted">Formatted (123-456-7890)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Notifications
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemConfig.enableNotifications}
                                        onChange={handleSystemConfigChange('enableNotifications')}
                                    />
                                }
                                label="Enable Email Notifications"
                            />
                        </Box>
                    </Stack>
                </Paper>
            ) : (
                <Paper sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Password Policy
                            </Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Minimum Password Length"
                                        type="number"
                                        value={securityConfig.passwordMinLength}
                                        onChange={handleSecurityConfigChange('passwordMinLength')}
                                        InputProps={{ inputProps: { min: 6, max: 32 } }}
                                    />
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={securityConfig.requireSpecialChars}
                                            onChange={handleSecurityConfigChange('requireSpecialChars')}
                                        />
                                    }
                                    label="Require Special Characters"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={securityConfig.requireNumbers}
                                            onChange={handleSecurityConfigChange('requireNumbers')}
                                        />
                                    }
                                    label="Require Numbers"
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={securityConfig.requireUppercase}
                                            onChange={handleSecurityConfigChange('requireUppercase')}
                                        />
                                    }
                                    label="Require Uppercase Letters"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Session Management
                            </Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <TextField
                                        label="Session Timeout (minutes)"
                                        type="number"
                                        value={securityConfig.sessionTimeout}
                                        onChange={handleSecurityConfigChange('sessionTimeout')}
                                        InputProps={{ inputProps: { min: 5, max: 1440 } }}
                                    />
                                </FormControl>

                                <FormControl fullWidth>
                                    <TextField
                                        label="Maximum Login Attempts"
                                        type="number"
                                        value={securityConfig.maxLoginAttempts}
                                        onChange={handleSecurityConfigChange('maxLoginAttempts')}
                                        InputProps={{ inputProps: { min: 3, max: 10 } }}
                                    />
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={securityConfig.enableTwoFactor}
                                            onChange={handleSecurityConfigChange('enableTwoFactor')}
                                        />
                                    }
                                    label="Enable Two-Factor Authentication"
                                />
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