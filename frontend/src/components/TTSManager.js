import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Tabs,
  Tab,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Settings,
  ExpandMore,
  Language,
  VoiceOverOff,
  CheckCircle,
  GetApp,
  Info,
  PlayArrow,
  Stop,
  VolumeUp
} from '@mui/icons-material';
import api from '../api';

const TTSManager = () => {
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState({});
  const [additionalVoices, setAdditionalVoices] = useState({});
  const [voicesByLanguage, setVoicesByLanguage] = useState({});
  const [ttsStatus, setTtsStatus] = useState(null);
  const [downloadingVoices, setDownloadingVoices] = useState({});
  const [removingVoices, setRemovingVoices] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);

  useEffect(() => {
    loadAvailableVoices();
    loadTTSStatus();
  }, []);

  const loadAvailableVoices = async () => {
    try {
      const response = await api.getAvailableVoices();
      setAvailableVoices(response.voices || {});
      setAdditionalVoices(response.additional_voices || {});
      setVoicesByLanguage(response.voices_by_language || {});
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load available voices');
    }
  };

  const loadTTSStatus = async () => {
    try {
      const response = await api.getTTSStatus();
      setTtsStatus(response);
    } catch (error) {
      console.error('Error loading TTS status:', error);
    }
  };

  const detectLanguage = async (text) => {
    if (!text.trim()) {
      setDetectedLanguage('');
      return;
    }

    // Only detect language if text is substantial (more than 3 characters)
    if (text.trim().length < 3) {
      return;
    }

    try {
      setIsDetectingLanguage(true);
      const response = await api.detectLanguage(text);
      setDetectedLanguage(response.detected_language);
      
      // Auto-select the best available voice for the detected language
      const availableVoicesList = getAvailableVoicesList();
      const bestVoice = findBestVoiceForLanguage(response.detected_language, availableVoicesList);
      if (bestVoice) {
        setSelectedVoice(bestVoice);
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      setDetectedLanguage('');
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  // Simple debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Debounced language detection to reduce API calls
  const debouncedDetectLanguage = useCallback(
    debounce((text) => {
      detectLanguage(text);
    }, 500), // Wait 500ms after user stops typing
    []
  );

  const generateTTS = async () => {
    if (!ttsText.trim()) {
      setError('Please enter text to convert to speech');
      return;
    }
    
    if (!selectedVoice) {
      setError('Please select a voice');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      
      const response = await api.generateTTS(ttsText, selectedVoice);
      
      if (response.success) {
        setSuccessMessage(`TTS audio generated successfully: ${response.filename}`);
        setTtsText(''); // Clear the text after successful generation
      } else {
        setError(response.error || 'TTS generation failed');
      }
    } catch (error) {
      console.error('Error generating TTS:', error);
      setError('Failed to generate TTS audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVoice = async (voiceId) => {
    try {
      setDownloadingVoices(prev => ({ ...prev, [voiceId]: true }));
      setError('');
      
      const response = await api.downloadVoice(voiceId);
      
      if (response.success) {
        setSuccessMessage(`Successfully downloaded voice: ${voiceId}`);
        // Reload voices to update status
        await loadAvailableVoices();
      } else {
        setError(response.error || 'Download failed');
      }
    } catch (error) {
      console.error('Error downloading voice:', error);
      setError('Failed to download voice');
    } finally {
      setDownloadingVoices(prev => ({ ...prev, [voiceId]: false }));
    }
  };

  const removeVoice = async (voiceId) => {
    try {
      setRemovingVoices(prev => ({ ...prev, [voiceId]: true }));
      setError('');
      
      const response = await api.removeVoice(voiceId);
      
      if (response.success) {
        setSuccessMessage(`Successfully removed voice: ${voiceId}`);
        // Reload voices to update status
        await loadAvailableVoices();
      } else {
        setError(response.error || 'Removal failed');
      }
    } catch (error) {
      console.error('Error removing voice:', error);
      setError('Failed to remove voice');
    } finally {
      setRemovingVoices(prev => ({ ...prev, [voiceId]: false }));
    }
  };

  const toggleMockMode = async (mockMode) => {
    try {
      const response = await api.toggleMockMode(mockMode);
      if (response.success) {
        setSuccessMessage(`Mock mode ${mockMode ? 'enabled' : 'disabled'}`);
        await loadTTSStatus();
      } else {
        setError(response.error || 'Failed to toggle mock mode');
      }
    } catch (error) {
      console.error('Error toggling mock mode:', error);
      setError('Failed to toggle mock mode');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      case 'x_low': return 'default';
      case 'x_high': return 'info';
      default: return 'default';
    }
  };

  const getAvailableVoicesList = () => {
    const available = [];
    
    // Add core voices that exist
    Object.entries(availableVoices).forEach(([voiceId, voice]) => {
      if (voice.exists) {
        available.push({
          id: voiceId,
          name: voice.name,
          language: voice.language,
          quality: 'medium' // Core voices are typically medium quality
        });
      }
    });
    
    // Add additional voices that exist
    Object.entries(additionalVoices).forEach(([voiceId, voice]) => {
      if (voice.exists) {
        available.push({
          id: voiceId,
          name: voice.name,
          language: voice.language_code || voice.language,
          quality: voice.quality
        });
      }
    });
    
    return available;
  };

  const findBestVoiceForLanguage = (language, availableVoicesList) => {
    // First, try to find a high-quality voice for the language
    let bestVoice = availableVoicesList.find(voice => 
      voice.language === language && voice.quality === 'high'
    );
    
    // If no high-quality voice, try medium
    if (!bestVoice) {
      bestVoice = availableVoicesList.find(voice => 
        voice.language === language && voice.quality === 'medium'
      );
    }
    
    // If no medium-quality voice, try any voice for the language
    if (!bestVoice) {
      bestVoice = availableVoicesList.find(voice => voice.language === language);
    }
    
    // If still no voice for the language, fall back to English
    if (!bestVoice) {
      bestVoice = availableVoicesList.find(voice => voice.language === 'en');
    }
    
    return bestVoice ? bestVoice.id : null;
  };

  const renderTTSGeneration = () => {
    const availableVoicesList = getAvailableVoicesList();
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Generate Text-to-Speech Audio
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Text to convert to speech"
                  value={ttsText}
                  onChange={(e) => {
                    setTtsText(e.target.value);
                    // Auto-detect language when text changes (debounced)
                    if (e.target.value.trim()) {
                      debouncedDetectLanguage(e.target.value);
                    } else {
                      setDetectedLanguage('');
                      setSelectedVoice('');
                    }
                  }}
                  placeholder="Enter the text you want to convert to speech..."
                  variant="outlined"
                />
              </Grid>
              
              {/* Language Detection Display */}
              {detectedLanguage && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Language />
                      <Typography variant="body2">
                        Detected language: <strong>{detectedLanguage.toUpperCase()}</strong>
                        {isDetectingLanguage && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </Typography>
                    </Box>
                  </Alert>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Select Voice (Available Only)</InputLabel>
                  <Select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    label="Select Voice (Available Only)"
                  >
                    {availableVoicesList.length === 0 ? (
                      <MenuItem disabled>
                        No voices available. Please download voices first.
                      </MenuItem>
                    ) : (
                      availableVoicesList.map((voice) => (
                        <MenuItem key={voice.id} value={voice.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={voice.quality} 
                              size="small" 
                              color={getQualityColor(voice.quality)}
                            />
                            {voice.name}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={generateTTS}
                  disabled={isGenerating || !ttsText.trim() || !selectedVoice || availableVoicesList.length === 0}
                  startIcon={isGenerating ? <CircularProgress size={20} /> : <VolumeUp />}
                  sx={{ height: '56px' }}
                >
                  {isGenerating ? 'Generating...' : 'Generate TTS Audio'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderVoiceManagement = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Voice Management
      </Typography>
      
      {Object.entries(voicesByLanguage).map(([langFamily, langData]) => {
        const voices = langData.voices || [];
        
        return (
          <Accordion key={langFamily}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" width="100%">
                <Language sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {langData.language_name}
                </Typography>
                <Badge badgeContent={voices.length} color="primary" sx={{ mr: 2 }}>
                  <Chip 
                    label={`${voices.length} voices`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Badge>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {voices.map((voice) => {
                  const voiceExists = additionalVoices[voice.key]?.exists || false;
                  const isDownloading = downloadingVoices[voice.key] || false;
                  const isRemoving = removingVoices[voice.key] || false;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={voice.key}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {voice.name}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Chip 
                              label={voice.quality} 
                              size="small" 
                              color={getQualityColor(voice.quality)}
                            />
                            {voice.country && (
                              <Chip 
                                label={voice.country} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            Size: {voice.size}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={1}>
                            {voiceExists ? (
                              <>
                                <Chip 
                                  icon={<CheckCircle />} 
                                  label="Downloaded" 
                                  color="success" 
                                  size="small"
                                />
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  startIcon={isRemoving ? <CircularProgress size={16} /> : <Stop />}
                                  onClick={() => removeVoice(voice.key)}
                                  disabled={isRemoving}
                                >
                                  {isRemoving ? 'Removing...' : 'Remove'}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />}
                                onClick={() => downloadVoice(voice.key)}
                                disabled={isDownloading}
                                fullWidth
                              >
                                {isDownloading ? 'Downloading...' : 'Download'}
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Mock Mode Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          TTS Manager
        </Typography>
        
        {ttsStatus && (
          <FormControlLabel
            control={
              <Switch
                checked={ttsStatus.mock_mode}
                onChange={(e) => toggleMockMode(e.target.checked)}
                color="primary"
              />
            }
            label="Mock Mode (for testing)"
          />
        )}
      </Box>

      {/* Status Cards */}
      {ttsStatus && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  TTS System Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mode: {ttsStatus.mock_mode ? 'Mock (Testing)' : 'Real (Piper)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {ttsStatus.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Voices
                </Typography>
                <Typography variant="h4" color="primary">
                  {Object.values(availableVoices).filter(v => v.exists).length + Object.values(additionalVoices).filter(v => v.exists).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ready for TTS generation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Downloaded Voices
                </Typography>
                <Typography variant="h4" color="success">
                  {Object.values(additionalVoices).filter(v => v.exists).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Additional voices available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Messages */}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Generate TTS" />
          <Tab label="Voice Management" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderTTSGeneration()}
      {tabValue === 1 && renderVoiceManagement()}
    </Box>
  );
};

export default TTSManager;