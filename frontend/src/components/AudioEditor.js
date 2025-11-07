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
  const [gain, setGain] = useState(100); // Audio amplification (permanent)
  const [playbackVolume, setPlaybackVolume] = useState(100); // Playback volume (temporary)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef(null);
  const lastMouseXRef = useRef(0);
  const animationFrameRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const playbackStartTimeRef = useRef(null);

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
      console.log('=== playFromTime called with startTime:', startTime);
      
      // Stop any current playback
      if (audioRef.current) {
        console.log('Stopping existing audio');
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      setError('');
      
      // Load MP3 directly from server using the same backend URL as API calls
      const backendUrl = api.getBackendBaseUrl ? api.getBackendBaseUrl() : 'http://localhost:8000';
      let filePath = audioFile.file_path;
      if (filePath.startsWith('static/sounds/')) {
        filePath = filePath.replace('static/sounds/', '/sounds/');
      } else if (filePath.startsWith('static/')) {
        filePath = filePath.replace('static/', '/static/');
      }
      
      const audioUrl = backendUrl + filePath;
      console.log('Loading MP3 from:', audioUrl, '(backend URL:', backendUrl, ')');
      
      const audio = new Audio(audioUrl);
      audio.volume = playbackVolume / 100;
      audio.preload = 'auto';
      
      console.log('Audio element created - volume:', audio.volume);
      
      // CRITICAL: Force unmute and set volume
      audio.muted = false;
      audio.volume = 1.0; // Force max volume for testing
      console.log('Forced audio settings - muted:', audio.muted, 'volume:', audio.volume);
      
      // Set up event handlers
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
        // Seek to start time after metadata is loaded
        audio.currentTime = startTime;
        setCurrentTime(startTime);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('Audio can play');
      });
      
      audio.addEventListener('playing', () => {
        console.log('Audio is playing - volume:', audio.volume, 'currentTime:', audio.currentTime);
        setIsPlaying(true);
      });
      
      audio.addEventListener('timeupdate', () => {
        if (audio && !audio.paused) {
          setCurrentTime(audio.currentTime);
          // Stop at trim end
          if (audio.currentTime >= trimEnd) {
            audio.pause();
            setIsPlaying(false);
            setCurrentTime(trimStart);
          }
        }
      });
      
      audio.addEventListener('ended', () => {
        console.log('Audio ended');
        setIsPlaying(false);
        setCurrentTime(trimStart);
        audioRef.current = null;
      });
      
      audio.addEventListener('pause', () => {
        console.log('Audio paused');
        setIsPlaying(false);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e, audio.error);
        setIsPlaying(false);
        setError(`Playback error: ${audio.error?.message || 'Unknown error'}`);
        audioRef.current = null;
      });
      
      // Store reference
      audioRef.current = audio;
      
      // Load and play
      audio.load();
      console.log('Audio loading...');
      
      // Wait for it to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Load timeout')), 10000);
        audio.addEventListener('canplaythrough', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
        audio.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error(audio.error?.message || 'Load failed'));
        }, { once: true });
      });
      
      // Seek to start position
      console.log('Seeking to:', startTime);
      audio.currentTime = startTime;
      
      // Start playback
      console.log('Starting playback...');
      await audio.play();
      console.log('Playback started successfully');
      
      // Start animation frame for waveform
      updatePlayhead();
      
    } catch (error) {
      console.error('=== playFromTime error:', error);
      setError(`Failed to play: ${error.message}`);
      setIsPlaying(false);
      
      if (audioRef.current) {
        audioRef.current = null;
      }
    }
  };

  const playAudio = async () => {
    if (isPlaying) {
      pauseAudio();
      return;
    }
    
    // Use server-side playback (like Audio Library does)
    try {
      console.log('=== playAudio - using server-side playback');
      setIsPlaying(true);
      setError('');
      
      // Play the full audio file on server
      await api.playSound(audioFile.id);
      
      // Track progress for UI
      playbackStartTimeRef.current = Date.now();
      const duration = trimEnd - trimStart;
      
      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Update progress every 50ms
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - playbackStartTimeRef.current) / 1000;
        const currentPos = trimStart + elapsed;
        
        if (currentPos >= trimEnd) {
          stopAudio();
        } else {
          setCurrentTime(currentPos);
        }
      }, 50);
      
      // Start waveform animation
      updatePlayhead();
      
    } catch (error) {
      console.error('Playback error:', error);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const pauseAudio = async () => {
    console.log('=== pauseAudio called');
    
    // Stop only THIS sound's playback (not all audio)
    try {
      await api.stopSound(audioFile.id);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
    
    setIsPlaying(false);
    
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const stopAudio = async () => {
    console.log('=== stopAudio called');
    
    // Stop only THIS sound's playback (not all audio)
    try {
      await api.stopSound(audioFile.id);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
    
    setIsPlaying(false);
    setCurrentTime(trimStart);
    
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    drawWaveform(); // Redraw to clear playhead
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
    console.log('=== previewTrimmedSection called');
    
    if (isPlaying) {
      stopAudio();
      return;
    }
    
    try {
      setIsPlaying(true);
      setError('');
      
      console.log('Requesting trimmed preview:', { audioFileId: audioFile.id, trimStart, trimEnd });
      const audioBlob = await api.trimAudioPreview(audioFile.id, trimStart, trimEnd);
      console.log('Received audio blob:', audioBlob.size, 'bytes', 'type:', audioBlob.type);
      
      // Create audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Created blob URL:', audioUrl);
      
      const audio = new Audio(audioUrl);
      audio.volume = playbackVolume / 100;
      
      audio.addEventListener('loadedmetadata', () => {
        console.log('Trimmed preview metadata loaded, duration:', audio.duration);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('Trimmed preview can play');
      });
      
      audio.addEventListener('ended', () => {
        console.log('Trimmed preview ended');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Trimmed preview error:', e);
        console.error('Audio error:', audio.error);
        setIsPlaying(false);
        setError(`Failed to play trimmed preview: ${audio.error?.message || 'Unknown error'}`);
        URL.revokeObjectURL(audioUrl);
      });
      
      console.log('Starting trimmed preview playback...');
      await audio.play();
      console.log('Trimmed preview playing');
      
      // Auto-stop after the trimmed duration (as backup)
      const trimmedDuration = trimEnd - trimStart;
      setTimeout(() => {
        if (audio && !audio.paused) {
          console.log('Auto-stopping trimmed preview');
          audio.pause();
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        }
      }, (trimmedDuration + 0.5) * 1000);
      
    } catch (error) {
      console.error('=== Error previewing trimmed section:', error);
      console.error('Error stack:', error.stack);
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
      
      console.log('Starting fade preview for file:', audioFile.name);
      console.log('Fade settings:', { fadeIn, fadeOut, gain, trimStart, trimEnd });
      
      // Get processed audio with fade effects from backend
      const audioBlob = await api.fadeAudioPreview(audioFile.id, trimStart, trimEnd, fadeIn, fadeOut, gain);
      console.log('Received fade preview blob:', audioBlob.size, 'bytes');
      
      // Create audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      console.log('Audio blob loaded, starting playback with fade effects');
      
      // Set playback volume (fade effects are already in the audio)
      audio.volume = playbackVolume / 100;
      
      // Start playback
      console.log('Starting fade preview playback...');
      await audio.play();
      console.log('Fade preview playback started successfully');
      
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
        gain,
        editedName,
        `Edited version of ${audioFile.name} (trimmed ${formatTime(trimStart)}-${formatTime(trimEnd)}, gain ${gain}%)`,
        audioFile.tags || '',
        audioFile.type || 'bell'
      );
      
      console.log('Save result:', result);
      setSuccess(`Audio processed and saved successfully! New file: ${result.sound.name}`);
      setError('');
      setIsLoading(false);
      
      // Close the editor after successful save
      setTimeout(() => {
        onSave && onSave();
      }, 3000);
      
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
            
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary">
                🎚️ Gain/Amplification: {gain}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Permanently increases audio volume. Use this to boost quiet clips. 100% = original, 200% = 2x louder
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  sx={{ mx: 2 }}
                />
                <VolumeUp />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setGain(100)}>Reset</Button>
                <Button size="small" variant="outlined" onClick={() => setGain(150)}>+50%</Button>
                <Button size="small" variant="outlined" onClick={() => setGain(200)}>Max</Button>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔊 Playback Volume: {playbackVolume}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Temporary preview volume (doesn't affect saved audio)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeDown fontSize="small" />
                <Slider
                  value={playbackVolume}
                  onChange={(e, value) => {
                    setPlaybackVolume(value);
                    if (audioRef.current) {
                      audioRef.current.volume = value / 100;
                    }
                  }}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  size="small"
                />
                <VolumeUp fontSize="small" />
              </Box>
            </Box>
          </Grid>

          {/* Success Display */}
          {success && (
            <Grid item xs={12}>
              <Alert severity="success" onClose={() => setSuccess('')}>
                {success}
              </Alert>
            </Grid>
          )}
          
          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
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
