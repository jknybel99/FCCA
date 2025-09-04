import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const UserProfile = () => {
  const { user, checkAuthStatus } = useAuth();
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    is_admin: false,
    created_at: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at
      });
    }
  }, [user]);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await api.updateUser(user.id, {
        username: profileData.username,
        email: profileData.email
      });

      setSuccess('Profile updated successfully!');
      setEditDialogOpen(false);
      await checkAuthStatus(); // Refresh user data
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      // Note: This would need a dedicated change password endpoint
      // For now, we'll show a message that this feature needs backend support
      setError('Password change feature requires backend implementation');
      
    } catch (err) {
      setError('Failed to change password: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h2">
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              My Profile
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                startIcon={<LockIcon />}
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change Password
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.username}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.is_admin ? 'Administrator' : 'User'}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Member Since
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formatDate(user.created_at)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your account is {user.is_active ? 'active' : 'inactive'}. 
            {user.is_admin 
              ? ' As an administrator, you have access to all system features including user management, system settings, and administrative functions.'
              : ' As a regular user, you have access to the dashboard, schedule management, and calendar features.'
            }
          </Typography>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <form onSubmit={handleEditProfile}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handleChangePassword}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Current Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Confirm New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
