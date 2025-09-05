import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  MusicNote as MusicNoteIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Tag as TagIcon,
  Upload as UploadIcon,
  ContentCut as CutIcon
} from '@mui/icons-material';
import AudioUpload from './AudioUpload';
import AudioEditor from './AudioEditor';
import api from '../api';

const SOUND_TYPES = [
  { value: 'bell', label: 'Bell', icon: <ScheduleIcon />, color: '#f44336' },
  { value: 'music', label: 'Music', icon: <MusicNoteIcon />, color: '#2196f3' },
  { value: 'announcement', label: 'Announcement', icon: <NotificationsIcon />, color: '#4caf50' },
  { value: 'tts', label: 'Text-to-Speech', icon: <NotificationsIcon />, color: '#ff9800' }
];

export default function AudioLibrary() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: '',
    tags: ''
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    loadAudioFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [audioFiles, selectedType, searchQuery]);

  const loadAudioFiles = async () => {
    try {
      const files = await api.getAudioFiles();
      setAudioFiles(files);
    } catch (error) {
      console.error('Error loading audio files:', error);
    }
  };

  const filterFiles = () => {
    let filtered = audioFiles;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        (file.description && file.description.toLowerCase().includes(query)) ||
        (file.tags && file.tags.toLowerCase().includes(query))
      );
    }

    setFilteredFiles(filtered);
  };

  const handleUploadSuccess = () => {
    loadAudioFiles();
  };

  const handleEditFile = (file) => {
    setSelectedFile(file);
    setEditForm({
      name: file.name,
      description: file.description || '',
      type: file.type || 'music',
      tags: file.tags || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateSound(selectedFile.id, editForm);
      setEditDialogOpen(false);
      setSelectedFile(null);
      loadAudioFiles();
    } catch (error) {
      console.error('Error updating sound:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.deleteSound(fileId);
        loadAudioFiles();
      } catch (error) {
        console.error('Error deleting sound:', error);
      }
    }
  };

  const handleEditAudio = (file) => {
    setEditingFile(file);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingFile(null);
  };

  const handleEditorSave = () => {
    setEditorOpen(false);
    setEditingFile(null);
    // Optionally reload audio files if needed
  };

  const handlePlayFile = async (fileId) => {
    if (playingAudio === fileId) {
      // Stop audio
      try {
        await api.stopAllAudio();
        setPlayingAudio(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
        setPlayingAudio(null);
      }
      return;
    }
    
    try {
      setPlayingAudio(fileId);
      await api.playSound(fileId);
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (playingAudio === fileId) {
          setPlayingAudio(null);
        }
      }, 5000);
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingAudio(null);
    }
  };

  const getTypeIcon = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.icon : <MusicNoteIcon />;
  };

  const getTypeColor = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.color : '#757575';
  };

  const getTypeLabel = (type) => {
    const soundType = SOUND_TYPES.find(t => t.value === type);
    return soundType ? soundType.label : 'Unknown';
  };

  const getStats = () => {
    const stats = {
      total: audioFiles.length,
      bell: audioFiles.filter(f => f.type === 'bell').length,
      music: audioFiles.filter(f => f.type === 'music').length,
      announcement: audioFiles.filter(f => f.type === 'announcement').length,
      tts: audioFiles.filter(f => f.type === 'tts').length
    };
    return stats;
  };

  const stats = getStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Audio Library
      </Typography>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" style={{ color: '#f44336' }}>
                {stats.bell}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bell Sounds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" style={{ color: '#2196f3' }}>
                {stats.music}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Music Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" style={{ color: '#4caf50' }}>
                {stats.announcement + stats.tts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Announcements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="All Files" />
          <Tab label="Upload" />
        </Tabs>
      </Paper>

      {currentTab === 0 && (
        <>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      label="Filter by Type"
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {SOUND_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Files Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Chip
                        icon={getTypeIcon(file.type)}
                        label={getTypeLabel(file.type)}
                        size="small"
                        style={{ backgroundColor: getTypeColor(file.type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      {file.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {file.description}
                        </Typography>
                      )}
                      <Typography variant="body2" fontWeight="bold">
                        {file.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {file.tags && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {file.tags.split(',').map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag.trim()}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {file.duration ? `${Math.floor(file.duration / 60)}:${(file.duration % 60).toString().padStart(2, '0')}` : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handlePlayFile(file.id)}
                        color={playingAudio === file.id ? 'secondary' : 'primary'}
                      >
                        {playingAudio === file.id ? <StopIcon /> : <PlayIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditFile(file)}
                        color="primary"
                        title="Edit File Info"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAudio(file)}
                        color="secondary"
                        title="Edit Audio (Trim/Fade)"
                      >
                        <CutIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFile(file.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery || selectedType !== 'all' 
                          ? 'No files match your search criteria.' 
                          : 'No audio files uploaded yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Audio Files
            </Typography>
            <AudioUpload onSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>
      )}

      {/* Edit File Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Audio File</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              label="Type"
            >
              {SOUND_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            margin="normal"
            helperText="Enter tags separated by commas (e.g., morning, bell, primary)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Audio Editor Dialog */}
      <AudioEditor
        open={editorOpen}
        onClose={handleEditorClose}
        audioFile={editingFile}
        onSave={handleEditorSave}
      />
    </Box>
  );
}
