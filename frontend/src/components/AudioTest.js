import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';

export default function AudioTest({ audioFile }) {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const testAudioLoad = async () => {
    if (!audioFile) return;
    
    setStatus('Testing audio load...');
    setError('');
    
    try {
      // Test 1: Try to fetch the file
      const response = await fetch(`/api/sounds/${audioFile.id}/stream`);
      setStatus(`Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Test 2: Check response headers and content type
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      setStatus(`Response: ${response.status} ${response.statusText} | Content-Type: ${contentType} | Content-Length: ${contentLength}`);
      
      // Test 3: Try to get array buffer
      const arrayBuffer = await response.arrayBuffer();
      setStatus(`Array buffer size: ${arrayBuffer.byteLength} bytes`);
      
      // Test 4: Check what's actually in the buffer (first 100 bytes as text)
      const firstBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(100, arrayBuffer.byteLength)));
      const textContent = new TextDecoder().decode(firstBytes);
      setStatus(`Array buffer size: ${arrayBuffer.byteLength} bytes | First 100 bytes: ${textContent}`);
      
      // Test 5: Try to decode audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setStatus(`Audio decoded successfully! Duration: ${audioBuffer.duration}s, Channels: ${audioBuffer.numberOfChannels}, Sample Rate: ${audioBuffer.sampleRate}Hz`);
      
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Audio test error:', err);
    }
  };

  const testDirectEndpoint = async () => {
    if (!audioFile) return;
    
    setStatus('Testing direct endpoint...');
    setError('');
    
    try {
      const response = await fetch(`/api/sounds/${audioFile.id}`);
      setStatus(`Direct endpoint response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        setStatus(`Sound data: ${JSON.stringify(data, null, 2)}`);
        
        // Check if file path exists and show file info
        if (data.file_path) {
          setStatus(`File path: ${data.file_path} | File exists: ${data.file_path ? 'Yes' : 'No'}`);
        }
      }
      
    } catch (err) {
      setError(`Direct endpoint error: ${err.message}`);
      console.error('Direct endpoint test error:', err);
    }
  };

  const testDebugFiles = async () => {
    setStatus('Testing debug files endpoint...');
    setError('');
    
    try {
      const response = await fetch('/api/sounds/debug/files');
      setStatus(`Debug endpoint response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        setStatus(`Debug info: ${JSON.stringify(data, null, 2)}`);
      }
      
    } catch (err) {
      setError(`Debug endpoint error: ${err.message}`);
      console.error('Debug endpoint error:', err);
    }
  };

  if (!audioFile) return null;

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Audio Test for: {audioFile.name}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button onClick={testAudioLoad} variant="contained" sx={{ mr: 1 }}>
          Test Audio Load
        </Button>
        <Button onClick={testDirectEndpoint} variant="outlined" sx={{ mr: 1 }}>
          Test Direct Endpoint
        </Button>
        <Button onClick={testDebugFiles} variant="outlined" color="secondary">
          Debug Files
        </Button>
      </Box>
      
      {status && (
        <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace' }}>
          {status}
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
