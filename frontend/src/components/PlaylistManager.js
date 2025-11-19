import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Grid,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  DragIndicator as DragIcon,
  MusicNote as MusicIcon,
  Radio as RadioIcon,
  Link as LinkIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import api from '../api';

function PlaylistManager() {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [sounds, setSounds] = useState([]);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  
  // Form states
  const [playlistForm, setPlaylistForm] = useState({ name: '', description: '' });
  const [itemType, setItemType] = useState('audio'); // 'audio' or 'stream'
  const [selectedSound, setSelectedSound] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamName, setStreamName] = useState('');
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadPlaylists();
    loadSounds();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      loadPlaylistItems(selectedPlaylist.id);
    }
  }, [selectedPlaylist]);

  const loadPlaylists = async () => {
    try {
      const data = await api.getPlaylists();
      // Ensure data is an array
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading playlists:', error);
      showSnackbar('Error loading playlists', 'error');
      setPlaylists([]); // Set empty array on error
    }
  };

  const loadSounds = async () => {
    try {
      const data = await api.getAudioFiles();
      setSounds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading sounds:', error);
      setSounds([]);
    }
  };

  const loadPlaylistItems = async (playlistId) => {
    try {
      const data = await api.getPlaylistItems(playlistId);
      setPlaylistItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading playlist items:', error);
      showSnackbar('Error loading playlist items', 'error');
      setPlaylistItems([]);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreatePlaylist = async () => {
    if (!playlistForm.name.trim()) {
      showSnackbar('Please enter a playlist name', 'error');
      return;
    }

    try {
      await api.createPlaylist(playlistForm.name, playlistForm.description);
      setCreateDialogOpen(false);
      setPlaylistForm({ name: '', description: '' });
      loadPlaylists();
      showSnackbar('Playlist created successfully');
    } catch (error) {
      console.error('Error creating playlist:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Error creating playlist';
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!playlistForm.name.trim()) {
      showSnackbar('Please enter a playlist name', 'error');
      return;
    }

    try {
      await api.updatePlaylist(selectedPlaylist.id, {
        name: playlistForm.name,
        description: playlistForm.description
      });
      setEditDialogOpen(false);
      setPlaylistForm({ name: '', description: '' });
      loadPlaylists();
      showSnackbar('Playlist updated successfully');
    } catch (error) {
      console.error('Error updating playlist:', error);
      showSnackbar('Error updating playlist', 'error');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      await api.deletePlaylist(playlistId);
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
        setPlaylistItems([]);
      }
      loadPlaylists();
      showSnackbar('Playlist deleted successfully');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showSnackbar('Error deleting playlist', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!selectedPlaylist) return;

    try {
      const position = playlistItems.length;
      
      if (itemType === 'audio') {
        if (!selectedSound) {
          showSnackbar('Please select an audio file', 'error');
          return;
        }
        await api.addPlaylistItem(selectedPlaylist.id, position, parseInt(selectedSound), null, null);
      } else {
        if (!streamUrl.trim() || !streamName.trim()) {
          showSnackbar('Please enter stream URL and name', 'error');
          return;
        }
        await api.addPlaylistItem(selectedPlaylist.id, position, null, streamUrl, streamName);
      }

      setAddItemDialogOpen(false);
      setSelectedSound('');
      setStreamUrl('');
      setStreamName('');
      loadPlaylistItems(selectedPlaylist.id);
      showSnackbar('Item added to playlist');
    } catch (error) {
      console.error('Error adding item:', error);
      showSnackbar('Error adding item to playlist', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.deletePlaylistItem(selectedPlaylist.id, itemId);
      loadPlaylistItems(selectedPlaylist.id);
      showSnackbar('Item removed from playlist');
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Error removing item', 'error');
    }
  };

  const openEditDialog = (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistForm({ name: playlist.name, description: playlist.description || '' });
    setEditDialogOpen(true);
  };

  const moveItemUp = async (index) => {
    if (index === 0) return; // Already at top
    
    const newItems = [...playlistItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    
    // Update positions
    const itemPositions = {};
    newItems.forEach((item, idx) => {
      itemPositions[item.id] = idx;
    });
    
    try {
      await api.reorderPlaylistItems(selectedPlaylist.id, itemPositions);
      setPlaylistItems(newItems);
      showSnackbar('Item moved up');
    } catch (error) {
      console.error('Error reordering items:', error);
      showSnackbar('Error reordering items', 'error');
    }
  };

  const moveItemDown = async (index) => {
    if (index === playlistItems.length - 1) return; // Already at bottom
    
    const newItems = [...playlistItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
    // Update positions
    const itemPositions = {};
    newItems.forEach((item, idx) => {
      itemPositions[item.id] = idx;
    });
    
    try {
      await api.reorderPlaylistItems(selectedPlaylist.id, itemPositions);
      setPlaylistItems(newItems);
      showSnackbar('Item moved down');
    } catch (error) {
      console.error('Error reordering items:', error);
      showSnackbar('Error reordering items', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Playlist Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Playlist
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Playlists List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Playlists</Typography>
            <List>
              {playlists.map((playlist) => (
                <ListItem
                  key={playlist.id}
                  button
                  selected={selectedPlaylist?.id === playlist.id}
                  onClick={() => setSelectedPlaylist(playlist)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      }
                    }
                  }}
                >
                  <ListItemText
                    primary={playlist.name}
                    secondary={playlist.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(playlist);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {playlists.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No playlists yet. Create one to get started!
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Playlist Items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedPlaylist ? `${selectedPlaylist.name} - Items` : 'Select a playlist'}
              </Typography>
              {selectedPlaylist && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddItemDialogOpen(true)}
                >
                  Add Item
                </Button>
              )}
            </Box>

            {selectedPlaylist ? (
              <List>
                {playlistItems.map((item, index) => (
                  <ListItem
                    key={item.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <DragIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    {item.sound_id ? (
                      <MusicIcon sx={{ mr: 1, color: 'primary.main' }} />
                    ) : (
                      <RadioIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    )}
                    <ListItemText
                      primary={item.sound ? item.sound.name : item.stream_name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={item.sound_id ? 'Audio File' : 'Radio Stream'}
                            size="small"
                            color={item.sound_id ? 'primary' : 'secondary'}
                          />
                          {item.stream_url && (
                            <Chip
                              label={item.stream_url}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUpIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => moveItemDown(index)}
                        disabled={index === playlistItems.length - 1}
                      >
                        <ArrowDownIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {playlistItems.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No items in this playlist. Add audio files or radio streams!
                  </Typography>
                )}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                Select a playlist from the left to view and manage its items
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Playlist</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Playlist Name"
            value={playlistForm.name}
            onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={playlistForm.description}
            onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePlaylist} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Playlist Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Playlist</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Playlist Name"
            value={playlistForm.name}
            onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={playlistForm.description}
            onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePlaylist} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Item to Playlist</DialogTitle>
        <DialogContent>
          <Tabs value={itemType} onChange={(e, v) => setItemType(v)} sx={{ mb: 2 }}>
            <Tab label="Audio File" value="audio" icon={<MusicIcon />} iconPosition="start" />
            <Tab label="Radio Stream" value="stream" icon={<RadioIcon />} iconPosition="start" />
          </Tabs>

          {itemType === 'audio' ? (
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Audio File</InputLabel>
              <Select
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value)}
                label="Select Audio File"
              >
                {sounds.map((sound) => (
                  <MenuItem key={sound.id} value={sound.id}>
                    {sound.name} ({sound.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <>
              <TextField
                fullWidth
                label="Stream Name"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                margin="normal"
                required
                helperText="Display name for the stream"
              />
              <TextField
                fullWidth
                label="Stream URL"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                margin="normal"
                required
                placeholder="https://streamurl.link/..."
                helperText="Direct MP3 stream URL from streamurl.link"
                InputProps={{
                  startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">Add Item</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PlaylistManager;
