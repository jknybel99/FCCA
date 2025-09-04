import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Chip,
  Grid
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  AccessTime as AccessTimeIcon,
  VolumeUp as VolumeUpIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: 'School Bell System',
    schoolLogo: null
  });
  const [scheduleInfo, setScheduleInfo] = useState({
    activeSchedule: null,
    nextBell: null,
    currentTime: new Date()
  });
  const [systemStats, setSystemStats] = useState({
    totalSchedules: 0,
    cpuUsage: 0,
    ntpStatus: 'Synced'
  });
  const { login } = useAuth();

  useEffect(() => {
    // Initialize with default values immediately
    setScheduleInfo({
      activeSchedule: null,
      nextBell: null,
      currentTime: new Date()
    });
    setSystemStats({
      totalSchedules: 0,
      cpuUsage: 0,
      ntpStatus: 'Synced'
    });

    // Try to load data from backend, but don't let it break the page
    const loadData = async () => {
      try {
        // Load school settings
        try {
          const settings = await api.getAdminSettings();
          if (settings && settings.schoolName) {
            setSchoolSettings({
              schoolName: settings.schoolName,
              schoolLogo: settings.schoolLogo
            });
          }
        } catch (error) {
          console.log('School settings not loaded, using defaults');
        }

        // Load schedules and next event
        try {
          const [schedules, nextEvent] = await Promise.all([
            api.getSchedules(),
            api.getNextEvent()
          ]);
          
          console.log('Schedules loaded:', schedules);
          console.log('Next event loaded:', nextEvent);
          
          if (schedules && Array.isArray(schedules)) {
            const activeSchedule = schedules.find(s => s.is_active);
            console.log('Active schedule:', activeSchedule);
            
            setScheduleInfo({ 
              activeSchedule, 
              nextBell: nextEvent,
              currentTime: new Date()
            });
            setSystemStats(prev => ({
              ...prev,
              totalSchedules: schedules.length
            }));
          }
        } catch (error) {
          console.log('Schedules not loaded, using defaults:', error);
        }

        // Load system stats (CPU usage and NTP status)
        try {
          const systemStats = await api.getSystemStats();
          if (systemStats) {
            if (systemStats.cpu_percent !== undefined) {
              setSystemStats(prev => ({
                ...prev,
                cpuUsage: Math.round(systemStats.cpu_percent)
              }));
            }
            if (systemStats.ntp_enabled !== undefined) {
              setSystemStats(prev => ({
                ...prev,
                ntpStatus: systemStats.ntp_enabled ? 'Synced' : 'Offline'
              }));
            }
          }
        } catch (error) {
          console.log('System stats not loaded, using defaults');
        }
      } catch (error) {
        console.log('Some data loading failed, but continuing with defaults');
      }
    };

    // Load data with a delay to ensure component is mounted
    const timeoutId = setTimeout(loadData, 500);
    
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setScheduleInfo(prev => ({
        ...prev,
        currentTime: new Date()
      }));
    }, 60000);
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(timeInterval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }}
      />
      
      {/* Background Pattern - Bell System Theme */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          width: 120,
          height: 120,
          opacity: 0.1,
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.1, transform: 'scale(1)' },
            '50%': { opacity: 0.15, transform: 'scale(1.05)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 80,
          height: 80,
          opacity: 0.08,
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          animation: 'pulse 6s ease-in-out infinite reverse',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.08, transform: 'scale(1)' },
            '50%': { opacity: 0.12, transform: 'scale(1.05)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '15%',
          width: 100,
          height: 100,
          opacity: 0.06,
          background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          animation: 'pulse 5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.06, transform: 'scale(1)' },
            '50%': { opacity: 0.1, transform: 'scale(1.05)' }
          }
        }}
      />
      
      <Container maxWidth="sm" sx={{ px: 2, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            gap: 3
          }}
        >
          {/* Schedule Information */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <ScheduleIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6" color="primary">
                System Status
              </Typography>
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 24, color: '#1976d2', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Active Schedule
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {scheduleInfo.activeSchedule ? scheduleInfo.activeSchedule.name : 'None'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TimeIcon sx={{ fontSize: 24, color: '#1976d2', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Next Bell
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ fontSize: '0.9rem' }}>
                    {scheduleInfo.nextBell ? 
                      scheduleInfo.nextBell.description || 'Bell' : 
                      'None'
                    }
                  </Typography>
                  {scheduleInfo.nextBell && scheduleInfo.nextBell.time && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {new Date(`2000-01-01T${scheduleInfo.nextBell.time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <VolumeUpIcon sx={{ fontSize: 24, color: '#1976d2', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={scheduleInfo.activeSchedule ? 'Active' : 'Inactive'} 
                    color={scheduleInfo.activeSchedule ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Login Form */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              animation: 'fadeInUp 0.8s ease-out',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)'
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            {/* School Logo and Name */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              mb: 2, 
              flexWrap: 'nowrap',
              gap: 2
            }}>
              {schoolSettings.schoolLogo && (
                <Box
                  component="img"
                  src={schoolSettings.schoolLogo}
                  alt="School Logo"
                  sx={{
                    height: { xs: 40, sm: 50 },
                    width: 'auto',
                    borderRadius: 1,
                    flexShrink: 0
                  }}
                />
              )}
              <Box sx={{ 
                textAlign: 'center', 
                minWidth: 0, 
                flex: 1,
                maxWidth: '100%'
              }}>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    lineHeight: 1.2,
                    fontSize: { 
                      xs: 'clamp(1rem, 3.5vw, 1.3rem)', 
                      sm: 'clamp(1.2rem, 4vw, 1.5rem)' 
                    },
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {schoolSettings.schoolName}
                </Typography>
                <Typography 
                  variant="h6" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 400,
                    fontSize: { 
                      xs: 'clamp(0.9rem, 2.5vw, 1.1rem)', 
                      sm: 'clamp(1rem, 3vw, 1.25rem)' 
                    }
                  }}
                >
                  School Bell System
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to continue
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'rgba(25, 118, 210, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'rgba(25, 118, 210, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  borderRadius: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease'
                }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>
          </Paper>

          {/* System Statistics */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 2,
              boxShadow: '0 2px 15px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 20, color: '#1976d2', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Schedules
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {systemStats.totalSchedules}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <MemoryIcon sx={{ fontSize: 20, color: '#1976d2', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {systemStats.cpuUsage}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 20, color: '#1976d2', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    NTP Status
                  </Typography>
                  <Chip 
                    label={systemStats.ntpStatus} 
                    color="success"
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
