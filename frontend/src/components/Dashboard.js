import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Schedule,
  MusicNote,
  Announcement,
  Settings,
  VolumeDown,
  VolumeMute,
  MonitorHeart,
  Memory,
  Storage,
  Folder,
  Timer
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [nextEvent, setNextEvent] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [audioSettings, setAudioSettings] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [ntpStatus, setNtpStatus] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [audioStats, setAudioStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);



  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    // Update next event every minute
    const eventInterval = setInterval(() => {
      fetchNextEvent();
    }, 60000);

    // Initial fetch
    fetchNextEvent();
    fetchSystemStatus();
    fetchAudioSettings();
    fetchActiveSchedule();
    fetchNtpStatus();
    fetchBackupStatus();
    fetchAudioStats();
    fetchSystemStats();

    return () => {
      clearInterval(timeInterval);
      clearInterval(eventInterval);
      // Close snackbar to prevent memory leaks
      // setSnackbar({ open: false, message: '', severity: 'info' });
    };
  }, []);

  const fetchNextEvent = async () => {
    try {
      const event = await api.getNextEvent();
      setNextEvent(event);
    } catch (error) {
      console.log('No upcoming events');
      setNextEvent(null);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
      // Update mute status from system status
      if (status && status.muted !== undefined) {
        setIsMuted(status.muted);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  const fetchNtpStatus = async () => {
    try {
      const ntp = await api.getNtpStatus();
      setNtpStatus(ntp);
    } catch (error) {
      console.error('Error fetching NTP status:', error);
      setNtpStatus({ status: 'error', message: 'Could not load NTP status' });
    }
  };

  const fetchAudioSettings = async () => {
    try {
      const settings = await api.getAudioSettings();
      setAudioSettings(settings);
      if (settings && settings.volume) {
        setVolume(parseInt(settings.volume));
      }
    } catch (error) {
      console.error('Error fetching audio settings:', error);
    }
  };

  const fetchActiveSchedule = async () => {
    try {
      const [schedules, specialSchedules] = await Promise.all([
        api.getSchedules(),
        api.getSpecialSchedules()
      ]);
      
      // Check if there's an active special schedule for today
      const today = dayjs();
      const dayOfWeek = today.day() === 0 ? 6 : today.day() - 1; // Convert to 0=Monday, 6=Sunday
      
      let activeSpecialSchedule = null;
      for (const special of specialSchedules) {
        const specialDay = special.days?.find(day => 
          day.day_of_week === dayOfWeek && day.is_active
        );
        if (specialDay) {
          activeSpecialSchedule = {
            ...special,
            is_special: true,
            override_date: today.format('YYYY-MM-DD')
          };
          break;
        }
      }
      
      if (activeSpecialSchedule) {
        setActiveSchedule(activeSpecialSchedule);
      } else {
        // Use regular default schedule
        const regularSchedule = schedules.find(schedule => schedule.is_default && schedule.is_active);
        setActiveSchedule(regularSchedule ? { ...regularSchedule, is_special: false } : null);
      }
    } catch (error) {
      console.error('Error fetching active schedule:', error);
    }
  };

  const fetchBackupStatus = async () => {
    try {
      const status = await api.getBackupStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Error fetching backup status:', error);
      setBackupStatus({ status: 'error', message: 'Could not load backup status' });
    }
  };

  const fetchAudioStats = async () => {
    try {
      const stats = await api.getAudioStats();
      setAudioStats(stats);
    } catch (error) {
      console.error('Error fetching audio stats:', error);
      setAudioStats({ bells: 0, music: 0, announcements: 0, total: 0 });
    }
  };

  const fetchSystemStats = async () => {
    try {
      const stats = await api.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      setSystemStats({ 
        cpu_percent: 0, 
        cpu_temp: 'N/A', 
        memory_percent: 0, 
        memory_used_gb: 0,
        disk_percent: 0,
        disk_free_gb: 0,
        uptime_days: 0,
        uptime_hours: 0
      });
    }
  };

  const handleMuteToggle = async () => {
    try {
      await api.muteAllSchedules(!isMuted);
      setIsMuted(!isMuted);
      fetchSystemStatus();
      showSnackbar(`All schedules ${!isMuted ? 'muted' : 'unmuted'} successfully`, 'success');
    } catch (error) {
      console.error('Error toggling mute:', error);
      showSnackbar('Error toggling mute. Please try again.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSoundTest = async () => {
    if (isTestingSound) return; // Prevent multiple clicks
    
    setIsTestingSound(true);
    try {
      // Play a test tone or use the first available sound file
      const audioFiles = await api.getAudioFiles();
      if (audioFiles && audioFiles.length > 0) {
        // Use the first audio file for testing
        await api.playSound(audioFiles[0].id);
        showSnackbar(`Playing test sound: ${audioFiles[0].name}`, 'success');
      } else {
        showSnackbar('No audio files available for testing', 'warning');
      }
    } catch (error) {
      console.error('Error playing test sound:', error);
      showSnackbar('Error playing test sound. Please try again.', 'error');
    } finally {
      setIsTestingSound(false);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseInt(event.target.value);
    setVolume(newVolume);
    // TODO: Implement volume control
  };

  const formatTimeUntil = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEventIcon = (event) => {
    if (event.tts_text) {
      return <Announcement />;
    }
    if (event.sound_name) {
      return <MusicNote />;
    }
    return <Schedule />;
  };

  return (
    <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
        {/* Top Row - Time and Next Event */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ 
              p: 2, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography 
                variant="h2" 
                component="div" 
                align="center"
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                {currentTime.format('hh:mm:ss A')}
              </Typography>
              <Typography variant="h6" color="text.secondary" align="center">
                {currentTime.format('dddd, MMMM D, YYYY')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Next Scheduled Audio
              </Typography>
              {nextEvent ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getEventIcon(nextEvent)}
                    <Typography variant="h5" sx={{ ml: 1 }}>
                      {dayjs(nextEvent.time, 'HH:mm:ss').format('hh:mm:ss A')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {nextEvent.description || 'Bell Event'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {nextEvent.sound_name || nextEvent.tts_text || 'No audio specified'}
                  </Typography>
                  {nextEvent.days_from_now > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {nextEvent.days_from_now === 1 ? 'Tomorrow' : `In ${nextEvent.days_from_now} days`}
                    </Typography>
                  )}
                  <Chip
                    label={`In ${formatTimeUntil(nextEvent.minutes_until)}`}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No upcoming events
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Second Row - System Status and Volume */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              {systemStatus ? (
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    <Chip
                      label={systemStatus.scheduler_running ? 'Running' : 'Stopped'}
                      color={systemStatus.scheduler_running ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={`${systemStatus.active_jobs} jobs`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={isMuted ? 'MUTED' : 'Active'}
                      color={isMuted ? 'error' : 'success'}
                      variant={isMuted ? 'filled' : 'outlined'}
                      icon={isMuted ? <VolumeOff /> : <VolumeUp />}
                      size="small"
                    />
                  </Box>
                  
                  {/* System Services Status - Side by Side Layout */}
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      System Services
                    </Typography>
                    
                    {/* NTP and Backup Status Grid */}
                    <Grid container spacing={2}>
                      {/* NTP Status - Left Side */}
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Time Sync
                          </Typography>
                          {ntpStatus ? (
                            <Box>
                              <Chip
                                label={ntpStatus.status === 'synchronized' ? 'NTP Sync' : ntpStatus.status}
                                color={ntpStatus.status === 'synchronized' ? 'success' : 
                                       ntpStatus.status === 'drift_detected' ? 'warning' : 'error'}
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                              {ntpStatus.ntp_enabled && ntpStatus.servers && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {ntpStatus.servers.length} server(s)
                                </Typography>
                              )}
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={fetchNtpStatus}
                                sx={{ mt: 0.5 }}
                              >
                                Refresh
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Loading...
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Backup Status - Right Side */}
                      <Grid item xs={12} md={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Backup System
                          </Typography>
                          {backupStatus ? (
                            <Box>
                              <Chip
                                label={`${backupStatus.total_backups} backups`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                              <Chip
                                label={`${backupStatus.total_size_mb} MB`}
                                color="secondary"
                                variant="outlined"
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                              {backupStatus.recent_backups && backupStatus.recent_backups.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Latest: {new Date(backupStatus.recent_backups[0].created).toLocaleDateString()}
                                </Typography>
                              )}
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={fetchBackupStatus}
                                sx={{ mt: 0.5 }}
                              >
                                Refresh
                              </Button>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Loading...
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading status...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Volume Level
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                {volume === 0 ? <VolumeMute /> : 
                 volume < 30 ? <VolumeDown /> : 
                 volume < 70 ? <VolumeUp /> : <VolumeUp />}
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={volume} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {volume}%
                </Typography>
              </Box>
              {audioSettings && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Output: {audioSettings.output || 'Default'}
                </Typography>
              )}

              {/* Compact System Stats */}
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <MonitorHeart sx={{ fontSize: 14 }} />
                  System Stats
                </Typography>
                <Grid container spacing={0.5}>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        CPU
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemStats?.cpu_percent || 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="10px">
                        {systemStats?.cpu_temp || 'N/A'}°C
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        RAM
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemStats?.memory_percent || 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="10px">
                        {systemStats?.memory_used_gb || 0} GB
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Storage
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemStats?.disk_percent || 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="10px">
                        {systemStats?.disk_free_gb || 0} GB
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Uptime
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {systemStats?.uptime_days || 0}d
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="10px">
                        {systemStats?.uptime_hours || 0}h
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Third Row - Active Schedule and Quick Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Active Schedule
              </Typography>
              {activeSchedule ? (
                <Box>
                  <Typography variant="h6" color="primary">
                    {activeSchedule.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeSchedule.description}
                  </Typography>
                  <Chip
                    label={activeSchedule.is_active ? 'Active' : 'Inactive'}
                    color={activeSchedule.is_active ? 'success' : 'default'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active schedule
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quick Controls
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant={isMuted ? "contained" : "outlined"}
                  color={isMuted ? "error" : "primary"}
                  startIcon={isMuted ? <VolumeOff /> : <VolumeUp />}
                  onClick={handleMuteToggle}
                >
                  {isMuted ? 'Unmute' : 'Mute All'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={isTestingSound ? <Pause /> : <PlayArrow />}
                  onClick={handleSoundTest}
                  disabled={isTestingSound}
                >
                  {isTestingSound ? 'Testing...' : 'Test Sound'}
                </Button>
                <IconButton
                  onClick={() => setSettingsOpen(true)}
                  color="primary"
                >
                  <Settings />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>


      </Grid>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>System Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Volume</Typography>
            <TextField
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              fullWidth
            />
            <Typography variant="body2" color="text.secondary">
              {volume}%
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for user feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
