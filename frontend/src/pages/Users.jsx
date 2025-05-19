import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Typography,
    Chip,
    Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import '../styles/Users.css';

const API_URL = 'http://localhost:5000/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'support',
    });
    const [formError, setFormError] = useState('');
    const [rowCount, setRowCount] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            console.log('Fetching users with token:', token);
            console.log('Request params:', { page, pageSize });
            
            const response = await axios.get(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    page,
                    pageSize,
                },
            });
            
            console.log('API Response:', response.data);
            
            if (response.data && Array.isArray(response.data.rows)) {
                setUsers(response.data.rows);
                setRowCount(response.data.rowCount);
            } else {
                console.error('Invalid response format:', response.data);
                setError('Invalid response format from server');
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            console.error('Error details:', {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.headers
            });
            setError(err.response?.data?.message || 'Failed to fetch users');
            setLoading(false);
        }
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'support',
            });
        }
        setFormError('');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'support',
        });
        setFormError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setFormError('');
            const token = localStorage.getItem('token');
            if (editingUser) {
                await axios.put(`${API_URL}/users/${editingUser.id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                await axios.post(`${API_URL}/users`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            handleCloseDialog();
            fetchUsers();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save user');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/users/${userId}/status`, {
                is_active: !currentStatus,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchUsers();
        } catch (err) {
            setError('Failed to update user status');
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/users/${userToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const columns = [
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'role',
            headerName: 'Role',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'manager' ? 'primary' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'is_active',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Active' : 'Inactive'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            ),
        },
        {
            field: 'last_login',
            headerName: 'Last Login',
            flex: 1,
            valueFormatter: (params) => {
                if (!params || !params.value) return 'Never';
                const date = new Date(params.value);
                return isNaN(date.getTime()) ? 'Never' : date.toLocaleString();
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(params.row)}
                        color="primary"
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(params.row)}
                        color="error"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box className="users-container">
            <Box className="users-header">
                <Typography variant="h5" className="users-title">
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Add User
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box className="users-table" sx={{ width: '100%', overflowX: 'hidden' }}>
                <DataGrid
                    rows={users}
                    columns={columns}
                    pageSize={pageSize}
                    page={page}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    loading={loading}
                    disableSelectionOnClick
                    autoHeight
                    getRowId={(row) => row.id}
                    rowCount={rowCount}
                    paginationMode="server"
                    sx={{ width: '100%' }}
                />
            </Box>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {formError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formError}
                            </Alert>
                        )}
                        <Box className="user-form">
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!editingUser}
                                helperText={editingUser ? 'Leave blank to keep current password' : ''}
                                margin="normal"
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Role</InputLabel>
                                <Select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    label="Role"
                                >
                                    <MenuItem value="support">Support</MenuItem>
                                    <MenuItem value="manager">Manager</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {editingUser ? 'Save Changes' : 'Add User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Users; 