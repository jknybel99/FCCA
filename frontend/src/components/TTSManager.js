import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  VolumeUp,
  Language
} from '@mui/icons-material';
import api from '../api';

export default function TTSManager() {
  const [text, setText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [availableVoices, setAvailableVoices] = useState({});
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailableVoices();
  }, []);

  const loadAvailableVoices = async () => {
    try {
      const voices = await api.getAvailableVoices();
      setAvailableVoices(voices.voices);
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load available voices');
    }
  };

  const detectLanguage = async () => {
    if (!text.trim()) return;
    
    try {
      const result = await api.detectLanguage(text);
      setDetectedLanguage(result);
    } catch (error) {
      console.error('Error detecting language:', error);
    }
  };

  const generateTTS = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const language = selectedLanguage === 'auto' ? null : selectedLanguage;
      const response = await api.generateTTS(text, language);
      
      // Create blob URL for audio playback
      const blob = new Blob([response], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating TTS:', error);
      setError('Failed to generate TTS audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const stopAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleTextChange = (newText) => {
    setText(newText);
    if (selectedLanguage === 'auto' && newText.trim()) {
      // Debounce language detection
      setTimeout(() => detectLanguage(), 1000);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Text-to-Speech Manager
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generate TTS Audio
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Text to convert to speech"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            margin="normal"
            placeholder="Enter text in English or Spanish..."
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                label="Language"
              >
                <MenuItem value="auto">Auto-detect</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
              </Select>
            </FormControl>

            {detectedLanguage && selectedLanguage === 'auto' && (
              <Chip
                icon={<Language />}
                label={`Detected: ${detectedLanguage.voice_name}`}
                color="primary"
                variant="outlined"
              />
            )}

            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={generateTTS}
              disabled={isGenerating || !text.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate TTS'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {audioUrl && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generated Audio
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <audio controls src={audioUrl} />
              <IconButton onClick={stopAudio} color="error">
                <Stop />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Voices
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(availableVoices).map(([lang, voice]) => (
              <Chip
                key={lang}
                label={voice.name}
                color="primary"
                variant="outlined"
                icon={<VolumeUp />}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

