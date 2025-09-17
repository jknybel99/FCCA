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
  Snackbar,
  List,
  ListItem,
  CircularProgress,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Paper
} from '@mui/material';
import PushToTalkButton from './PushToTalkButton';
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
  Timer,
  Mic,
  History,
  Search,
  AccessTime,
  FiberManualRecord as FiberManualRecordIcon,
  Stop,
  Radio,
  RadioButtonUnchecked
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
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [ntpStatus, setNtpStatus] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [audioStats, setAudioStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  
  // Push-to-talk system state
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [pushToTalkCountdown, setPushToTalkCountdown] = useState(0);
  const [isPushToTalkStreaming, setIsPushToTalkStreaming] = useState(false);
  const [isPushToTalkLoading, setIsPushToTalkLoading] = useState(false);
  
  // Recording system state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingName, setRecordingName] = useState('');
  const [showRecordingNameDialog, setShowRecordingNameDialog] = useState(false);
  const [playBellBeforeRecording, setPlayBellBeforeRecording] = useState(false);
  
  // Previous announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [announcementsPerPage] = useState(10);
  const [showAnnouncementsDialog, setShowAnnouncementsDialog] = useState(false);
  
  // Paging system state
  const [isPagingLoading, setIsPagingLoading] = useState(false);
  const [pagingStatus, setPagingStatus] = useState({
    is_recording: false,
    is_live_streaming: false,
    audio_level: 0
  });
  const [showPagingSelection, setShowPagingSelection] = useState(false);
  const [pagingMode, setPagingMode] = useState(null);
  const [pagingDialogOpen, setPagingDialogOpen] = useState(false);
  const [pagingCountdown, setPagingCountdown] = useState(0);



  // Fetch paging status including audio levels
  const fetchPagingStatus = async () => {
    try {
      const status = await api.getPagingStatus();
      setPagingStatus(status);
    } catch (error) {
      console.error('Error fetching paging status:', error);
    }
  };

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    // Update next event every minute
    const eventInterval = setInterval(() => {
      fetchNextEvent();
    }, 60000);

    // Update paging status (including audio levels) every 200ms when recording/streaming
    const pagingInterval = setInterval(() => {
      if (pagingStatus.is_recording || pagingStatus.is_live_streaming || isRecording) {
        fetchPagingStatus();
      }
    }, 200);

    // Initial fetch
    fetchNextEvent();
    fetchSystemStatus();
    fetchAudioSettings();
    fetchPagingStatus();
    fetchAudioOutputs();
    fetchActiveSchedule();
    fetchNtpStatus();
    fetchBackupStatus();
    fetchAudioStats();
    fetchSystemStats();
    loadAnnouncements();

    return () => {
      clearInterval(timeInterval);
      clearInterval(eventInterval);
      clearInterval(pagingInterval);
    };
  }, []);

  // Countdown effect for push-to-talk
  useEffect(() => {
    let countdownInterval;
    if (pushToTalkCountdown > 0 && isPushToTalkActive) {
      countdownInterval = setInterval(() => {
        setPushToTalkCountdown(prev => {
          if (prev <= 1) {
            // Countdown finished, start streaming
            startStreamingAfterCountdown();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [pushToTalkCountdown, isPushToTalkActive]);

  const startStreamingAfterCountdown = async () => {
    try {
      await api.pushToTalkStream();
      setIsPushToTalkStreaming(true);
      showSnackbar('Live streaming started - you can now speak', 'success');
    } catch (error) {
      console.error('Error starting streaming after countdown:', error);
      showSnackbar(`Failed to start streaming: ${error.message || error}`, 'error');
      setIsPushToTalkActive(false);
    }
  };

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

  const fetchAudioOutputs = async () => {
    try {
      const outputs = await api.getAudioOutputs();
      setAudioOutputs(outputs);
    } catch (error) {
      console.error('Error fetching audio outputs:', error);
    }
  };

  const getDeviceName = (deviceId) => {
    if (!deviceId || deviceId === 'default') {
      return 'Default';
    }
    
    const device = audioOutputs.find(output => output.id === deviceId);
    return device ? device.name : deviceId;
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

  // Paging system functions
  const loadAnnouncements = async () => {
    try {
      const response = await api.getAnnouncementHistory();
      setAnnouncements(response.announcements || []);
      console.log('Loaded announcements:', response.announcements?.length || 0);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handlePagingButton = () => {
    setShowPagingSelection(true);
  };

  const handlePagingModeSelection = (mode) => {
    setShowPagingSelection(false);
    setPagingMode(mode);
    setPagingDialogOpen(true);
    
    // For recording mode, don't start countdown - show manual controls
    if (mode === 'record') {
      setPagingCountdown(0); // No countdown for recording
    } else if (mode === 'live') {
      setPagingCountdown(3);
      // Start countdown for live paging - but don't close dialog
      const countdownInterval = setInterval(() => {
        setPagingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Don't close dialog - let user control manually
            setPagingCountdown(0); // Reset countdown to show manual controls
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    // For browse mode, no countdown needed
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  };

  // Push-to-talk functions
  const startPushToTalk = async () => {
    setIsPushToTalkLoading(true);
    try {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        showSnackbar('Microphone access is required for paging. Please allow microphone access and try again.', 'error');
        return;
      }
      
      // Start push-to-talk with bell and countdown
      await api.pushToTalkStart();
      setIsPushToTalkActive(true);
      setPushToTalkCountdown(3);
      showSnackbar('Push-to-talk started - bell playing, countdown beginning', 'success');
    } catch (error) {
      console.error('Error starting push-to-talk:', error);
      showSnackbar(`Failed to start push-to-talk: ${error.message || error}`, 'error');
    } finally {
      setIsPushToTalkLoading(false);
    }
  };

  const stopPushToTalk = async () => {
    setIsPushToTalkLoading(true);
    try {
      if (isPushToTalkStreaming) {
        await api.pushToTalkStop();
        setIsPushToTalkStreaming(false);
        showSnackbar('Push-to-talk stopped', 'success');
      }
      setIsPushToTalkActive(false);
      setPushToTalkCountdown(0);
    } catch (error) {
      console.error('Error stopping push-to-talk:', error);
      showSnackbar(`Failed to stop push-to-talk: ${error.message || error}`, 'error');
    } finally {
      setIsPushToTalkLoading(false);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      setIsRecording(true);
      await api.startRecording({
        device_settings: {
          device_id: 'default',
          sample_rate: 44100,
          bit_depth: 16,
          channels: 1
        },
        duration: 60,
        play_bell: true
      });
      
      // Update paging status and start polling for audio levels
      setPagingStatus(prev => ({ ...prev, is_recording: true }));
      
      // Start immediate polling for audio levels during recording
      const pollAudioLevels = setInterval(() => {
        fetchPagingStatus();
      }, 100); // Poll every 100ms for smooth audio level updates
      
      // Store interval ID to clear it later
      window.audioLevelInterval = pollAudioLevels;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setSnackbar({
        open: true,
        message: 'Failed to start recording',
        severity: 'error'
      });
    }
  };

  const stopRecording = async (name = null) => {
    if (name === null) {
      // Show naming dialog if no name provided
      console.log('Opening recording name dialog');
      setShowRecordingNameDialog(true);
      return;
    }

    try {
      setIsPushToTalkLoading(true);
      console.log('Stopping recording with name:', name);
      
      // Always try to stop recording, even if there's an error
      try {
        await api.stopRecording(name);
        showSnackbar('Recording saved successfully', 'success');
      } catch (error) {
        console.error('Error stopping recording:', error);
        showSnackbar(`Warning: ${error.response?.data?.detail || error.message || 'Recording stopped but may not have saved properly'}`, 'warning');
      }
      
      // Update UI state regardless of API success
      setIsRecording(false);
      
      try {
        // Refresh the recordings list
        const recordings = await api.getAnnouncementHistory();
        setRecordings(recordings);
      } catch (error) {
        console.error('Error refreshing recordings:', error);
        // Don't show error to user for this non-critical operation
      }
    } catch (error) {
      console.error('Unexpected error in stopRecording:', error);
      showSnackbar('An unexpected error occurred while stopping recording', 'error');
    } finally {
      setIsPushToTalkLoading(false);
      setShowRecordingNameDialog(false);
      setRecordingName('');
      
      // Clear audio level polling
      if (window.audioLevelInterval) {
        clearInterval(window.audioLevelInterval);
        window.audioLevelInterval = null;
      }
      
      // Update paging status
      setPagingStatus(prev => ({ ...prev, is_recording: false, audio_level: 0 }));
      
      // Reload announcements immediately to show new recording
      setTimeout(() => {
        loadAnnouncements();
      }, 1000); // Wait 1 second for backend to finish saving
    }
  };

  const confirmStopRecording = async () => {
    if (!recordingName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a name for your recording',
        severity: 'error'
      });
      return;
    }
    
    try {
      await stopRecording(recordingName.trim());
      setShowRecordingNameDialog(false);
      setRecordingName('');
    } catch (error) {
      console.error('Error confirming stop recording:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save recording',
        severity: 'error'
      });
    }
  };

  const startLiveStreamAfterCountdown = async () => {
    try {
      await api.startLiveStream();
      setPagingStatus(prev => ({ ...prev, is_live_streaming: true }));
      setPagingDialogOpen(false);
      showSnackbar('Live streaming started successfully', 'success');
    } catch (error) {
      console.error('Error starting live stream after countdown:', error);
      showSnackbar(`Failed to start live stream: ${error.message || error}`, 'error');
      setPagingDialogOpen(false);
    }
  };

  const stopLiveStream = async () => {
    setIsPagingLoading(true);
    try {
      await api.stopLiveStream();
      setPagingStatus(prev => ({ ...prev, is_live_streaming: false }));
      showSnackbar('Live streaming stopped successfully', 'success');
    } catch (error) {
      console.error('Error stopping live stream:', error);
      showSnackbar(`Failed to stop live stream: ${error.message || error}`, 'error');
    } finally {
      setIsPagingLoading(false);
    }
  };

  const stopPlayback = async () => {
    try {
      await api.stopPlayback();
      showSnackbar('Playback stopped', 'info');
    } catch (error) {
      console.error('Error stopping playback:', error);
      showSnackbar(`Failed to stop playback: ${error.message || error}`, 'error');
    }
  };

  const playAnnouncement = async (announcementId) => {
    try {
      await api.playAnnouncement(announcementId);
      showSnackbar('Playing announcement', 'success');
    } catch (error) {
      console.error('Error playing announcement:', error);
      showSnackbar(`Failed to play announcement: ${error.message || error}`, 'error');
    }
  };

  const handlePlayPreviousAnnouncements = () => {
    setShowPagingSelection(false);
    // Open the paging dialog in "browse" mode
    setPagingMode('browse');
    setPagingDialogOpen(true);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  Output: {getDeviceName(audioSettings.output)}
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
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Mic />}
                  onClick={() => setPagingDialogOpen(true)}
                  disabled={isPagingLoading}
                >
                  Page System
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

      {/* Previous Announcements Dialog */}
      <Dialog 
        open={showAnnouncementsDialog} 
        maxWidth="md" 
        fullWidth
        onClose={() => setShowAnnouncementsDialog(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            <Typography variant="h6">
              Previous Announcements
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {filteredAnnouncements.length > 0 ? (
              <List dense>
                {filteredAnnouncements.slice((announcementsPage - 1) * announcementsPerPage, announcementsPage * announcementsPerPage).map((announcement) => (
                  <ListItem key={announcement.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={announcement.name || 'Unnamed Announcement'}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(announcement.created_at).toLocaleString()}
                          </Typography>
                          {announcement.description && (
                            <Typography variant="body2" color="text.secondary">
                              {announcement.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => playAnnouncement(announcement.id)}
                          disabled={isPushToTalkLoading}
                        >
                          <PlayArrow />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => stopPlayback()}
                          disabled={isPushToTalkLoading}
                        >
                          <Stop />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'No announcements match your search' : 'No previous announcements'}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Pagination Controls */}
          {filteredAnnouncements.length >= announcementsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setAnnouncementsPage(prev => Math.max(1, prev - 1))}
                disabled={announcementsPage === 1}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {announcementsPage} of {Math.ceil(filteredAnnouncements.length / announcementsPerPage)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setAnnouncementsPage(prev => Math.min(Math.ceil(filteredAnnouncements.length / announcementsPerPage), prev + 1))}
                disabled={announcementsPage >= Math.ceil(filteredAnnouncements.length / announcementsPerPage)}
              >
                Next
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAnnouncementsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recording Name Dialog */}
      <Dialog 
        open={showRecordingNameDialog} 
        maxWidth="sm" 
        fullWidth
        onClose={() => setShowRecordingNameDialog(false)}
      >
        <DialogTitle>
          <Typography variant="h6">
            Name Your Recording
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="Recording Name"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="Enter a name for your recording..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowRecordingNameDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmStopRecording}
            disabled={isPushToTalkLoading}
          >
            Save Recording
          </Button>
        </DialogActions>
      </Dialog>

      {/* Paging System Dialog */}
      <Dialog 
        open={pagingDialogOpen} 
        maxWidth="md" 
        fullWidth
        onClose={() => setPagingDialogOpen(false)}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Mic />
            <Typography variant="h6">
              Paging System
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <PushToTalkButton 
              onStatusChange={(status) => {
                setPagingStatus(prev => ({
                  ...prev,
                  is_live_streaming: status.isStreaming || false
                }));
              }}
            />
            
            {/* Additional Controls */}
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={2} justifyContent="center" alignItems="center">
                {isRecording ? (
                  <>
                    <Grid item>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => stopRecording()}
                        sx={{
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.7 },
                            '100%': { opacity: 1 }
                          }
                        }}
                      >
                        Stop Recording
                      </Button>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" color="error">
                        <FiberManualRecordIcon sx={{ animation: 'blink 1.5s infinite', fontSize: '1rem' }} />
                        Recording in progress...
                      </Typography>
                    </Grid>
                    {/* Audio Level Indicator */}
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Audio Level: {Math.round(pagingStatus.audio_level || 0)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={pagingStatus.audio_level || 0}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: pagingStatus.audio_level > 80 ? '#f44336' : 
                                             pagingStatus.audio_level > 50 ? '#ff9800' : '#4caf50'
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Mic />}
                        onClick={startRecording}
                        disabled={pagingStatus.is_live_streaming}
                      >
                        Record Message
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<History />}
                        onClick={() => setShowAnnouncementsDialog(true)}
                      >
                        Previous Announcements
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setPagingDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Dashboard;
