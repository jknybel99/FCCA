import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  School as SchoolIcon,
  ContactSupport as ContactIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import api from '../api';
import AudioControls from './AudioControls';

export default function AdminPanel({ onSettingsUpdate }) {
  const [settings, setSettings] = useState({
    schoolName: '',
    schoolLogo: '',
    contactEmail: '',
    contactPhone: '',
    footerText: '',
    systemTimezone: 'America/Chicago',
    autoBackup: true,
    backupFrequency: 'daily',
    maxFileSize: 10,
    allowedFileTypes: ['mp3', 'wav', 'ogg'],
    ntpEnabled: false,
    ntpServers: 'pool.ntp.org',
    ntpSyncInterval: '3600'
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);

  const [ntpStatus, setNtpStatus] = useState({ status: 'loading', message: 'Loading NTP status...' });
  const [isSyncing, setIsSyncing] = useState(false);

  // Backup management state
  const [backupStatus, setBackupStatus] = useState(null);
  const [recentBackups, setRecentBackups] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  useEffect(() => {
    loadSettings();
    loadNtpStatus();
    loadBackupStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getAdminSettings();
      if (response) {
        setSettings({
          schoolName: response.schoolName || '',
          schoolLogo: response.schoolLogo || '',
          contactEmail: response.contactEmail || '',
          contactPhone: response.contactPhone || '',
          footerText: response.footerText || '',
          systemTimezone: response.systemTimezone || 'America/Chicago',
          autoBackup: response.autoBackup === true || response.autoBackup === 'true',
          backupFrequency: response.backupFrequency || 'daily',
          maxFileSize: parseInt(response.maxFileSize) || 10,
          allowedFileTypes: response.allowedFileTypes ? (Array.isArray(response.allowedFileTypes) ? response.allowedFileTypes : response.allowedFileTypes.split(',')) : ['mp3', 'wav', 'ogg'],
          ntpEnabled: response.ntpEnabled === true || response.ntpEnabled === 'true',
          ntpServers: response.ntpServers || 'pool.ntp.org',
          ntpSyncInterval: response.ntpSyncInterval || '3600'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSnackbar({ open: true, message: 'Error loading settings', severity: 'error' });
    }
  };

  const loadNtpStatus = async () => {
    try {
      const response = await api.getNtpStatus();
      setNtpStatus(response);
    } catch (error) {
      console.error('Error loading NTP status:', error);
      setNtpStatus({ status: 'error', message: 'Could not load NTP status' });
    }
  };

  const handleNtpSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncWithNtp();
      setSnackbar({ open: true, message: 'NTP synchronization successful!', severity: 'success' });
      await loadNtpStatus(); // Refresh status
    } catch (error) {
      console.error('Error syncing with NTP:', error);
      setSnackbar({ open: true, message: 'NTP synchronization failed', severity: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Backup management functions
  const loadBackupStatus = async () => {
    try {
      const response = await api.getBackupStatus();
      setBackupStatus(response);
      setRecentBackups(response.recent_backups || []);
    } catch (error) {
      console.error('Error loading backup status:', error);
      setSnackbar({ open: true, message: 'Error loading backup status', severity: 'error' });
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await api.createBackup();
      setSnackbar({ open: true, message: 'Backup created successfully!', severity: 'success' });
      await loadBackupStatus(); // Refresh backup list
    } catch (error) {
      console.error('Error creating backup:', error);
      setSnackbar({ open: true, message: 'Error creating backup', severity: 'error' });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRefreshBackups = async () => {
    setIsLoadingBackups(true);
    try {
      await loadBackupStatus();
      setSnackbar({ open: true, message: 'Backup list refreshed', severity: 'success' });
    } catch (error) {
      console.error('Error refreshing backups:', error);
      setSnackbar({ open: true, message: 'Error refreshing backups', severity: 'error' });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRestoreBackup = async (backupFilename) => {
    if (window.confirm(`Are you sure you want to restore from backup "${backupFilename}"? This will extract the backup to a restore directory.`)) {
      try {
        const response = await api.restoreBackup(backupFilename);
        setSnackbar({ 
          open: true, 
          message: `Backup extracted successfully to ${response.restore_directory}`, 
          severity: 'success' 
        });
      } catch (error) {
        console.error('Error restoring backup:', error);
        setSnackbar({ open: true, message: 'Error restoring backup', severity: 'error' });
      }
    }
  };

  const handleDeleteBackup = async (backupFilename) => {
    if (window.confirm(`Are you sure you want to delete backup "${backupFilename}"? This action cannot be undone.`)) {
      try {
        await api.deleteBackup(backupFilename);
        setSnackbar({ open: true, message: 'Backup deleted successfully', severity: 'success' });
        await loadBackupStatus(); // Refresh backup list
      } catch (error) {
        console.error('Error deleting backup:', error);
        setSnackbar({ open: true, message: 'Error deleting backup', severity: 'error' });
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settingsToSave = {
        schoolName: settings.schoolName,
        schoolLogo: settings.schoolLogo,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        footerText: settings.footerText,
        systemTimezone: settings.systemTimezone,
        autoBackup: settings.autoBackup,
        backupFrequency: settings.backupFrequency,
        maxFileSize: settings.maxFileSize,
        allowedFileTypes: settings.allowedFileTypes,
        ntpEnabled: settings.ntpEnabled,
        ntpServers: settings.ntpServers,
        ntpSyncInterval: settings.ntpSyncInterval
      };
      
      await api.saveAdminSettings(settingsToSave);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
      
      // Force reload settings to show updated values and notify parent
      setTimeout(() => {
        loadSettings();
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      }, 500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({ open: true, message: 'Error saving settings', severity: 'error' });
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSave = async () => {
    try {
      if (!logoFile) return;
      
      const formData = new FormData();
      formData.append('file', logoFile);
      
      const response = await api.uploadLogo(formData);
      console.log('Logo upload response:', response); // Debug log
      
      // Update local settings immediately
      setSettings({ ...settings, schoolLogo: response.logo_url });
      setLogoDialogOpen(false);
      setSnackbar({ open: true, message: 'Logo updated successfully!', severity: 'success' });
      
      // Save the logo URL to the database
      try {
        await api.saveAdminSettings({
          ...settings,
          schoolLogo: response.logo_url
        });
        console.log('Logo URL saved to database');
      } catch (error) {
        console.error('Error saving logo URL to database:', error);
      }
      
      // Force refresh admin settings to update the header immediately
      if (onSettingsUpdate) {
        console.log('Calling onSettingsUpdate...'); // Debug log
        onSettingsUpdate();
      }
      
      // Also reload local settings to ensure consistency
      setTimeout(() => {
        console.log('Reloading settings...'); // Debug log
        loadSettings();
        // Force another refresh to ensure the header updates
        if (onSettingsUpdate) {
          console.log('Calling onSettingsUpdate again...'); // Debug log
          onSettingsUpdate();
        }
      }, 100);
      
      // Force another refresh after a longer delay to ensure the header updates
      setTimeout(() => {
        console.log('Final refresh...'); // Debug log
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      }, 1000);
    } catch (error) {
      console.error('Error saving logo:', error);
      setSnackbar({ open: true, message: 'Error saving logo', severity: 'error' });
    }
  };

  const timezones = [
    'America/Chicago',
    'America/New_York',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Admin Panel
      </Typography>

      <Grid container spacing={3}>
        {/* School Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                School Information
              </Typography>
              
              <TextField
                fullWidth
                label="School Name"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                margin="normal"
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                <Avatar
                  src={settings.schoolLogo || logoPreview}
                  sx={{ width: 64, height: 64, mr: 2 }}
                >
                  <SchoolIcon />
                </Avatar>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setLogoDialogOpen(true)}
                >
                  Upload Logo
                </Button>
              </Box>
              
              <TextField
                fullWidth
                label="Contact Email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                margin="normal"
                type="email"
              />
              
              <TextField
                fullWidth
                label="Contact Phone"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Footer Text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                helperText="Text displayed in the footer of the application"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Settings
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>System Timezone</InputLabel>
                <Select
                  value={settings.systemTimezone}
                  onChange={(e) => setSettings({ ...settings, systemTimezone: e.target.value })}
                  label="System Timezone"
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoBackup}
                    onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                  />
                }
                label="Automatic Backup"
                sx={{ mt: 2 }}
              />
              
              {settings.autoBackup && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Backup Frequency</InputLabel>
                  <Select
                    value={settings.backupFrequency}
                    onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                    label="Backup Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              <TextField
                fullWidth
                label="Maximum File Size (MB)"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) || 0 })}
                margin="normal"
                type="number"
                inputProps={{ min: 1, max: 100 }}
              />

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Network Time Protocol (NTP)
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ntpEnabled}
                    onChange={(e) => setSettings({ ...settings, ntpEnabled: e.target.checked })}
                  />
                }
                label="Enable NTP Synchronization"
                sx={{ mt: 1 }}
              />
              
              {settings.ntpEnabled && (
                <>
                  <TextField
                    fullWidth
                    label="NTP Servers"
                    value={settings.ntpServers}
                    onChange={(e) => setSettings({ ...settings, ntpServers: e.target.value })}
                    margin="normal"
                    helperText="Comma-separated list of NTP servers (e.g., pool.ntp.org, time.nist.gov)"
                  />
                  
                  <TextField
                    fullWidth
                    label="Sync Interval (seconds)"
                    value={settings.ntpSyncInterval}
                    onChange={(e) => setSettings({ ...settings, ntpSyncInterval: e.target.value })}
                    margin="normal"
                    type="number"
                    inputProps={{ min: 60, max: 86400 }}
                    helperText="How often to sync with NTP servers (60-86400 seconds)"
                  />
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      NTP Status: {ntpStatus?.status || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {ntpStatus?.message || 'Loading...'}
                    </Typography>
                    {ntpStatus?.servers && (
                      <Box sx={{ mt: 1 }}>
                        {ntpStatus.servers.map((server, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {server.server}: {server.status} 
                            {server.offset && ` (${(server.offset * 1000).toFixed(1)}ms offset)`}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleNtpSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={loadNtpStatus}
                        disabled={isSyncing}
                      >
                        Refresh Status
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Security & Access
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Admin Access
                  </Typography>
                  <Button variant="outlined" sx={{ mr: 1 }}>
                    Change Admin Password
                  </Button>
                  <Button variant="outlined">
                    Manage Users
                  </Button>
                </Grid>
                
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Backup Management
              </Typography>
              
              {/* Backup Settings */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoBackup}
                        onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                      />
                    }
                    label="Enable Automatic Backups"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={settings.backupFrequency}
                      onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                      disabled={!settings.autoBackup}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Backup Actions */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    startIcon={<SaveIcon />}
                  >
                    {isCreatingBackup ? 'Creating Backup...' : 'Create Manual Backup'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={handleRefreshBackups}
                    disabled={isLoadingBackups}
                  >
                    {isLoadingBackups ? 'Loading...' : 'Refresh Backup List'}
                  </Button>
                </Grid>
              </Grid>

              {/* Backup Status */}
              {backupStatus && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Backup System Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2">
                        Total Backups: {backupStatus.total_backups}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2">
                        Total Size: {backupStatus.total_size_mb} MB
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2">
                        Directory: {backupStatus.backup_directory}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Recent Backups */}
              {recentBackups.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Backups (Last 5)
                  </Typography>
                  {recentBackups.map((backup, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        p: 2, 
                        mb: 1, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {backup.filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(backup.created).toLocaleString()} • {backup.size_mb} MB
                        </Typography>
                      </Box>
                      <Box>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1 }}
                          onClick={() => handleRestoreBackup(backup.filename)}
                        >
                          Restore
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => handleDeleteBackup(backup.filename)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {recentBackups.length === 0 && !isLoadingBackups && (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    No backups found. Create your first backup to get started.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined">
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
            >
              Save All Settings
            </Button>
          </Box>
        </Grid>

        {/* Audio Controls */}
        <Grid item xs={12}>
          <AudioControls />
        </Grid>
      </Grid>

      {/* Logo Upload Dialog */}
      <Dialog open={logoDialogOpen} onClose={() => setLogoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload School Logo</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {logoPreview && (
              <Avatar
                src={logoPreview}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
            )}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="logo-upload"
              type="file"
              onChange={handleLogoUpload}
            />
            <label htmlFor="logo-upload">
              <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                Choose Logo File
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Recommended: 200x200 pixels, PNG or JPG format
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogoSave} variant="contained" disabled={!logoFile}>
            Save Logo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
