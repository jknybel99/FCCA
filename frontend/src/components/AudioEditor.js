import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
  Slider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Save,
  Close,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  VolumeDown,
  PlaylistPlay,
  GraphicEq
} from '@mui/icons-material';
import api from '../api';

const AudioEditor = ({ open, onClose, audioFile, onSave }) => {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef(null);
  const lastMouseXRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (open && audioFile) {
      if (audioFile.duration) {
        setDuration(audioFile.duration);
        setTrimEnd(audioFile.duration);
      }
      checkFfmpegStatus();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [open, audioFile]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Vertical time lines
    const timeStep = duration / 10;
    for (let i = 0; i <= 10; i++) {
      const time = i * timeStep;
      const x = (time / duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Time labels
      if (i % 2 === 0) {
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.fillText(formatTime(time), x + 2, 20);
      }
    }
    
    // Horizontal amplitude lines
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw waveform
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = height / 2;
    const scaleY = height / 3;
    
    for (let i = 0; i < width; i++) {
      const time = (i / width) * duration;
      const t = (time / duration) * 10;
      const wave = Math.sin(t * Math.PI * 8) * 0.4 + 
                   Math.sin(t * Math.PI * 16) * 0.3 + 
                   Math.sin(t * Math.PI * 4) * 0.2;
      const y = centerY + (wave * scaleY);
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    
    ctx.stroke();
    
    // Draw selection area
    drawSelectionArea();
    
    // Draw playhead
    if (isPlaying) {
      drawPlayhead();
    }
  };

  const drawSelectionArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Convert time to canvas coordinates
    const startX = (trimStart / duration) * width;
    const endX = (trimEnd / duration) * width;
    
    // Draw selection background
    if (endX > startX) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
      ctx.fillRect(startX, 0, endX - startX, height);
      
      // Draw selection border
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(startX, 0, endX - startX, height);
      ctx.setLineDash([]);
    }
    
    // Draw trim handles
    drawTrimHandle(startX, height, 'S');
    drawTrimHandle(endX, height, 'E');
  };

  const drawTrimHandle = (x, height, label) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Handle background
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(x - 10, 0, 20, height);
    
    // Handle border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 10, 0, 20, height);
    
    // Handle label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, 25);
  };

  const drawPlayhead = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const playheadX = (currentTime / duration) * width;
    
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      
      // Playhead head
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.moveTo(playheadX - 10, 0);
      ctx.lineTo(playheadX + 10, 0);
      ctx.lineTo(playheadX, 20);
      ctx.closePath();
      ctx.fill();
    }
  };

  const handleMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const canvasX = (x / rect.width) * canvas.width;
    
    // Check if clicking on trim handles
    const startX = (trimStart / duration) * canvas.width;
    const endX = (trimEnd / duration) * canvas.width;
    
    if (Math.abs(canvasX - startX) <= 15) {
      isDraggingRef.current = true;
      dragTypeRef.current = 'start';
      console.log('Dragging start handle');
    } else if (Math.abs(canvasX - endX) <= 15) {
      isDraggingRef.current = true;
      dragTypeRef.current = 'end';
      console.log('Dragging end handle');
    } else {
      // Click in the middle - create new selection and start playing from click point
      const clickTime = (canvasX / canvas.width) * duration;
      const selectionDuration = Math.min(10, duration / 4);
      const newStart = Math.max(0, clickTime - selectionDuration / 2);
      const newEnd = Math.min(duration, newStart + selectionDuration);
      setTrimStart(newStart);
      setTrimEnd(newEnd);
      console.log('New selection:', newStart, newEnd);
      
      // Start playing from the click point (Audacity-like behavior)
      playFromTime(clickTime);
    }
    
    lastMouseXRef.current = x;
  };

  const handleMouseMove = (event) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const deltaX = x - lastMouseXRef.current;
    lastMouseXRef.current = x;
    
    // Convert pixel delta to time delta
    const timeDelta = (deltaX / rect.width) * duration;
    
    if (dragTypeRef.current === 'start') {
      const newStart = Math.max(0, Math.min(trimEnd - 1, trimStart + timeDelta));
      setTrimStart(newStart);
    } else if (dragTypeRef.current === 'end') {
      const newEnd = Math.max(trimStart + 1, Math.min(duration, trimEnd + timeDelta));
      setTrimEnd(newEnd);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragTypeRef.current = null;
  };

  const updatePlayhead = () => {
    if (audioRef.current && isPlaying) {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      
      // Stop if we reach the trim end
      if (currentTime >= trimEnd) {
        stopAudio();
        return;
      }
      
      drawWaveform();
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }
  };

  const playFromTime = async (startTime) => {
    try {
      // Stop any current playback
      if (isPlaying) {
        await stopAudio();
      }
      
      setIsPlaying(true);
      setError('');
      setCurrentTime(startTime);
      
      // Create new audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      audioRef.current = new Audio();
      audioRef.current.src = `/api/sounds/${audioFile.id}/stream`;
      
      audioRef.current.onloadedmetadata = () => {
        console.log('Audio loaded, setting current time to:', startTime);
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      };
      
      audioRef.current.onended = () => {
        console.log('Audio ended');
        setIsPlaying(false);
        setCurrentTime(trimStart);
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
        setError('Failed to play audio');
      };
      
      audioRef.current.onplay = () => {
        console.log('Audio started playing from:', startTime);
      };
      
      audioRef.current.onpause = () => {
        console.log('Audio paused');
      };
      
      audioRef.current.onloadeddata = () => {
        console.log('Audio data loaded, starting playback from:', startTime);
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        updatePlayhead();
      };
      
      // Wait for audio to load before playing
      await new Promise((resolve, reject) => {
        audioRef.current.oncanplay = resolve;
        audioRef.current.onerror = reject;
        audioRef.current.load();
      });
      
      console.log('Starting playback from:', startTime);
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      await audioRef.current.play();
      
    } catch (error) {
      console.error('Error playing audio from time:', error);
      setError(`Failed to play: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const playAudio = async () => {
    if (isPlaying) {
      await pauseAudio();
      return;
    }
    
    // Start playing from current trim start position
    await playFromTime(trimStart);
  };

  const pauseAudio = async () => {
    console.log('Pausing audio');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const stopAudio = async () => {
    console.log('Stopping audio');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = trimStart;
    }
    setIsPlaying(false);
    setCurrentTime(trimStart);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const skipToStart = () => {
    console.log('Skipping to start:', trimStart);
    if (audioRef.current) {
      audioRef.current.currentTime = trimStart;
      setCurrentTime(trimStart);
    }
  };

  const skipToEnd = () => {
    console.log('Skipping to end:', trimEnd);
    if (audioRef.current) {
      audioRef.current.currentTime = trimEnd;
      setCurrentTime(trimEnd);
    }
  };

  const previewTrimmedSection = async () => {
    if (isPlaying) {
      await stopAudio();
      return;
    }
    
    try {
      setIsPlaying(true);
      setError('');
      
      // Get trimmed audio preview from backend
      const audioBlob = await api.trimAudioPreview(audioFile.id, trimStart, trimEnd);
      
      // Create audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play trimmed preview');
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
      // Auto-stop after the trimmed duration (as backup)
      const trimmedDuration = trimEnd - trimStart;
      setTimeout(() => {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        }
      }, trimmedDuration * 1000);
      
    } catch (error) {
      console.error('Error previewing trimmed section:', error);
      setError(`Failed to preview: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const previewWithFadeEffects = async () => {
    if (isPlaying) {
      await stopAudio();
      return;
    }
    
    try {
      setIsPlaying(true);
      setError('');
      
      console.log('Starting fade preview for file:', audioFile.name, 'type:', audioFile.type);
      console.log('Fade settings:', { fadeIn, fadeOut, volume, trimStart, trimEnd });
      
      // For now, use the same approach as trim preview since it works
      // Get trimmed audio preview from backend (this works)
      const audioBlob = await api.trimAudioPreview(audioFile.id, trimStart, trimEnd);
      
      // Create audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      console.log('Audio blob loaded, starting playback with fade effects');
      
      // Set initial volume based on fade in
      if (fadeIn > 0) {
        audio.volume = 0;
        console.log('Starting with volume 0 for fade in');
      } else {
        audio.volume = volume / 100;
        console.log('Starting with volume:', audio.volume);
      }
      
      // Start playback
      await audio.play();
      console.log('Playback started successfully');
      
      // Apply fade in effect
      if (fadeIn > 0) {
        console.log('Applying fade in over', fadeIn, 'seconds');
        const fadeInSteps = 20; // 20 steps for smooth fade
        const fadeInInterval = (fadeIn * 1000) / fadeInSteps;
        const volumeStep = (volume / 100) / fadeInSteps;
        
        let currentStep = 0;
        const fadeInTimer = setInterval(() => {
          currentStep++;
          const newVolume = Math.min(volume / 100, currentStep * volumeStep);
          audio.volume = newVolume;
          
          if (currentStep >= fadeInSteps) {
            clearInterval(fadeInTimer);
            audio.volume = volume / 100;
            console.log('Fade in completed');
          }
        }, fadeInInterval);
      }
      
      // Apply fade out effect
      if (fadeOut > 0) {
        const fadeOutStart = (trimEnd - trimStart - fadeOut) * 1000;
        console.log('Fade out will start in', fadeOutStart, 'ms');
        
        setTimeout(() => {
          console.log('Starting fade out over', fadeOut, 'seconds');
          const fadeOutSteps = 20;
          const fadeOutInterval = (fadeOut * 1000) / fadeOutSteps;
          const volumeStep = (volume / 100) / fadeOutSteps;
          
          let currentStep = 0;
          const fadeOutTimer = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(0, (volume / 100) - (currentStep * volumeStep));
            audio.volume = newVolume;
            
            if (currentStep >= fadeOutSteps) {
              clearInterval(fadeOutTimer);
              audio.volume = 0;
              console.log('Fade out completed');
            }
          }, fadeOutInterval);
        }, fadeOutStart);
      }
      
      // Set up event handlers
      audio.onended = () => {
        console.log('Fade preview ended');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        console.log('Fade preview error');
        setIsPlaying(false);
        setError('Failed to play fade preview');
        URL.revokeObjectURL(audioUrl);
      };
      
      // Stop at trim end
      const trimmedDuration = trimEnd - trimStart;
      console.log('Will stop playback after', trimmedDuration, 'seconds');
      setTimeout(() => {
        console.log('Stopping fade preview playback');
        audio.pause();
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      }, trimmedDuration * 1000);
      
    } catch (error) {
      console.error('Error with fade preview:', error);
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle different types of errors
      let errorMessage = 'Unknown error';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name) {
        errorMessage = error.name;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(`Fade preview failed: ${errorMessage}`);
      setIsPlaying(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Validate trim settings
      if (trimStart >= trimEnd) {
        setError('Start time must be before end time');
        setIsLoading(false);
        return;
      }
      
      if (trimEnd - trimStart < 1) {
        setError('Trimmed audio must be at least 1 second long');
        setIsLoading(false);
        return;
      }
      
      // Generate a name for the edited file
      const editedName = `${audioFile.name}_edited`;
      
      console.log('Saving audio with settings:', {
        sound_id: audioFile.id,
        start_time: trimStart,
        end_time: trimEnd,
        fade_in: fadeIn,
        fade_out: fadeOut,
        volume: volume,
        name: editedName
      });
      
      // Process and save the audio using the backend
      const result = await api.processAndSaveAudio(
        audioFile.id,
        trimStart,
        trimEnd,
        fadeIn,
        fadeOut,
        volume,
        editedName,
        `Edited version of ${audioFile.name} (trimmed ${formatTime(trimStart)}-${formatTime(trimEnd)})`,
        audioFile.tags || '',
        audioFile.type || 'bell'
      );
      
      console.log('Save result:', result);
      setError(`✅ Audio processed and saved successfully! New file: ${result.sound.name}`);
      setIsLoading(false);
      
      // Close the editor after successful save
      setTimeout(() => {
        onSave && onSave();
      }, 2000);
      
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to process audio: ${err.message}`);
      setIsLoading(false);
    }
  };

  const checkFfmpegStatus = async () => {
    try {
      const status = await api.checkFfmpegStatus();
      if (!status.ffmpeg_available) {
        setError('Warning: ffmpeg not available on server. Audio editing features may not work.');
      }
    } catch (error) {
      console.error('Failed to check ffmpeg status:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update waveform when needed
  useEffect(() => {
    drawWaveform();
  }, [trimStart, trimEnd, currentTime, isPlaying]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Audio Editor: {audioFile?.name}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Waveform Display */}
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Waveform & Trim Selection
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                <strong>Drag the red handles (S/E)</strong> to set trim points. <strong>Click anywhere</strong> to create new selection and start playing from that point.
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                border: '2px solid #444', 
                borderRadius: 1, 
                p: 2, 
                bgcolor: 'black',
                position: 'relative'
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                style={{ 
                  width: '100%', 
                  height: '200px',
                  cursor: 'crosshair'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </Box>
          </Grid>

          {/* Playback Controls */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton onClick={skipToStart} size="large">
                <SkipPrevious />
              </IconButton>
              
              <IconButton onClick={playAudio} size="large" color="primary">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <IconButton onClick={stopAudio} size="large">
                <Stop />
              </IconButton>
              
              <IconButton onClick={skipToEnd} size="large">
                <SkipNext />
              </IconButton>
              
              <Box sx={{ flex: 1, mx: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(currentTime / duration) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Trim Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Trim Settings
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Start Time: {formatTime(trimStart)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                End Time: {formatTime(trimEnd)}
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Trimmed Duration:</strong> {formatTime(trimEnd - trimStart)}
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              onClick={previewTrimmedSection}
              sx={{ mt: 2, mb: 1 }}
              fullWidth
              startIcon={<PlaylistPlay />}
            >
              Preview Trimmed Section
            </Button>
            
            <Button
              variant="outlined"
              onClick={previewWithFadeEffects}
              fullWidth
              startIcon={<GraphicEq />}
            >
              Preview with Fade Effects
            </Button>
          </Grid>

          {/* Effects Controls */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Audio Effects
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Fade In: {fadeIn.toFixed(1)}s
              </Typography>
              <Slider
                value={fadeIn}
                onChange={(e, value) => setFadeIn(value)}
                min={0}
                max={Math.min(5, trimEnd - trimStart)}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>
                Fade Out: {fadeOut.toFixed(1)}s
              </Typography>
              <Slider
                value={fadeOut}
                onChange={(e, value) => setFadeOut(value)}
                min={0}
                max={Math.min(5, trimEnd - trimStart)}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Volume: {volume}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeDown />
                <Slider
                  value={volume}
                  onChange={(e, value) => setVolume(value)}
                  min={0}
                  max={200}
                  valueLabelDisplay="auto"
                />
                <VolumeUp />
              </Box>
            </Box>
          </Grid>

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Alert severity={error.includes('✅') ? 'success' : 'warning'} onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Loading Progress */}
          {isLoading && (
            <Grid item xs={12}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Processing audio... This may take a few moments.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="textSecondary">
            The edited audio will be saved to the server and can be used in schedules.
          </Typography>
        </Box>
        
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={isLoading}
        >
          Save Edited Audio to Server
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudioEditor;
