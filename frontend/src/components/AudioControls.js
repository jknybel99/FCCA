import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert
} from '@mui/material';
import {
  VolumeUp,
  GraphicEq,
  Settings,
  Save,
  Mic,
  MusicNote
} from '@mui/icons-material';
import api from '../api';

export default function AudioControls() {
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState('');
  const [volume, setVolume] = useState(100);
  const [masterVolume, setMasterVolume] = useState(100);
  const [eqSettings, setEqSettings] = useState({
    low: 0,
    mid: 0,
    high: 0,
    bass: 0,
    treble: 0
  });
  const [audioSettings, setAudioSettings] = useState({
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    bufferSize: 512
  });
  const [recordingDefaultMode, setRecordingDefaultMode] = useState('browser');
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Audio input states
  const [audioInputs, setAudioInputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [isInputEnabled, setIsInputEnabled] = useState(false);
  
  // Paging sound states
  const [availableSounds, setAvailableSounds] = useState([]);
  const [selectedPagingSound, setSelectedPagingSound] = useState('');
  const [pagingSoundVolume, setPagingSoundVolume] = useState(80);

  useEffect(() => {
    loadAudioSettings();
    detectAudioOutputs();
    detectAudioInputs();
    loadAvailableSounds();
  }, []);

  const loadAudioSettings = async () => {
    try {
      // Load saved settings from backend
      const settings = await api.getAudioSettings();
      if (settings) {
        setVolume(parseInt(settings.volume) || 100);
        setMasterVolume(parseInt(settings.masterVolume) || 100);
        setEqSettings({
          low: parseInt(settings.eq?.low) || 0,
          mid: parseInt(settings.eq?.mid) || 0,
          high: parseInt(settings.eq?.high) || 0,
          bass: parseInt(settings.eq?.bass) || 0,
          treble: parseInt(settings.eq?.treble) || 0
        });
        setAudioSettings({
          sampleRate: parseInt(settings.audio?.sampleRate) || 44100,
          bitDepth: parseInt(settings.audio?.bitDepth) || 16,
          channels: parseInt(settings.audio?.channels) || 2,
          bufferSize: parseInt(settings.audio?.bufferSize) || 512
        });
        setSelectedOutput(settings.output || '');
        setIsEnabled(settings.enabled !== false);
        setSelectedInput(settings.input || '');
        setIsInputEnabled(settings.inputEnabled !== false);
        setSelectedPagingSound(settings.pagingSound || '');
        setPagingSoundVolume(parseInt(settings.pagingSoundVolume) || 80);
      }
      
      // Also load admin settings for audio input device and paging sound
      const adminSettings = await api.getAdminSettings();
      if (adminSettings) {
        if (adminSettings.defaultAudioInputDevice) {
          setSelectedInput(adminSettings.defaultAudioInputDevice);
        }
        if (adminSettings.pagingPreSoundId) {
          setSelectedPagingSound(adminSettings.pagingPreSoundId);
        }
        if (adminSettings.pagingPreSoundVolume) {
          setPagingSoundVolume(parseInt(adminSettings.pagingPreSoundVolume) || 80);
        }
        if (adminSettings.recordingDefaultMode) {
          setRecordingDefaultMode(adminSettings.recordingDefaultMode);
        }
        // Override audio settings with admin settings if they exist
        if (adminSettings.audioSampleRate || adminSettings.audioBitDepth || 
            adminSettings.audioChannels || adminSettings.audioBufferSize) {
          setAudioSettings(prev => ({
            sampleRate: parseInt(adminSettings.audioSampleRate) || prev.sampleRate,
            bitDepth: parseInt(adminSettings.audioBitDepth) || prev.bitDepth,
            channels: parseInt(adminSettings.audioChannels) || prev.channels,
            bufferSize: parseInt(adminSettings.audioBufferSize) || prev.bufferSize
          }));
        }
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
  };

  const detectAudioOutputs = async () => {
    try {
      // Try to get actual audio outputs from the backend
      const response = await api.getAudioOutputs();
      if (response && response.length > 0) {
        setAudioOutputs(response);
        
        // Auto-select default device if available
        const defaultDevice = response.find(device => 
          device.id === 'default' || 
          device.name.toLowerCase().includes('default') ||
          device.name.toLowerCase().includes('active')
        );
        
        if (defaultDevice && !selectedOutput) {
          setSelectedOutput(defaultDevice.id);
        }
      } else {
        // Fallback to default outputs
        const outputs = [
          { id: 'default', name: 'Default Audio Output' },
          { id: 'hdmi', name: 'HDMI Audio' },
          { id: 'optical', name: 'Optical/SPDIF Output' },
          { id: 'usb', name: 'USB Audio Device' },
          { id: 'bluetooth', name: 'Bluetooth Audio' }
        ];
        setAudioOutputs(outputs);
        if (!selectedOutput) {
          setSelectedOutput('default');
        }
      }
    } catch (error) {
      console.error('Error detecting audio outputs:', error);
      // Fallback to default outputs
      const outputs = [
        { id: 'default', name: 'Default Audio Output' },
        { id: 'hdmi', name: 'HDMI Audio' },
        { id: 'optical', name: 'Optical/SPDIF Output' },
        { id: 'usb', name: 'USB Audio Device' },
        { id: 'bluetooth', name: 'Bluetooth Audio' }
      ];
      setAudioOutputs(outputs);
      if (!selectedOutput) {
        setSelectedOutput('default');
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      const settings = {
        volume,
        masterVolume,
        eq: eqSettings,
        audio: audioSettings,
        output: selectedOutput,
        input: selectedInput,
        inputEnabled: isInputEnabled,
        pagingSound: selectedPagingSound,
        pagingSoundVolume: pagingSoundVolume,
        enabled: isEnabled
      };
      
      await api.saveAudioSettings(settings);
      
      // Also save the input device, paging sound, and audio settings to admin settings
      await api.saveAdminSettings({ 
        defaultAudioInputDevice: selectedInput,
        recordingDefaultMode,
        pagingPreSoundId: selectedPagingSound,
        pagingPreSoundVolume: pagingSoundVolume,
        audioSampleRate: audioSettings.sampleRate,
        audioBitDepth: audioSettings.bitDepth,
        audioChannels: audioSettings.channels,
        audioBufferSize: audioSettings.bufferSize
      });
      
      alert('Audio settings saved successfully!');
      
      // Refresh settings after saving
      setTimeout(() => {
        loadAudioSettings();
      }, 500);
    } catch (error) {
      console.error('Error saving audio settings:', error);
      alert('Error saving audio settings: ' + error.message);
    }
  };

  const handleEqChange = (band, value) => {
    setEqSettings(prev => ({
      ...prev,
      [band]: value
    }));
  };

  const handleAudioSettingChange = (setting, value) => {
    setAudioSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const detectAudioInputs = async () => {
    try {
      const response = await api.getAudioInputDevices();
      if (response && Array.isArray(response)) {
        setAudioInputs(response);
        // Auto-select first input if none selected
        if (!selectedInput && response.length > 0) {
          setSelectedInput(response[0].id);
        }
      }
    } catch (error) {
      console.error('Error detecting audio inputs:', error);
    }
  };

  const loadAvailableSounds = async () => {
    try {
      const response = await api.getAudioFiles();
      if (response && Array.isArray(response)) {
        const allSounds = response.filter(sound => 
          sound.type === 'bell' || sound.type === 'music'
        );
        setAvailableSounds(allSounds);
      }
    } catch (error) {
      console.error('Error loading available sounds:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
        Audio Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Audio Output Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audio Output
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Output Device</InputLabel>
                <Select
                  value={selectedOutput}
                  onChange={(e) => setSelectedOutput(e.target.value)}
                  label="Output Device"
                >
                  {audioOutputs.map((output) => (
                    <MenuItem key={output.id} value={output.id}>
                      {output.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                  />
                }
                label="Enable Audio Output"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>


        {/* Audio Input Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Mic sx={{ mr: 1, verticalAlign: 'middle' }} />
                Audio Input
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Input Device</InputLabel>
                <Select
                  value={selectedInput}
                  onChange={(e) => setSelectedInput(e.target.value)}
                  label="Input Device"
                >
                  {audioInputs.map((input) => (
                    <MenuItem key={input.id} value={input.id}>
                      {input.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isInputEnabled}
                    onChange={(e) => setIsInputEnabled(e.target.checked)}
                  />
                }
                label="Enable Audio Input"
                sx={{ mt: 2 }}
              />

              <FormControl fullWidth margin="normal" sx={{ mt: 2 }}>
                <InputLabel>Default Recording Mode</InputLabel>
                <Select
                  value={recordingDefaultMode}
                  onChange={(e) => setRecordingDefaultMode(e.target.value)}
                  label="Default Recording Mode"
                >
                  <MenuItem value="browser">Browser mic (upload)</MenuItem>
                  <MenuItem value="server">Server mic</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 1 }}>
                When set to Server mic, the selected Input Device above will be used as default.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Volume Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <VolumeUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Volume Controls
              </Typography>
              
              <Typography gutterBottom>Master Volume</Typography>
              <Slider
                value={masterVolume}
                onChange={(e, value) => setMasterVolume(value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>System Volume</Typography>
              <Slider
                value={volume}
                onChange={(e, value) => setVolume(value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Paging Sound Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MusicNote sx={{ mr: 1, verticalAlign: 'middle' }} />
                Paging Sound
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Pre-Announcement Sound</InputLabel>
                <Select
                  value={selectedPagingSound}
                  onChange={(e) => setSelectedPagingSound(e.target.value)}
                  label="Pre-Announcement Sound"
                >
                  <MenuItem value="">
                    <em>No pre-sound</em>
                  </MenuItem>
                  {availableSounds.map((sound) => (
                    <MenuItem key={sound.id} value={sound.id}>
                      {sound.name} ({sound.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography gutterBottom sx={{ mt: 2 }}>Pre-Sound Volume (%)</Typography>
              <Slider
                value={pagingSoundVolume}
                onChange={(e, value) => setPagingSoundVolume(value)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* EQ Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <GraphicEq sx={{ mr: 1, verticalAlign: 'middle' }} />
                Equalizer Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography gutterBottom align="center">Low</Typography>
                  <Slider
                    orientation="vertical"
                    value={eqSettings.low}
                    onChange={(e, value) => handleEqChange('low', value)}
                    min={-12}
                    max={12}
                    valueLabelDisplay="auto"
                    sx={{ height: 150, mx: 'auto' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography gutterBottom align="center">Mid</Typography>
                  <Slider
                    orientation="vertical"
                    value={eqSettings.mid}
                    onChange={(e, value) => handleEqChange('mid', value)}
                    min={-12}
                    max={12}
                    valueLabelDisplay="auto"
                    sx={{ height: 150, mx: 'auto' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography gutterBottom align="center">High</Typography>
                  <Slider
                    orientation="vertical"
                    value={eqSettings.high}
                    onChange={(e, value) => handleEqChange('high', value)}
                    min={-12}
                    max={12}
                    valueLabelDisplay="auto"
                    sx={{ height: 150, mx: 'auto' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography gutterBottom align="center">Bass</Typography>
                  <Slider
                    orientation="vertical"
                    value={eqSettings.bass}
                    onChange={(e, value) => handleEqChange('bass', value)}
                    min={-12}
                    max={12}
                    valueLabelDisplay="auto"
                    sx={{ height: 150, mx: 'auto' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography gutterBottom align="center">Treble</Typography>
                  <Slider
                    orientation="vertical"
                    value={eqSettings.treble}
                    onChange={(e, value) => handleEqChange('treble', value)}
                    min={-12}
                    max={12}
                    valueLabelDisplay="auto"
                    sx={{ height: 150, mx: 'auto' }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Audio Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Audio Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sample Rate</InputLabel>
                    <Select
                      value={audioSettings.sampleRate}
                      onChange={(e) => handleAudioSettingChange('sampleRate', e.target.value)}
                      label="Sample Rate"
                    >
                      <MenuItem value={22050}>22.05 kHz</MenuItem>
                      <MenuItem value={44100}>44.1 kHz</MenuItem>
                      <MenuItem value={48000}>48 kHz</MenuItem>
                      <MenuItem value={96000}>96 kHz</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Bit Depth</InputLabel>
                    <Select
                      value={audioSettings.bitDepth}
                      onChange={(e) => handleAudioSettingChange('bitDepth', e.target.value)}
                      label="Bit Depth"
                    >
                      <MenuItem value={16}>16-bit</MenuItem>
                      <MenuItem value={24}>24-bit</MenuItem>
                      <MenuItem value={32}>32-bit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Channels</InputLabel>
                    <Select
                      value={audioSettings.channels}
                      onChange={(e) => handleAudioSettingChange('channels', e.target.value)}
                      label="Channels"
                    >
                      <MenuItem value={1}>Mono</MenuItem>
                      <MenuItem value={2}>Stereo</MenuItem>
                      <MenuItem value={5}>5.1 Surround</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Buffer Size</InputLabel>
                    <Select
                      value={audioSettings.bufferSize}
                      onChange={(e) => handleAudioSettingChange('bufferSize', e.target.value)}
                      label="Buffer Size"
                    >
                      <MenuItem value={256}>256 samples</MenuItem>
                      <MenuItem value={512}>512 samples</MenuItem>
                      <MenuItem value={1024}>1024 samples</MenuItem>
                      <MenuItem value={2048}>2048 samples</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
        >
          Save Audio Settings
        </Button>
      </Box>
    </Box>
  );
}
