import React, { useRef, useState } from "react";
import { Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import api from "../api";

export default function AudioUpload({ onSuccess }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    tags: '',
    type: 'music'
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Set default name from filename
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    setUploadForm(prev => ({ ...prev, name: fileName }));
  };

  const handleUpload = async () => {
    const file = inputRef.current.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      formData.append('type', uploadForm.type);
      
      await api.uploadSound(formData);
      onSuccess();
      // Reset form
      setUploadForm({ name: '', description: '', tags: '', type: 'music' });
      inputRef.current.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ border: "2px dashed #ccc", p: 2, mb: 2, textAlign: "center" }}>
      <input
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={handleFileChange}
      />
      <CloudUploadIcon sx={{ fontSize: 40 }} />
      <Typography variant="body2">Drag & drop or</Typography>
      <Button onClick={() => inputRef.current.click()}>Choose File</Button>
      
      {inputRef.current?.files[0] && (
        <Box sx={{ mt: 2, textAlign: 'left' }}>
          <Typography variant="h6" gutterBottom>File Details</Typography>
          <TextField
            fullWidth
            label="Name"
            value={uploadForm.name}
            onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={uploadForm.description}
            onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={uploadForm.tags}
            onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={uploadForm.type}
              onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
              label="Type"
            >
              <MenuItem value="music">Music</MenuItem>
              <MenuItem value="bell">Bell</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
              <MenuItem value="tts">Text-to-Speech</MenuItem>
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            onClick={handleUpload} 
            disabled={uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Audio'}
          </Button>
        </Box>
      )}
    </Box>
  );
}