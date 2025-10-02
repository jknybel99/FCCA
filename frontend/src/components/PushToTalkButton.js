import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Mic,
  MicOff,
  Settings,
  VolumeUp,
  Stop,
  PlayArrow
} from '@mui/icons-material';
import api from '../api';

// Helper to compute backend base URL (mirrors logic in api.js)
const getBackendBaseUrl = () => {
  try {
    const override = localStorage.getItem('backendUrl');
    if (override) {
      const u = new URL(override);
      return `${u.protocol}//${u.host}`;
    }
  } catch {}
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return `http://${window.location.hostname}:8000`;
};

const AudioLevelIndicator = ({ level, isActive }) => {
  const normalizedLevel = Math.min(Math.max(level, 0), 100);
  
  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={normalizedLevel}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: isActive 
              ? (normalizedLevel > 80 ? '#f44336' : normalizedLevel > 50 ? '#ff9800' : '#4caf50')
              : '#9e9e9e',
            borderRadius: 4,
          }
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
        Input Level: {normalizedLevel.toFixed(0)}%
      </Typography>
    </Box>
  );
};

const DeviceSettingsDialog = ({ open, onClose, onSave, currentDevice, devices }) => {
  const [selectedDevice, setSelectedDevice] = useState(currentDevice || '');
  const [capabilities, setCapabilities] = useState(null);
  const [settings, setSettings] = useState({
    sample_rate: 48000,
    bit_depth: 16,
    channels: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice && open) {
      loadDeviceCapabilities();
    }
  }, [selectedDevice, open]);

  const loadDeviceCapabilities = async () => {
    setLoading(true);
    try {
      const caps = await api.getDeviceCapabilities(selectedDevice);
      setCapabilities(caps);
      
      // Auto-select recommended settings
      if (caps.recommended) {
        setSettings({
          sample_rate: caps.recommended.sample_rate || 48000,
          bit_depth: caps.recommended.bit_depth || 16,
          channels: caps.recommended.channels || 1
        });
      }
    } catch (error) {
      console.error('Error loading device capabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave({
      device_id: selectedDevice,
      ...settings
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Audio Input Settings</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Input Device</InputLabel>
              <Select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                label="Input Device"
              >
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name} ({device.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {capabilities && (
            <>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Device Capabilities
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={`Status: ${capabilities.status}`} 
                        color={capabilities.status === 'available' ? 'success' : 'error'}
                        size="small"
                      />
                      <Chip 
                        label={`Sample Rates: ${capabilities.capabilities.sample_rates.length}`}
                        size="small"
                      />
                      <Chip 
                        label={`Bit Depths: ${capabilities.capabilities.bit_depths.join(', ')}-bit`}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Sample Rate</InputLabel>
                  <Select
                    value={settings.sample_rate}
                    onChange={(e) => setSettings(prev => ({ ...prev, sample_rate: e.target.value }))}
                    label="Sample Rate"
                  >
                    {capabilities.capabilities.sample_rates.map(rate => (
                      <MenuItem key={rate} value={rate}>
                        {rate / 1000} kHz
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Bit Depth</InputLabel>
                  <Select
                    value={settings.bit_depth}
                    onChange={(e) => setSettings(prev => ({ ...prev, bit_depth: e.target.value }))}
                    label="Bit Depth"
                  >
                    {capabilities.capabilities.bit_depths.map(depth => (
                      <MenuItem key={depth} value={depth}>
                        {depth}-bit
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Channels</InputLabel>
                  <Select
                    value={settings.channels}
                    onChange={(e) => setSettings(prev => ({ ...prev, channels: e.target.value }))}
                    label="Channels"
                  >
                    {capabilities.capabilities.channels.map(ch => (
                      <MenuItem key={ch} value={ch}>
                        {ch === 1 ? 'Mono' : ch === 2 ? 'Stereo' : `${ch} Channels`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!selectedDevice || loading}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function PushToTalkButton({ onStatusChange, onLevelChange }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState([]);
  const [currentDevice, setCurrentDevice] = useState('');
  const [deviceSettings, setDeviceSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  
  const buttonRef = useRef(null);
  const audioLevelInterval = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);

  // Determine if we're in a secure context for mic access
  const isSecure = (typeof window !== 'undefined') && (
    window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  useEffect(() => {
    const initializeDevices = async () => {
      if (!isSecure) {
        setError('Microphone requires a secure context. Use HTTPS or access from http://localhost.');
        return;
      }
      await loadClientInputDevices();
      await loadCurrentSettings();
    };
    initializeDevices();
  }, []);

  // Use refs to avoid stale closure issues
  const isPressedRef = useRef(isPressed);
  const showSettingsRef = useRef(showSettings);
  
  // Update refs when state changes
  useEffect(() => {
    isPressedRef.current = isPressed;
  }, [isPressed]);
  
  useEffect(() => {
    showSettingsRef.current = showSettings;
  }, [showSettings]);

  // Keyboard event handlers with stable references
  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('KeyDown event:', e.code, 'isPressed:', isPressedRef.current, 'showSettings:', showSettingsRef.current);
      if (e.code === 'Space' && !isPressedRef.current && !showSettingsRef.current) {
        console.log('Starting push-to-talk via spacebar');
        e.preventDefault();
        handleMouseDown();
      }
    };

    const handleKeyUp = (e) => {
      console.log('KeyUp event:', e.code, 'isPressed:', isPressedRef.current);
      if (e.code === 'Space') {
        console.log('Space key released - always stopping push-to-talk');
        e.preventDefault();
        // Always call stop regardless of isPressed state to ensure cleanup
        handleMouseUp();
      }
    };

    // Add event listeners to both window and document to catch all events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // No dependencies - handlers are stable

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
      // Cleanup any active streaming on component unmount
      if (isStreaming) {
        api.stopPushToTalk().catch(console.error);
      }
    };
  }, [isStreaming]);

  // Page unload and visibility change cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isStreaming) {
        // Synchronous cleanup on page unload
        try {
          const url = `${getBackendBaseUrl()}/api/paging/push-to-talk-stop`;
          navigator.sendBeacon(url);
        } catch {}
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isStreaming) {
        handleMouseUp(); // Use the proper cleanup function
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStreaming]);

  // Update current device when devices list changes
  useEffect(() => {
    if (devices.length > 0 && !currentDevice) {
      // Prefer webcam over built-in audio
      const webcamDevice = devices.find(d => 
        d.name.toLowerCase().includes('webcam') || 
        d.name.toLowerCase().includes('c920') ||
        d.id.includes('usb')
      );
      if (webcamDevice) {
        setCurrentDevice(webcamDevice.id);
      } else {
        setCurrentDevice(devices[0].id);
      }
    }
  }, [devices, currentDevice]);

  const loadClientInputDevices = async () => {
    try {
      // Request permission to access the microphone to ensure labels are available
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all.filter(d => d.kind === 'audioinput');
      const deviceList = inputs.map(d => ({ id: d.deviceId, name: d.label || 'Microphone', type: 'browser' }));
      if (deviceList.length === 0) {
        throw new Error('No input devices found');
      }
      setDevices(deviceList);
      if (!currentDevice) {
        // Prefer named devices that look like USB/webcam
        const preferred = deviceList.find(d => (d.name || '').toLowerCase().includes('webcam') || (d.name || '').toLowerCase().includes('usb')) || deviceList[0];
        setCurrentDevice(preferred.id);
      }
    } catch (err) {
      console.error('Error loading client input devices:', err);
      setError('Microphone access is required. Please allow mic permissions and use HTTPS when remote.');
      setDevices([{ id: '', name: 'No microphone available', type: 'browser' }]);
    }
  };

  const loadCurrentSettings = async () => {
    try {
      const settings = await api.getAudioSettings();
      if (settings.input && devices.length > 0) {
        // Find exact match first
        const exactMatch = devices.find(d => d.id === settings.input);
        if (exactMatch) {
          setCurrentDevice(exactMatch.id);
          return;
        }
      }
      
      // If no saved input setting, prefer webcam over built-in audio
      if (devices.length > 0) {
        const webcamDevice = devices.find(d => 
          d.name.toLowerCase().includes('webcam') || 
          d.name.toLowerCase().includes('c920') ||
          d.id.includes('usb')
        );
        if (webcamDevice) {
          setCurrentDevice(webcamDevice.id);
          return;
        }
      }
      
      // Default to first device if no preference found
      if (devices.length > 0) {
        setCurrentDevice(devices[0].id);
      }
    } catch (error) {
      console.error('Error loading current settings:', error);
      if (devices.length > 0) {
        setCurrentDevice(devices[0].id);
      }
    }
  };

  const startAudioLevelMonitoring = async () => {
    try {
      // Compute level locally from the MediaStream if available
      if (!mediaStreamRef.current) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const source = audioCtxRef.current.createMediaStreamSource(mediaStreamRef.current);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);
        // Compute RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const lvl = Math.min(100, Math.max(0, Math.round(rms * 140)));
        setAudioLevel(lvl);
        try { onLevelChange?.(lvl); } catch {}
      };
      audioLevelInterval.current = setInterval(tick, 100);
    } catch (error) {
      console.error('Error starting audio level monitoring:', error);
    }
  };

  const stopAudioLevelMonitoring = () => {
    if (audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current);
      audioLevelInterval.current = null;
    }
    setAudioLevel(0);
    try { onLevelChange?.(0); } catch {}
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  };

  const handleMouseDown = async () => {
    if (isPressed || isStreaming) return;
    
    setError('');
    setIsPressed(true);
    
    try {
      // Start push-to-talk with current device settings
      const response = await api.startPushToTalk();
      
      // Use actual bell duration from backend, with fallback
      const bellDuration = response.bell_duration || 0.5; // Default 0.5s if no bell
      const delayMs = Math.max(500, bellDuration * 1000); // Minimum 500ms delay
      
      // Wait for bell to finish playing
      setTimeout(async () => {
        try {
          // Open mic stream on client
          const constraints = currentDevice
            ? { audio: { deviceId: { exact: currentDevice } } }
            : { audio: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
          // Start local mic level monitoring immediately (even before WS connects)
          startAudioLevelMonitoring();

          // Open WS to backend and stream Opus chunks
          const token = localStorage.getItem('token');
          // Prefer backend override if provided (same as api.js logic)
          let wsUrl;
          try {
            const override = localStorage.getItem('backendUrl');
            if (override) {
              const u = new URL(override);
              const wsSchemeFromOverride = (u.protocol === 'https:') ? 'wss' : 'ws';
              wsUrl = `${wsSchemeFromOverride}://${u.host}/api/paging/ptt-stream?token=${encodeURIComponent(token || '')}`;
            }
          } catch {}
          if (!wsUrl) {
            const isHttps = window.location.protocol === 'https:';
            if (isHttps) {
              // Use same-origin over wss when served via HTTPS (reverse proxy like Caddy)
              const wsBase = `wss://${window.location.host}`;
              wsUrl = `${wsBase}/api/paging/ptt-stream?token=${encodeURIComponent(token || '')}`;
            } else {
              // HTTP: fall back to direct backend on port 8000 by hostname
              const wsScheme = 'ws';
              const backendHostPort = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'localhost:8000'
                : `${window.location.hostname}:8000`;
              wsUrl = `${wsScheme}://${backendHostPort}/api/paging/ptt-stream?token=${encodeURIComponent(token || '')}`;
            }
          }
          const ws = new WebSocket(wsUrl);
          ws.binaryType = 'arraybuffer';
          wsRef.current = ws;

          await new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('WebSocket connect timeout')), 5000);
            ws.onopen = () => { clearTimeout(t); resolve(); };
            ws.onerror = (e) => { clearTimeout(t); reject(e); };
            ws.onclose = (ev) => {
              // If it closes before open resolves, propagate a meaningful message
              if (ev && ev.code) {
                reject(new Error(`WebSocket closed (${ev.code}) ${ev.reason || ''}`));
              } else {
                reject(new Error('WebSocket closed'));
              }
            };
          });

          const options = { mimeType: 'audio/webm;codecs=opus' };
          let recorder;
          try {
            recorder = new MediaRecorder(stream, options);
          } catch {
            // Fallback without explicit mimeType
            recorder = new MediaRecorder(stream);
          }
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = async (e) => {
            if (!e.data || e.data.size === 0) return;
            try {
              const buf = await e.data.arrayBuffer();
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(buf);
              }
            } catch (sendErr) {
              console.error('WS send error:', sendErr);
            }
          };
          recorder.start(100); // 100ms chunks
          setIsStreaming(true);
          startAudioLevelMonitoring();
          onStatusChange?.({ isStreaming: true, device: currentDevice });
        } catch (error) {
          console.error('Error starting stream:', error);
          setError('Failed to start audio stream');
          setIsPressed(false);
        }
      }, delayMs);
      
    } catch (error) {
      console.error('Error starting push-to-talk:', error);
      setError('Failed to start push-to-talk');
      setIsPressed(false);
    }
  };

  const handleMouseUp = async () => {
    console.log('handleMouseUp called, isPressed:', isPressed, 'isStreaming:', isStreaming);
    
    // Always proceed with cleanup, don't check isPressed state
    setIsPressed(false);
    
    // Always stop audio level monitoring immediately
    stopAudioLevelMonitoring();
    
    try {
      // Stop client-side recorder and WS
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      // Notify backend to stop any server-side processes (bell finished, etc.)
      await api.stopPushToTalk();
      setIsStreaming(false);
      onStatusChange?.({ isStreaming: false });
      console.log('Push-to-talk stopped successfully');
    } catch (error) {
      console.error('Error stopping push-to-talk:', error);
      setError('Failed to stop push-to-talk');
      // Force reset state even if API call fails
      setIsStreaming(false);
    }
  };

  const handleSettingsSave = (newSettings) => {
    setDeviceSettings(newSettings);
    setCurrentDevice(newSettings.device_id);
  };

  const getCurrentDeviceName = () => {
    const device = devices.find(d => d.id === currentDevice);
    return device ? device.name : (currentDevice || 'No Device Selected');
  };

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6">Push-to-Talk</Typography>
        <Tooltip title="Audio Settings">
          <IconButton onClick={() => setShowSettings(true)} size="small">
            <Settings />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Device: {getCurrentDeviceName()}
        </Typography>
        {deviceSettings && (
          <Typography variant="caption" color="text.secondary">
            {deviceSettings.sample_rate/1000}kHz, {deviceSettings.bit_depth}-bit, {deviceSettings.channels}ch
          </Typography>
        )}
      </Box>

      <Button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        variant={isPressed ? "contained" : "outlined"}
        color={isStreaming ? "error" : "primary"}
        size="large"
        startIcon={isStreaming ? <VolumeUp /> : <Mic />}
        sx={{
          minWidth: 200,
          minHeight: 60,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : undefined,
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}
        disabled={!currentDevice || !isSecure}
      >
        {isPressed ? (isStreaming ? "LIVE" : "Starting...") : "Push to Talk"}
      </Button>

      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
        Hold button or press SPACE to talk
      </Typography>

      {!isSecure && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          Mic access is blocked because this page is not in a secure context. Use HTTPS or open from localhost.
        </Typography>
      )}

      <AudioLevelIndicator level={audioLevel} isActive={isStreaming} />

      <DeviceSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        currentDevice={currentDevice}
        devices={devices}
      />
    </Box>
  );
}
