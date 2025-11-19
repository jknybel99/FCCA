import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  Chip
} from '@mui/material';
import {
  Stop,
  SkipNext,
  SkipPrevious,
  PlayArrow,
  Radio
} from '@mui/icons-material';
import { usePlaylist } from '../contexts/PlaylistContext';

const GlobalPlaybackControl = () => {
  const {
    isPlaylistPlaying,
    currentTrackName,
    selectedPlaylist,
    currentPlaylistIndex,
    playlistItems,
    stopPlaylist,
    playNextItem,
    playPreviousItem
  } = usePlaylist();

  if (!isPlaylistPlaying || !currentTrackName) {
    return null;
  }

  return (
    <Slide direction="up" in={isPlaylistPlaying} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          p: 2,
          minWidth: 300,
          maxWidth: 400,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Radio sx={{ color: 'white' }} />
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Now Playing
          </Typography>
          <Chip 
            label={selectedPlaylist?.name || 'Playlist'} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontSize: '0.7rem'
            }} 
          />
        </Box>
        
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 'bold', 
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {currentTrackName}
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Track {currentPlaylistIndex + 1} of {playlistItems.length}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={0.5}>
            <IconButton
              size="small"
              onClick={playPreviousItem}
              disabled={currentPlaylistIndex === 0}
              sx={{ color: 'white' }}
            >
              <SkipPrevious />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={stopPlaylist}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <Stop />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={playNextItem}
              disabled={currentPlaylistIndex >= playlistItems.length - 1}
              sx={{ color: 'white' }}
            >
              <SkipNext />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default GlobalPlaybackControl;
