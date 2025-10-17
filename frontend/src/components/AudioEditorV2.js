import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  TextField,
  IconButton,
  Alert,
  LinearProgress,
  Paper,
  Grid,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  ZoomIn,
  ZoomOut,
  Save,
  Close,
  VolumeUp,
  VolumeDown,
  GraphicEq
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import api from '../api';

const AudioEditorV2 = ({ open, onClose, audioFile, onSave }) => {
  console.log('AudioEditorV2 rendered - open:', open, 'audioFile:', audioFile);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [zoom, setZoom] = useState(50);
  const [gain, setGain] = useState(100);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [editedName, setEditedName] = useState('');
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionRef = useRef(null);

  // Initialize WaveSurfer
  useEffect(() => {
    console.log('useEffect triggered - open:', open, 'audioFile:', audioFile, 'waveformRef.current:', waveformRef.current);
    
    if (!open || !audioFile) {
      return;
    }

    // Wait for DOM to be ready (Dialog animation)
    const initTimer = setTimeout(() => {
      if (!waveformRef.current) {
        console.error('Waveform ref still null after timeout');
        setError('Failed to initialize audio editor');
        return;
      }

      console.log('Initializing WaveSurfer for:', audioFile.name);
      
      // Destroy existing instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4a90e2',
        progressColor: '#1976d2',
        cursorColor: '#ff5722',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 150,
        normalize: true,
        backend: 'WebAudio',
        interact: true,
        hideScrollbar: false,
        plugins: [
          RegionsPlugin.create({
            dragSelection: true,
          })
        ]
      });

      wavesurferRef.current = wavesurfer;

      // Load audio file
      const backendUrl = api.getBackendBaseUrl ? api.getBackendBaseUrl() : 'http://localhost:8000';
      let filePath = audioFile.file_path;
      
      console.log('Original file_path:', filePath);
      
      if (filePath.startsWith('static/sounds/')) {
        filePath = filePath.replace('static/sounds/', '/sounds/');
      } else if (filePath.startsWith('static/')) {
        filePath = filePath.replace('static/', '/static/');
      } else if (!filePath.startsWith('/')) {
        // If no prefix, assume it's in sounds directory
        filePath = '/sounds/' + filePath;
      }
      
      const audioUrl = backendUrl + filePath;
      
      console.log('Loading audio from:', audioUrl);
      console.log('Backend URL:', backendUrl);
      console.log('Processed file path:', filePath);
      
      setIsLoading(true);
      
      wavesurfer.load(audioUrl);

      // Event listeners
      wavesurfer.on('ready', () => {
        console.log('WaveSurfer ready');
        setIsLoading(false);
        const dur = wavesurfer.getDuration();
        setDuration(dur);
        setTrimEnd(dur);
        setEditedName(audioFile.name + '_edited');
        
        // Create initial region for entire audio
        const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
        regionRef.current = regions.addRegion({
          start: 0,
          end: dur,
          color: 'rgba(255, 193, 7, 0.3)',
          drag: true,
          resize: true,
        });

        // Listen to region updates
        regions.on('region-updated', (region) => {
          setTrimStart(region.start);
          setTrimEnd(region.end);
          console.log('Region updated:', region.start, '-', region.end);
        });
      });

      wavesurfer.on('play', () => {
        setIsPlaying(true);
      });

      wavesurfer.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurfer.on('finish', () => {
        setIsPlaying(false);
      });

      wavesurfer.on('audioprocess', (time) => {
        setCurrentTime(time);
      });

      wavesurfer.on('error', (err) => {
        console.error('WaveSurfer error:', err);
        console.error('Error details:', err.message || err);
        setIsLoading(false);
        setError(`Failed to load audio file: ${err.message || 'Unknown error'}`);
      });

      wavesurfer.on('loading', (percent) => {
        console.log('Loading:', percent + '%');
      });
    }, 300); // 300ms delay for dialog animation

    // Cleanup
    return () => {
      clearTimeout(initTimer);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [open, audioFile]);

  // Update zoom
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(zoom);
    }
  }, [zoom]);

  // Update gain (volume) in real-time
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(gain / 100);
    }
  }, [gain]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleStop = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 20, 10));
  };

  const handlePlayRegion = () => {
    if (wavesurferRef.current && regionRef.current) {
      regionRef.current.play();
    }
  };

  const handlePlayOnServer = async () => {
    // Play original file through server speakers
    try {
      await api.playSound(audioFile.id);
    } catch (error) {
      console.error('Server playback error:', error);
      setError('Failed to play on server');
    }
  };

  const handlePreviewEdited = async () => {
    // Preview the edited audio with all effects applied
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Generating preview with effects:', {
        trimStart,
        trimEnd,
        fadeIn,
        fadeOut,
        gain
      });

      // Get processed audio from backend
      const audioBlob = await api.fadeAudioPreview(
        audioFile.id,
        trimStart,
        trimEnd,
        fadeIn,
        fadeOut,
        gain
      );
      
      console.log('Preview generated, size:', audioBlob.size);
      
      // Create temporary audio element and play through browser
      // (This won't work for remote access, but we'll add server playback next)
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        setIsLoading(false);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Preview playback error:', e);
        URL.revokeObjectURL(audioUrl);
        setIsLoading(false);
        setError('Preview playback failed - audio generated but cannot play in browser');
      });
      
      await audio.play();
      setSuccess('Preview playing... (Note: Remote users may not hear browser audio)');
      
    } catch (error) {
      console.error('Preview error:', error);
      setError(`Failed to generate preview: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedName || editedName.trim() === '') {
      setError('Please enter a name for the edited file');
      return;
    }

    if (trimEnd - trimStart < 1) {
      setError('Trimmed audio must be at least 1 second long');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      console.log('Saving edited audio:', {
        soundId: audioFile.id,
        trimStart,
        trimEnd,
        fadeIn,
        fadeOut,
        gain,
        name: editedName
      });

      const result = await api.processAndSaveAudio(
        audioFile.id,
        trimStart,
        trimEnd,
        fadeIn,
        fadeOut,
        gain,
        editedName,
        `Edited version of ${audioFile.name} (${formatTime(trimStart)}-${formatTime(trimEnd)}, gain ${gain}%)`,
        audioFile.tags || '',
        audioFile.type || 'bell'
      );

      console.log('Save result:', result);
      setSuccess(`Audio saved successfully! New file: ${result.sound.name}`);
      setIsLoading(false);

      // Close after 2 seconds
      setTimeout(() => {
        onSave && onSave();
      }, 2000);

    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.message}`);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioFile) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            🎚️ Audio Editor - {audioFile.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Waveform Display */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Waveform - Drag the green region to trim
                </Typography>
                <Box>
                  <Chip 
                    label={`${formatTime(currentTime)} / ${formatTime(duration)}`} 
                    size="small" 
                    color="primary"
                  />
                </Box>
              </Box>
              
              {/* Waveform Container */}
              <Box 
                ref={waveformRef} 
                sx={{ 
                  width: '100%', 
                  minHeight: 150,
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: '1px solid #ddd'
                }}
              />

              {/* Playback Controls */}
              <Box display="flex" gap={1} mt={2} alignItems="center">
                <Tooltip title={isPlaying ? "Pause" : "Play"}>
                  <IconButton onClick={handlePlayPause} color="primary" size="large">
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Stop">
                  <IconButton onClick={handleStop} color="error">
                    <Stop />
                  </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <Tooltip title="Zoom Out">
                  <IconButton onClick={handleZoomOut} size="small">
                    <ZoomOut />
                  </IconButton>
                </Tooltip>
                
                <Typography variant="caption" sx={{ minWidth: 60, textAlign: 'center' }}>
                  Zoom: {zoom}%
                </Typography>
                
                <Tooltip title="Zoom In">
                  <IconButton onClick={handleZoomIn} size="small">
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Trim Info */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                ✂️ Trim Selection
              </Typography>
              <Box display="flex" gap={2} alignItems="center">
                <Chip label={`Start: ${formatTime(trimStart)}`} size="small" />
                <Chip label={`End: ${formatTime(trimEnd)}`} size="small" />
                <Chip 
                  label={`Duration: ${formatTime(trimEnd - trimStart)}`} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Effects Controls */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🎚️ Gain / Amplification
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Boost or reduce audio volume (applied when saving)
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <VolumeDown />
                <Slider
                  value={gain}
                  onChange={(e, value) => setGain(value)}
                  min={50}
                  max={200}
                  step={5}
                  marks={[
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                    { value: 150, label: '150%' },
                    { value: 200, label: '200%' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <VolumeUp />
              </Box>
              <Box display="flex" gap={1} mt={1}>
                <Button size="small" variant="outlined" onClick={() => setGain(100)}>Reset</Button>
                <Button size="small" variant="outlined" onClick={() => setGain(150)}>+50%</Button>
                <Button size="small" variant="outlined" onClick={() => setGain(200)}>Max</Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🎵 Fade Effects
              </Typography>
              <Box mb={2}>
                <Typography variant="caption" gutterBottom>
                  Fade In: {fadeIn.toFixed(1)}s
                </Typography>
                <Slider
                  value={fadeIn}
                  onChange={(e, value) => setFadeIn(value)}
                  min={0}
                  max={5}
                  step={0.1}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="caption" gutterBottom>
                  Fade Out: {fadeOut.toFixed(1)}s
                </Typography>
                <Slider
                  value={fadeOut}
                  onChange={(e, value) => setFadeOut(value)}
                  min={0}
                  max={5}
                  step={0.1}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>

          {/* File Name */}
          <Grid item xs={12}>
            <TextField
              label="Edited File Name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Grid>

          {/* Success/Error Messages */}
          {success && (
            <Grid item xs={12}>
              <Alert severity="success" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </Grid>
          )}

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Loading */}
          {isLoading && (
            <Grid item xs={12}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Processing audio... This may take a moment.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={<Save />}
        >
          Save Edited Audio
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudioEditorV2;
